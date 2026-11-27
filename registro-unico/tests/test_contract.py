import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
APPS = ROOT / 'appscript'


class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.code = (APPS / 'Code.gs').read_text()
        cls.html = (APPS / 'Registro.html').read_text()
        cls.manifest = json.loads((APPS / 'appsscript.json').read_text())

    def test_htmlservice_package_is_one_integrated_app(self):
        self.assertEqual(sorted(p.name for p in APPS.iterdir()), ['Code.gs', 'Registro.html', 'appsscript.json'])
        self.assertTrue((APPS / 'Code.gs').is_file())
        self.assertIn('<style>', self.html)
        self.assertNotIn("include('Styles')", self.html)
        for helper in ('normalizeEmail_', 'validateEmail_', 'validateRole_', 'validateRecord_'):
            self.assertIn('function ' + helper, self.code)

    def test_web_app_runs_as_accessing_user_and_requires_google_account(self):
        self.assertEqual(self.manifest['webapp']['executeAs'], 'USER_ACCESSING')
        self.assertEqual(self.manifest['webapp']['access'], 'ANYONE')
        self.assertIn('https://www.googleapis.com/auth/userinfo.email', self.manifest['oauthScopes'])
        self.assertIn('https://www.googleapis.com/auth/script.container.ui', self.manifest['oauthScopes'])

    def test_menu_launches_same_htmlservice_app_and_separates_admin(self):
        menu = re.search(r'function\s+onOpen\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(menu)
        self.assertIn("addItem('Abrir Registro Único', 'registroUnicoOpenApp')", menu.group(1))
        self.assertIn("addItem('Administración', 'registroUnicoOpenAdmin')", menu.group(1))
        self.assertIn("addItem('Vincular esta planilla', 'registroUnicoBindActiveSpreadsheet')", menu.group(1))
        self.assertNotIn('currentEmail_()', menu.group(1))
        self.assertNotIn('isSpreadsheetOwner_', menu.group(1))
        self.assertIn('function registroUnicoOpenApp()', self.code)
        self.assertIn('function registroUnicoOpenAdmin()', self.code)
        self.assertIn("renderRegistroUnico_('records')", self.code)
        self.assertIn("renderRegistroUnico_('admin')", self.code)
        self.assertIn('showModalDialog(', self.code)
        self.assertNotIn('showSidebar(', self.code)

    def test_do_get_and_menu_share_integrated_html(self):
        self.assertRegex(self.code, r'function doGet\(e\)[\s\S]*?renderRegistroUnico_\(page\)')
        self.assertRegex(self.code, r'function renderRegistroUnico_\(page\)[\s\S]*?createTemplateFromFile\(\'Registro\'\)')
        self.assertIn('template.startPage = page', self.code)
        self.assertIn('document.body.dataset.startPage', self.html)
        self.assertIn('id="recordsView"', self.html)
        self.assertIn('id="adminView"', self.html)
        self.assertIn("setView('records');refreshRecords();", self.html)

    def test_html_calls_allowlisted_server_rpc_not_individual_globals(self):
        self.assertIn('google.script.run', self.html)
        self.assertIn('runner.runRegistroUnicoApi({action:action,payload:payload||{}})', self.html)
        self.assertIn('function runRegistroUnicoApi(request)', self.code)
        for public_name in ('apiBootstrap', 'apiListRecords', 'apiSaveRecord', 'apiDeleteRecord', 'apiAdminListUsers', 'apiAdminSaveUser'):
            self.assertNotRegex(self.code, r'function\s+' + public_name + r'\(')
        for private_name in ('apiBootstrap_', 'apiListRecords_', 'apiSaveRecord_', 'apiDeleteRecord_', 'apiAdminListUsers_', 'apiAdminSaveUser_'):
            self.assertRegex(self.code, r'function\s+' + private_name + r'\(')
        for action in ('bootstrap', 'listRecords', 'saveRecord', 'deleteRecord', 'listUsers', 'saveUser'):
            self.assertIn("case '" + action + "'", self.code)
        self.assertIn('Acción no válida.', self.code)
        self.assertNotRegex(self.html, r'runner\[(name|action)\]')
        self.assertNotIn('fetch(', self.html)
        self.assertNotIn('script.google.com/macros/s/', self.html)

    def test_initial_admin_is_bootstrapped_from_sheet_owner_and_roles_allowlisted(self):
        self.assertIn("initialAdminKey: 'REGISTRO_UNICO_INITIAL_ADMIN_EMAIL'", self.code)
        self.assertIn('setProperty(APP_.initialAdminKey, ownerEmail)', self.code)
        self.assertIn('El valor de REGISTRO_UNICO_INITIAL_ADMIN_EMAIL no es un correo válido.', self.code)
        self.assertRegex(self.code, r"\['admin',\s*'user1',\s*'user2'\]")
        self.assertIsNone(re.search(r"['\"][^'\"\\s]+@[^'\"\\s]+\\.[^'\"\\s]+['\"]", self.code))

    def test_every_data_operation_checks_active_app_user(self):
        for fn in ('apiListRecords_', 'apiSaveRecord_', 'apiDeleteRecord_'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireUser_()', body.group(1), fn)

    def test_admin_endpoints_require_owner_admin_and_manage_sheet_permission(self):
        for fn in ('apiAdminListUsers_', 'apiAdminSaveUser_'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireOwnerAdmin_()', body.group(1), fn)
        self.assertIn('ss.addEditor(email)', self.code)
        self.assertIn('ss.removeEditor(email)', self.code)
        self.assertIn('Solo el dueño de la planilla', self.code)

    def test_admin_menu_handler_revalidates_owner_before_open(self):
        body = re.search(r'function\s+registroUnicoOpenAdmin\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(body)
        self.assertIn('requireOwnerAdmin_()', body.group(1))

    def test_bootstrap_admin_cannot_be_demoted(self):
        self.assertIn("email === initialAdmin && (!active || role !== 'admin')", self.code)
        self.assertIn("typeof input.active !== 'boolean'", self.code)

    def test_acl_is_not_kept_in_user_editable_sheet(self):
        self.assertIn('PropertiesService.getScriptProperties()', self.code)
        self.assertNotIn("getSheetByName('Usuarios')", self.code)
        self.assertNotIn("insertSheet('Acceso'", self.code)

    def test_binding_is_owner_only_and_does_not_retarget(self):
        body = re.search(r'function\s+registroUnicoBindActiveSpreadsheet\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(body)
        self.assertIn('requireOwnerAdmin_(active)', body.group(1))
        self.assertIn('configuredId !== activeId', body.group(1))
        self.assertIn('LockService.getScriptLock()', body.group(1))
        self.assertIn('ensureDataSheet_', body.group(1))
        self.assertIn('onOpen();', body.group(1))

    def test_record_schema_and_safe_writes_remain(self):
        self.assertIn("headers: ['ID', 'Nombre', 'Apellido', 'DNI', 'Escolaridad'", self.code)
        self.assertIn('sheet.getRange(newRow, 1, 1, APP_.headers.length).setValues(', self.code)
        self.assertIn("setNumberFormat('@')", self.code)
        self.assertIn('cellText_(record.dni)', self.code)
        self.assertIn('sheet.deleteRow(', self.code)
        self.assertIn('sheet.getRange(targetRow', self.code)

    def test_pages_is_only_a_landing_and_has_its_own_index(self):
        page = (ROOT / 'index.html').read_text().lower()
        self.assertIn('script.google.com/macros/s/akfycbxzpfntrgqwvhe69szf600kxxwqyktfp1k3c9-jt7phw70yp9_oexunlsgvcd6f7rr3jq/exec', page)
        self.assertIn('abrir aplicación', page)
        self.assertNotIn('google.accounts', page)
        self.assertNotIn('type="password"', page)
        self.assertTrue((ROOT / 'index.html').is_file())

    def test_project_docs_and_catalog_home_exist(self):
        for name in ('README.md', 'AGENT.md', 'SPEC.md'):
            self.assertTrue((ROOT / name).is_file(), name)
        self.assertTrue((ROOT.parent / 'index.html').is_file())


if __name__ == '__main__':
    unittest.main(verbosity=2)

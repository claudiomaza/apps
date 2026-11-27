import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.code = (ROOT / 'appscript' / 'Code.gs').read_text()
        cls.admin = (ROOT / 'appscript' / 'Admin.html').read_text()
        cls.manifest = json.loads((ROOT / 'appscript' / 'appsscript.json').read_text())

    def test_htmlservice_package_is_self_contained(self):
        appscript = ROOT / 'appscript'
        self.assertFalse((appscript / 'Domain.gs').exists())
        self.assertFalse((appscript / 'Styles.html').exists())
        self.assertTrue((appscript / 'Code.gs').is_file())
        self.assertEqual(sorted(p.name for p in appscript.iterdir()), ['Admin.html', 'Code.gs', 'Index.html', 'appsscript.json'])
        self.assertEqual(sorted(p.name for p in appscript.glob('*.gs')), ['Code.gs'])
        for name in ('Index.html', 'Admin.html'):
            html = (appscript / name).read_text()
            self.assertIn('<style>', html)
            self.assertNotIn("include('Styles')", html)
        for helper in ('normalizeEmail_', 'validateEmail_', 'validateRole_', 'validateRecord_'):
            self.assertIn('function ' + helper, self.code)
        for name in ('Index.html', 'Admin.html'):
            self.assertNotIn('include(', (appscript / name).read_text())

    def test_web_app_runs_as_accessing_user_and_requires_google_account(self):
        self.assertEqual(self.manifest['webapp']['executeAs'], 'USER_DEPLOYING')
        self.assertEqual(self.manifest['webapp']['access'], 'ANYONE')

    def test_initial_admin_is_exact_and_roles_are_allowlisted(self):
        self.assertIn("initialAdminKey: 'REGISTRO_UNICO_INITIAL_ADMIN_EMAIL'", self.code)
        self.assertIn('Para iniciar, abrí la planilla y usá Vincular esta planilla', self.code)
        self.assertIn('El valor de REGISTRO_UNICO_INITIAL_ADMIN_EMAIL no es un correo válido.', self.code)
        self.assertRegex(self.code, r"\['admin',\s*'user1',\s*'user2'\]")

    def test_every_data_operation_checks_active_app_user(self):
        for fn in ('apiListRecords', 'apiSaveRecord', 'apiDeleteRecord'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireUser_()', body.group(1), fn)

    def test_admin_endpoints_check_admin_and_use_sheet_permissions(self):
        for fn in ('apiAdminListUsers', 'apiAdminSaveUser'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireOwnerAdmin_()', body.group(1), fn)
        self.assertIn('ss.addEditor(email)', self.code)
        self.assertIn('ss.removeEditor(email)', self.code)

    def test_bootstrap_admin_cannot_be_demoted(self):
        self.assertIn("email === initialAdmin && (!active || role !== 'admin')", self.code)
        self.assertIn("typeof input.active !== 'boolean'", self.code)

    def test_acl_is_not_kept_in_user_editable_sheet(self):
        self.assertIn('PropertiesService.getScriptProperties()', self.code)
        self.assertNotIn("getSheetByName('Usuarios')", self.code)

    def test_pages_links_to_configured_apps_script_without_collecting_credentials(self):
        page = (ROOT / 'index.html').read_text().lower()
        self.assertIn('https://script.google.com/macros/s/akfycbxzpfntrgqwvhe69szf600kxxwqyktfp1k3c9-jt7phw70yp9_oexunlsgvcd6f7rr3jq/exec', page)
        self.assertIn('abrir aplicación', page)
        self.assertNotIn('disabled aria-disabled="true"', page)
        self.assertNotIn('REEMPLAZAR_CON_ID', page)
        self.assertNotIn('google.accounts', page)
        self.assertNotIn('type="password"', page)

    def test_required_docs_and_catalog_home_exist(self):
        for name in ('README.md', 'AGENT.md', 'SPEC.md'):
            self.assertTrue((ROOT / name).is_file(), name)
        self.assertTrue((ROOT.parent / 'index.html').is_file())

    def test_linking_sheet_does_not_create_an_access_tab(self):
        self.assertNotIn("getSheetByName('Acceso')", self.code)
        self.assertNotIn("insertSheet('Acceso'", self.code)
        self.assertNotIn('ensureAccessSheet_', self.code)
        self.assertNotIn('apiAdminInstallAccessLinks', self.code)
        self.assertNotIn('accessLinksButton', self.admin)
        self.assertNotIn('Agregar accesos en la hoja', self.admin)

    def test_bound_sheet_menu_has_separate_owner_gated_actions(self):
        self.assertIn('function onOpen()', self.code)
        self.assertIn('createMenu(APP_.name)', self.code)
        self.assertIn("addItem('Abrir Registro Único', 'registroUnicoOpenApp')", self.code)
        self.assertIn("addItem('Administración', 'registroUnicoOpenAdmin')", self.code)
        self.assertIn("addItem('Vincular esta planilla', 'registroUnicoBindActiveSpreadsheet')", self.code)
        self.assertIn('isSpreadsheetOwner_', self.code)
        self.assertIn('showModalDialog(', self.code)
        self.assertNotIn('showSidebar(', self.code)
        self.assertIn('target="_blank"', self.code)
        self.assertTrue((ROOT / 'index.html').is_file())
        self.assertFalse((ROOT / 'sheet-menu').exists())
        self.assertIn('https://www.googleapis.com/auth/script.container.ui', self.manifest['oauthScopes'])
        self.assertTrue((ROOT / 'appscript' / 'Index.html').is_file())
        self.assertNotIn('setupForm', self.admin)
        self.assertNotIn('sheetId', self.admin)
        self.assertIn("url && url + '?page=admin'", self.code)
        self.assertIn('function registroUnicoOpenAdmin()', self.code)
        self.assertIn('function registroUnicoOpenApp()', self.code)
        self.assertNotIn('function registroUnicoOpenPanel()', self.code)
        self.assertNotIn('document.getElementById("bind").addEventListener', self.code)

    def test_first_sheet_owner_is_bootstrapped_as_admin_without_public_email(self):
        body = re.search(r'function\s+registroUnicoBindActiveSpreadsheet\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(body)
        code = body.group(1)
        self.assertIn('getOwner()', code)
        self.assertIn('currentEmail_()', code)
        self.assertIn('setProperty(APP_.initialAdminKey, ownerEmail)', code)
        self.assertIn('requireOwnerAdmin_(active)', code)
        self.assertLess(code.index('setProperty(APP_.initialAdminKey, ownerEmail)'), code.index('requireOwnerAdmin_(active)'))
        self.assertIn('props.getProperty(APP_.usersKey)', code)
        self.assertIn('!ownerEmail || ownerEmail !== currentEmail_()', code)
        self.assertIn('Falta la configuración del administrador inicial.', code)
        self.assertIsNone(re.search(r"['\"][^'\"\\s]+@[^'\"\\s]+\\.[^'\"\\s]+['\"]", self.code))

    def test_menu_action_dialogs_open_links_in_new_tab(self):
        self.assertIn('target="_blank"', self.code)
        self.assertIn('showModalDialog(', self.code)
        self.assertIn('function registroUnicoOpenApp()', self.code)
        self.assertIn('function registroUnicoOpenAdmin()', self.code)
        self.assertIn('requireOwnerAdmin_()', self.code[self.code.index('function registroUnicoOpenAdmin'):self.code.index('function openAppLink_')])
        self.assertIn('htmlAttribute_(url)', self.code)

    def test_only_sheet_owner_sees_bind_and_admin_controls(self):
        menu = re.search(r'function\s+onOpen\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(menu)
        self.assertIn('isSpreadsheetOwner_', menu.group(1))
        self.assertIn("addItem('Vincular esta planilla'", menu.group(1))
        self.assertIn("addItem('Administración'", menu.group(1))
        self.assertIn('if (canAdmin)', menu.group(1))
        self.assertIn('function requireOwnerAdmin_', self.code)
        for fn in ('apiAdminListUsers', 'apiAdminSaveUser', 'registroUnicoBindActiveSpreadsheet'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireOwnerAdmin_', body.group(1), fn)
        self.assertIn('ctx.canAdmin', (ROOT / 'appscript' / 'Admin.html').read_text())
        self.assertIn('ctx.canAdmin', (ROOT / 'appscript' / 'Index.html').read_text())

    def test_bootstrap_exposes_admin_capability_only_to_sheet_owner(self):
        body = re.search(r'function\s+apiBootstrap\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(body)
        self.assertIn('isSpreadsheetOwner_', body.group(1))
        self.assertIn("canAdmin: user.role === 'admin' && isOwner", body.group(1))
        helper = re.search(r'function\s+requireOwnerAdmin_\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(helper)
        self.assertIn('requireAdmin_()', helper.group(1))
        self.assertIn('isSpreadsheetOwner_(spreadsheet, user.email)', helper.group(1))
        self.assertIn('Solo el dueño de la planilla', helper.group(1))
        self.assertIn('return false;', self.code[self.code.index('function isSpreadsheetOwner_'):self.code.index('function currentEmail_')])

    def test_sheet_binding_cannot_silently_retarget_configured_database(self):
        body = re.search(r'function\s+registroUnicoBindActiveSpreadsheet\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
        self.assertIsNotNone(body)
        self.assertIn('requireOwnerAdmin_(active)', body.group(1))
        self.assertIn('getId()', body.group(1))
        self.assertIn('configuredId !== activeId', body.group(1))
        self.assertIn('throw new Error(', body.group(1))
        self.assertIn('LockService.getScriptLock()', body.group(1))
        self.assertIn('configuredSpreadsheet_', body.group(1))
        self.assertIn('configureSpreadsheet_', body.group(1))
        self.assertIn('ensureDataSheet_', self.code)
        self.assertIn('onOpen();', body.group(1))
        self.assertNotIn('function apiAdminConfigureSpreadsheet(', self.code)

    def test_record_columns_and_reversible_changes_are_accounted_for(self):
        self.assertIn("'ID', 'Nombre', 'Apellido', 'DNI', 'Escolaridad'", self.code)
        self.assertIn('sheet.getRange(newRow, 1, 1, APP_.headers.length).setValues(', self.code)
        self.assertIn("setNumberFormat('@')", self.code)
        self.assertIn('cellText_(record.dni)', self.code)
        self.assertIn('sheet.deleteRow(', self.code)
        self.assertIn('sheet.getRange(targetRow', self.code)

if __name__ == '__main__':
    unittest.main(verbosity=2)

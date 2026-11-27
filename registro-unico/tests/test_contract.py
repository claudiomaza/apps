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
        self.assertIn('Falta configurar la propiedad de script REGISTRO_UNICO_INITIAL_ADMIN_EMAIL', self.code)
        self.assertIn('El valor de REGISTRO_UNICO_INITIAL_ADMIN_EMAIL no es un correo válido.', self.code)
        self.assertRegex(self.code, r"\['admin',\s*'user1',\s*'user2'\]")

    def test_every_data_operation_checks_active_app_user(self):
        for fn in ('apiListRecords', 'apiSaveRecord', 'apiDeleteRecord'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireUser_()', body.group(1), fn)

    def test_admin_endpoints_check_admin_and_use_sheet_permissions(self):
        for fn in ('apiAdminListUsers', 'apiAdminConfigureSpreadsheet', 'apiAdminSaveUser'):
            body = re.search(r'function\s+' + fn + r'\([^)]*\)\s*\{([\s\S]*?)\n\}', self.code)
            self.assertIsNotNone(body, fn)
            self.assertIn('requireAdmin_()', body.group(1), fn)
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

    def test_sheet_menu_is_a_bound_script_with_admin_button(self):
        menu = (ROOT / 'sheet-menu' / 'Code.gs').read_text()
        self.assertIn("createMenu('Registro Único')", menu)
        self.assertIn("addItem('Abrir administración', 'registroUnicoOpenAdmin')", menu)
        self.assertIn('showSidebar(', menu)
        self.assertIn('Abrir administración</a>', menu)
        self.assertIn("createHtmlOutput(", menu)
        menu_manifest = json.loads((ROOT / 'sheet-menu' / 'appsscript.json').read_text())
        self.assertIn('https://www.googleapis.com/auth/script.container.ui', menu_manifest['oauthScopes'])
        self.assertIn('https://www.googleapis.com/auth/spreadsheets.currentonly', menu_manifest['oauthScopes'])
        self.assertIn('https://script.google.com/macros/s/AKfycbxZPFNTRGQWvhE69szf600kxXWQYKtfp1K3C9-jT7PhW70yp9_oEXUNlsGVcd6f7RR3jQ/exec?page=admin', menu)
        self.assertNotIn('SpreadsheetApp.openById', menu)
        self.assertNotIn('addEditor(', menu)
        self.assertNotIn('removeEditor(', menu)
        self.assertIn('script vinculado a la planilla', (ROOT / 'README.md').read_text())

    def test_record_columns_and_reversible_changes_are_accounted_for(self):
        self.assertIn("'ID', 'Nombre', 'Apellido', 'DNI', 'Escolaridad'", self.code)
        self.assertIn('sheet.getRange(newRow, 1, 1, APP_.headers.length).setValues(', self.code)
        self.assertIn("setNumberFormat('@')", self.code)
        self.assertIn('cellText_(record.dni)', self.code)
        self.assertIn('sheet.deleteRow(', self.code)
        self.assertIn('sheet.getRange(targetRow', self.code)

if __name__ == '__main__':
    unittest.main(verbosity=2)

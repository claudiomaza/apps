import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class CatalogTests(unittest.TestCase):
    def test_homepage_links_to_the_registry_landing(self):
        home = (ROOT.parent / 'index.html').read_text()
        self.assertIn('href="./registro-unico/"', home)
        self.assertIn('<h2>Registro Único</h2>', home)

    def test_public_landing_exists_at_the_catalog_route(self):
        page = (ROOT / 'index.html').read_text()
        self.assertIn('Abrir aplicación', page)
        self.assertIn('https://script.google.com/macros/s/AKfycbx4nw7eK72BhHiTyTs0HP_uX5D-nVqXudQXcURRum6CQjKbKTlLnToWUq7QxGZodV5F/exec', page)

if __name__ == '__main__':
    unittest.main(verbosity=2)

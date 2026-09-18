#!/usr/bin/env python3
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(base_dir, 'dist')
os.makedirs(dist_dir, exist_ok=True)

with open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

with open(os.path.join(base_dir, 'styles.css'), 'r', encoding='utf-8') as f:
    css = f.read()

with open(os.path.join(base_dir, 'data.js'), 'r', encoding='utf-8') as f:
    data_js = f.read()

with open(os.path.join(base_dir, 'app.js'), 'r', encoding='utf-8') as f:
    app_js = f.read()

# Replace CSS link with inline style
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')

# Replace script links with inline scripts
scripts_bundle = f"""
<script>
/* ================= DATA.JS INLINED ================= */
{data_js}
</script>
<script>
/* ================= APP.JS INLINED ================= */
{app_js}
</script>
"""

html = html.replace('<script src="data.js"></script>', '')
html = html.replace('<script src="app.js"></script>', scripts_bundle)

portable_path = os.path.join(dist_dir, 'kyushu-trip-2026-portable.html')
with open(portable_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Built portable single-file HTML: {portable_path} ({len(html):,} bytes)")

# Update zip file
import zipfile
zip_path = os.path.join(base_dir, 'kyushu-trip-2026.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for filename in ['index.html', 'styles.css', 'data.js', 'app.js', 'README.md', 'server.py']:
        fpath = os.path.join(base_dir, filename)
        if os.path.exists(fpath):
            zf.write(fpath, arcname=filename)
    zf.write(portable_path, arcname='dist/kyushu-trip-2026-portable.html')

print(f"Built zip archive: {zip_path} ({os.path.getsize(zip_path):,} bytes)")

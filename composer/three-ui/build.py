#!/usr/bin/env python3
"""Bundle the skill component showcase and canonical skill texts into one offline HTML."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

def build(root, esbuild=None):
    project = Path(root).resolve()
    source = project / 'composer' / 'three-ui' / 'src'
    html = (source / 'index.html').read_text()
    docs = {name: (project / 'skills' / name / 'SKILL.md').read_text()
            for name in ['recall', 'architect', 'arena', 'swarm', 'interrogate', 'how']}
    packet = json.dumps(docs, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    html, count = re.subn(r'(<script id="skill-docs" type="application/json">).*?(</script>)', lambda m:m[1]+packet+m[2], html, flags=re.S)
    if count != 1:
        raise ValueError('Expected exactly one skill-docs packet')
    pattern = re.compile(r'<script\s+type="module">(.*?)</script>', re.S)
    match = pattern.search(html)
    if not match:
        raise ValueError('Expected inline module entry')
    binary = esbuild or shutil.which('esbuild')
    if not binary:
        local = project / 'composer' / 'three-ui' / 'node_modules' / '.bin' / 'esbuild'
        binary = str(local) if local.exists() else None
    if not binary:
        raise ValueError('Install build dependencies with npm install in composer/three-ui')
    with tempfile.TemporaryDirectory(dir=source) as tmp:
        entry = Path(tmp)/'entry.js'
        # Keep entry imports relative to source root.
        code = re.sub(r"(from\s*['\"])\./", r'\1../', match[1])
        code = re.sub(r"(import\(['\"])\./", r'\1../', code)
        entry.write_text(code)
        dest = Path(tmp)/'bundle.js'
        subprocess.run([binary, str(entry), '--bundle', '--format=esm', '--minify', '--target=es2022', '--legal-comments=inline', '--outfile='+str(dest)], check=True)
        bundled = dest.read_text().replace('</script', '<\\/script')
    html = pattern.sub(lambda m:'<script type="module">'+bundled+'</script>', html, count=1)
    out=project/'composer'/'three-ui'/'index.html'
    out.write_text(html)
    print(out, str(out.stat().st_size)+' bytes')

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--esbuild')
    args=parser.parse_args()
    build(args.root, args.esbuild)

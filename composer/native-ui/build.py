#!/usr/bin/env python3
"""Inline dependency-free native skill components and exact canonical skill documents."""
import argparse
import json
from pathlib import Path
import re

NAMES = ('recall', 'architect', 'arena', 'swarm', 'interrogate', 'how', 'resolve')

def build(root, output=None):
    root = Path(root).resolve()
    base = root / 'composer' / 'native-ui'
    source = base / 'src'
    html = (source / 'index.html').read_text()
    code = (source / 'components.js').read_text()
    if re.search(r'^\s*import\b', code, re.M):
        raise ValueError('Component source must not depend on external modules')
    exports = re.findall(r'^\s*export\s+(?:async\s+)?(?:function|class|const|let)\s+(\w+)', code, re.M)
    exports += [n.strip() for group in re.findall(r'^\s*export\s*\{([^}]+)\};?', code, re.M) for n in group.split(',')]
    if not exports or any(' ' in n for n in exports):
        raise ValueError('Expected simple named component exports')
    code = re.sub(r'^\s*export\s*\{[^}]+\};?', '', code, flags=re.M)
    code = re.sub(r'^([ \t]*)export\s+', r'\1', code, flags=re.M)
    docs = {name: (root / 'skills' / name / 'SKILL.md').read_text() for name in NAMES}
    packet = json.dumps(docs, ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    html, count = re.subn(r'(<script id="skill-docs" type="application/json">).*?(</script>)',lambda m:m[1]+packet+m[2],html,flags=re.S)
    if count != 1:
        raise ValueError('Expected one skill-docs packet')
    pattern = re.compile(r'(<script\s+type="module"[^>]*>)(.*?)(</script>)', re.S)
    modules = pattern.findall(html)
    if len(modules)!=1:
        raise ValueError('Expected one inline module entry')
    entry=modules[0][1]
    def bind(match):
        names = match[1].replace(' as ', ': ')
        return 'const {'+names+'} = __components;'
    entry,count=re.subn(r"import\s*\{([^}]+)\}\s*from\s*['\"]\./components\.js['\"];?",bind,entry,flags=re.S)
    if count!=1 or re.search(r'\bimport\s*(?:\(|\{|\*)',entry):
        raise ValueError('Expected exactly one named import from ./components.js')
    bundle='const __components = (() => {\n'+code+'\nreturn {'+', '.join(dict.fromkeys(exports))+'};\n})();\n'+entry
    bundle=bundle.replace('</script','<\\/script')
    html=pattern.sub(lambda m:m[1]+'\n'+bundle+'\n'+m[3],html)
    dest=Path(output) if output else base/'index.html'
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(html)
    print(str(dest)+' ('+str(dest.stat().st_size)+' bytes; no third-party runtime)')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    build(args.root,args.output)

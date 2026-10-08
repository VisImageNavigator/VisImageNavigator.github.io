# Run from the working directory (~/Downloads/VIN_tables_eqs_work: raw/pdf, raw/fulltext, models/, out/).
# Order: extract_tables_equations.py -> tables_equations_overrides.py -> package_tables_equations.py
"""Manual fixes from reviewing all algorithm crops (2026-10-07). Re-run after extract.py."""
import json, os, pymupdf
from PIL import Image
FIX = {
    # caption spans 5 lines, so the closing rule was missed; crop down to the rule at 466pt
    'tvcg_2023_3327193_alg_1.png': dict(bottom=int(466 * 300 / 72) + 4),
    # a timing table whose header row starts "Subroutine | Algorithm"
    'tvcg_2023_3326526_alg_7.png': dict(kind='table'),
    # duplicate of Algorithm 1 on the same page (Algorithm 2 is alg_3)
    'tvcg_2025_3634637_alg_2.png': dict(drop=True),
}
papers = [json.loads(l) for l in open('manifest.jsonl')]
for d in papers:
    keep = []
    for r in d['rows']:
        f = FIX.get(r['file'])
        if f and f.get('drop'):
            os.remove(f"out/{d['Year']}/{r['file']}"); continue
        if f and 'bottom' in f:
            r['bottom'] = f['bottom']
            pg = pymupdf.open(f"raw/pdf/{d['ArticleNumber']}.pdf")[r['page'] - 1].get_pixmap(dpi=300)
            Image.frombytes('RGB', (pg.width, pg.height), pg.samples).crop(
                (r['left'], r['top'], r['right'], r['bottom'])).save(f"out/{d['Year']}/{r['file']}")
        if f and 'kind' in f:
            r['kind'] = f['kind']
        keep.append(r)
    # renumber per kind in reading order and rename files
    n = {}
    for r in keep:
        n[r['kind']] = n.get(r['kind'], 0) + 1
        new = r['file'].rsplit('_', 2)[0] + f"_{r['kind']}_{n[r['kind']]}.png"
        if new != r['file']:
            os.rename(f"out/{d['Year']}/{r['file']}", f"out/{d['Year']}/{new}.tmp")
            r['file'] = new + '.tmp'
        r['n'] = n[r['kind']]
    for r in keep:
        if r['file'].endswith('.tmp'):
            os.rename(f"out/{d['Year']}/{r['file']}", f"out/{d['Year']}/{r['file'][:-4]}"); r['file'] = r['file'][:-4]
    d['rows'] = keep
    d['got'] = {k: sum(r['kind'] == k for r in keep) for k in ('table', 'eq', 'alg')}
with open('manifest.jsonl', 'w') as fo:
    for d in papers:
        fo.write(json.dumps(d) + '\n')

# Run from the working directory (~/Downloads/VIN_tables_eqs_work: raw/pdf, raw/fulltext, models/, out/).
# Order: extract_tables_equations.py -> tables_equations_overrides.py -> package_tables_equations.py
"""Detect and crop tables, display equations and algorithms from VIS paper PDFs.

Pages are rendered at 300 dpi (same as the VIS30K crops, 2550x3300 for letter).
Tables/equations come from DocLayout-YOLO; algorithms are located by their
"Algorithm N" caption and bounded by the horizontal rules drawn around them.
Ground-truth counts come from IEEE's full-text HTML (fulltext/<ar>.html).
"""
import json, os, re, sys
import pymupdf
from PIL import Image
from doclayout_yolo import YOLOv10

DPI = 300
S = DPI / 72
RAW = 'raw'
OUT = 'out'
MODEL = YOLOv10('models/doclayout_yolo_docstructbench_imgsz1024.pt')


def gt_counts(ar):
    p = f'{RAW}/fulltext/{ar}.html'
    if not os.path.exists(p):
        return None
    t = open(p, encoding='utf-8', errors='ignore').read()
    if len(t) < 2000:
        return None
    return dict(tables=len(re.findall(r'class="figure figure-full table"', t)),
                equations=len(re.findall(r'<disp-formula', t)),
                algorithms=len(re.findall(r'class="algorithm[ "]', t)))


def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    if inter == 0:
        return 0
    return inter / min((a[2]-a[0])*(a[3]-a[1]), (b[2]-b[0])*(b[3]-b[1]))


def nms(dets, thr=0.5):
    """dets: list of (box, conf). Drop boxes mostly covered by a higher-confidence one."""
    keep = []
    for b, c in sorted(dets, key=lambda x: -x[1]):
        if all(iou(b, k[0]) < thr for k in keep):
            keep.append((b, c))
    return keep


def find_algorithms(page):
    """Return algorithm boxes (in 72-dpi page coords) for 'Algorithm N' captions."""
    W = page.rect.width
    hlines = []
    for d in page.get_drawings():
        for it in d['items']:
            if it[0] == 'l':
                p1, p2 = it[1], it[2]
                if abs(p1.y - p2.y) < 1 and abs(p1.x - p2.x) > 60:
                    hlines.append((min(p1.x, p2.x), p1.y, max(p1.x, p2.x)))
            elif it[0] == 're':
                r = it[1]
                if r.height < 2 and r.width > 60:
                    hlines.append((r.x0, (r.y0+r.y1)/2, r.x1))
    boxes, captions = [], []
    for b in page.get_text('dict')['blocks']:
        for ln in b.get('lines', []):
            txt = ''.join(s['text'] for s in ln['spans']).strip()
            m = re.match(r'^(Algorithm|ALGORITHM)\s+(\d+)\s*[:.]?', txt)
            if not m:
                continue
            bold = any('Bold' in s['font'] or (s['flags'] & 16) for s in ln['spans'][:2])
            x0, y0, x1, y1 = ln['bbox']
            # rules spanning the caption's column
            col = [h for h in hlines if h[0] <= x0 + 5 and h[2] >= x0 + 40]
            above = [h for h in col if y0 - 20 < h[1] <= y0 + 2]
            below = sorted((h for h in col if h[1] > y0 + 3), key=lambda h: h[1])
            if not above and not bold:
                continue  # in-text reference, not a caption
            # algorithm2e/algorithmic ruled: rule under caption, then closing rule
            end = next((h for h in below if h[1] - y1 > 30), None)
            if end is None:
                captions.append((x0, y0, x1, y1))  # bound it with a detector box instead
                continue
            top = above[0][1] if above else y0
            lx = min(h[0] for h in [end] + above + below[:1])
            rx = max(h[2] for h in [end] + above + below[:1])
            boxes.append((int(m.group(2)), (lx - 2, top - 2, rx + 2, end[1] + 2)))
    return boxes, captions


TAB_RE = re.compile(r'^\s*(Table|TABLE)\s*([0-9]+|[IVX]+)\s*([.:]|$)')
FIG_RE = re.compile(r'^\s*(Fig\.|Figure|FIGURE|FIG\.)\s*[0-9]+\s*([.:]|$)')


def caption_lines(page):
    """Text lines that start a 'Table N' or 'Fig. N' caption, as (kind, box in 300-dpi px)."""
    out = []
    for b in page.get_text('dict')['blocks']:
        for ln in b.get('lines', []):
            txt = ''.join(s['text'] for s in ln['spans'])
            kind = 'table' if TAB_RE.match(txt) else 'fig' if FIG_RE.match(txt) else None
            if kind:
                out.append((kind, [v * S for v in ln['bbox']]))
    return out


def has_text(page, b):
    return bool(page.get_textbox(pymupdf.Rect(*[v / S for v in b])).strip())


def near_caption(b, caps, kind, gap=330):
    """A caption of `kind` just above or below box b and overlapping it horizontally."""
    for k, c in caps:
        if k != kind or c[0] > b[2] or c[2] < b[0]:
            continue
        if b[1] - gap < c[3] <= b[1] + 40 or b[3] - 40 <= c[1] < b[3] + gap:
            return True
    return False


ALG_RE = re.compile(r'^\s*(Algorithm|ALGORITHM)\s*[0-9lI]+\b')


def starts_with_algorithm(page, img, b):
    """True if the top of box b (300-dpi px) reads 'Algorithm N' (PDF text, else macOS OCR)."""
    r = pymupdf.Rect(b[0] / S, b[1] / S, b[2] / S, min(b[3], b[1] + 140) / S)
    txt = page.get_textbox(r).strip()
    if txt:
        return bool(ALG_RE.match(txt))
    from ocrmac import ocrmac
    crop = img.crop((int(b[0]), int(b[1]), int(b[2]), int(min(b[3], b[1] + 140))))
    res = ocrmac.OCR(crop, recognition_level='fast').recognize()
    res.sort(key=lambda x: -x[2][1])  # Vision boxes: y from bottom; top line first
    return bool(res) and bool(ALG_RE.match(res[0][0]))


def split_by_captions(b, caps):
    """Split a table box that swallowed several stacked tables at the captions inside it."""
    h = b[3] - b[1]
    inner = sorted(c for c in caps if c[0] < b[2] and c[2] > b[0]
                   and b[1] + 0.05 * h < (c[1] + c[3]) / 2 < b[3] - 0.05 * h)
    if not inner:
        return [b]
    parts, top = [], b[1]
    for c in sorted(inner, key=lambda c: c[1]):
        parts.append([b[0], top, b[2], c[1] - 4])
        top = c[3] + 4
    parts.append([b[0], top, b[2], b[3]])
    return [p for p in parts if p[3] - p[1] > 40]


def process(ar, stem, outdir, expect_algs=False, expect_tables=False):
    doc = pymupdf.open(f'{RAW}/pdf/{ar}.pdf')
    rows = []
    n = {'table': 0, 'eq': 0, 'alg': 0}
    for pno, page in enumerate(doc):
        pix = page.get_pixmap(dpi=DPI)
        img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        found, acaps = find_algorithms(page)
        caps = caption_lines(page)
        algs = [(k, [v * S for v in b]) for k, b in found]
        acaps = [[v * S for v in c] for c in acaps]
        r = MODEL.predict(img, imgsz=1024, conf=0.2, device='mps', verbose=False)[0]
        tabs, forms, fcaps, tcaps = [], [], [], []
        for b, c, s in zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist(), r.boxes.conf.tolist()):
            name = r.names[int(c)]
            if name == 'table' and (s >= 0.5 or any(k == 'table' and min(b[2], cb[2]) - max(b[0], cb[0]) > 0 and 0 <= b[1] - cb[3] <= 200 for k, cb in caps)):
                tabs.append((b, s))
            elif name == 'isolate_formula' and s >= 0.4:
                forms.append((b, s))
            elif name == 'formula_caption' and s >= 0.4:
                fcaps.append(b)
            elif name == 'table_caption' and s >= 0.4:
                tcaps.append(b)
        blocks = [(r.names[int(c)], b) for b, c, s in
                  zip(r.boxes.xyxy.tolist(), r.boxes.cls.tolist(), r.boxes.conf.tolist())
                  if r.names[int(c)] in ('table', 'figure', 'plain text') and s >= 0.3]
        # unruled algorithms: bound the caption with the detector box it heads or ends
        for c in acaps:
            cw = c[2] - c[0]
            hor = [b for _, b in blocks if min(b[2], c[2]) - max(b[0], c[0]) > 0.5 * cw]
            top = [b for b in hor if c[1] - 40 <= b[1] <= c[3] + 40]
            bot = [b for b in hor if c[1] - 80 <= b[3] <= c[3] + 10 and b[1] < c[1] - 50]
            # caption below the listing, inside a text block that runs past it
            inside = [[b[0], b[1], b[2], c[3]] for b in hor if b[1] < c[1] - 50 and b[3] > c[3] + 10
                      and b[0] <= c[0] + 5 and b[2] >= c[2] - 5]
            pick = max(top + bot + inside, key=lambda b: (b[3] - b[1]), default=None)
            if pick:
                algs.append((0, [min(pick[0], c[0]), min(pick[1], c[1]), max(pick[2], c[2]), max(pick[3], c[3])]))
        items = []
        for k, b in algs:
            items.append(('alg', b, 1.0))
        for b0, s in nms(tabs):
            if any(iou(b0, a) > 0.3 for _, a in algs):
                continue
            # a ruled algorithm the caption search could not bound, or one with outlined text
            has_cap = any(b0[0] - 10 <= c[0] and c[1] >= b0[1] - 30 and c[3] <= b0[1] + 0.25 * (b0[3] - b0[1])
                          and c[0] <= b0[2] for c in acaps)
            if has_cap or (expect_algs and starts_with_algorithm(page, img, b0)):
                items.append(('alg', b0, s))
                continue
            tcap_text = [c for k, c in caps if k == 'table']
            for b in split_by_captions(b0, tcaps + tcap_text):
                # keep only real tables: a 'Table N' caption nearby (not a 'Fig. N' one, which
                # IEEE already lists as a figure); outlined-text pages fall back to the IEEE count
                if near_caption(b, caps, 'table'):
                    items.append(('table', b, s))
                elif not near_caption(b, caps, 'fig') and not has_text(page, b) and expect_tables:
                    items.append(('table', b, s))
        for b, s in nms(forms):
            if any(iou(b, a) > 0.3 for _, a in algs) or any(iou(b, t[0]) > 0.5 for t in tabs):
                continue
            b = list(b)
            # attach the equation number sitting on the same line
            cy = (b[1] + b[3]) / 2
            for cb in fcaps:
                if cb[1] - 10 < cy < cb[3] + 10 and cb[0] > b[0]:
                    b[2] = max(b[2], cb[2]); b[1] = min(b[1], cb[1]); b[3] = max(b[3], cb[3])
            items.append(('eq', b, s))
        # reading order: column, then top
        mid = img.width / 2
        items.sort(key=lambda it: (0 if it[1][0] < mid - 50 else 1, it[1][1]))
        for kind, b, s in items:
            pad = 6 if kind != 'alg' else 0
            box = [max(0, int(b[0]) - pad), max(0, int(b[1]) - pad),
                   min(img.width, int(b[2]) + pad), min(img.height, int(b[3]) + pad)]
            if box[2] - box[0] < 30 or box[3] - box[1] < 15:
                continue
            n[kind] += 1
            fn = f'{stem}_{kind}_{n[kind]}.png'
            img.crop(box).save(f'{outdir}/{fn}')
            rows.append(dict(ArticleNumber=ar, kind=kind, n=n[kind], file=fn, page=pno + 1,
                             left=box[0], top=box[1], right=box[2], bottom=box[3],
                             pageW=img.width, pageH=img.height, conf=round(s, 3)))
    return rows


if __name__ == '__main__':
    import pandas as pd
    papers = pd.read_csv('papers_all.csv', dtype={'ArticleNumber': 'Int64'})
    done = set()
    man = 'manifest.jsonl'
    if os.path.exists(man):
        done = {json.loads(l)['ArticleNumber'] for l in open(man) if l.strip()}
    with open(man, 'a') as fo:
        for _, p in papers.iterrows():
            if pd.isna(p.ArticleNumber):
                continue
            ar = str(p.ArticleNumber)
            if ar in done or not os.path.exists(f'{RAW}/pdf/{ar}.pdf'):
                continue
            pref = 'tvcg' if p.PaperType == 'J' else 'vis'
            suffix = p.DOI.split('.')[-1]
            stem = f'{pref}_{p.Year}_{suffix}'
            outdir = f'{OUT}/{p.Year}'
            os.makedirs(outdir, exist_ok=True)
            gt = gt_counts(ar)
            try:
                rows = process(ar, stem, outdir, expect_algs=bool(gt and gt["algorithms"]), expect_tables=bool(gt and gt["tables"]))
            except Exception as e:
                print(ar, 'ERROR', e, flush=True)
                continue
            got = {k: sum(r['kind'] == k for r in rows) for k in ('table', 'eq', 'alg')}
            fo.write(json.dumps(dict(ArticleNumber=ar, Year=int(p.Year), DOI=p.DOI, PaperType=p.PaperType,
                                     gt=gt, got=got, rows=rows)) + '\n')
            fo.flush()
            print(ar, 'gt', gt, 'got', got, flush=True)

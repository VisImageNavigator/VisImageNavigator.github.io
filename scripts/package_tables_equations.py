# Run from the working directory (~/Downloads/VIN_tables_eqs_work: raw/pdf, raw/fulltext, models/, out/).
# Order: extract_tables_equations.py -> tables_equations_overrides.py -> package_tables_equations.py
"""Package the extracted tables/equations/algorithms for Drive + the MemorabilityImageData sheet.

Reads manifest.jsonl (from extract.py) and writes ~/Downloads/VIN_tables_equations/:
  <year>/<file>.png, image_manifest.csv, sheet_rows_tables_equations.csv, README.txt
Captions: table/algorithm captions come from IEEE's full text when the paper's count matches ours;
equations get their LaTeX from IEEE's full text when the counts match.
"""
import csv, html, json, os, re, shutil
import pandas as pd

OUT = os.path.expanduser('~/Downloads/VIN_tables_equations')
REPO = os.path.expanduser('~/VisImageNavigator.github.io')
KIND = {'table': 'Table', 'eq': 'Equations', 'alg': 'Algorithms'}


def strip_tags(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def ieee_items(ar):
    t = open(f'raw/fulltext/{ar}.html', encoding='utf-8', errors='ignore').read()
    tabs = [strip_tags(m) for m in re.findall(
        r'class="figure figure-full table"[^>]*>\s*<div class="figcaption">(.*?)</div>', t, re.S)]
    algs = [strip_tags(m) for m in re.findall(r'class="algorithm[^"]*"[^>]*>\s*<h4>(.*?)</h4>', t, re.S)]
    eqs = [html.unescape(m).strip() for m in re.findall(
        r'<disp-formula[^>]*>.*?<tex-math[^>]*>(.*?)</tex-math>', t, re.S)]
    return {'table': tabs, 'alg': algs, 'eq': eqs}


def paper_meta():
    d = pd.read_csv(f'{REPO}/public/dataset/vispubData30_updated_20260925.csv', low_memory=False, dtype=str)
    d = d[d.Year.astype(int) >= 2021].drop_duplicates('Paper DOI')
    meta = {r['Paper DOI'].lower(): dict(title=r['Paper Title'], url=r['paper_url'],
                                         first=r['Paper FirstPage'], last=r['Paper LastPage'])
            for _, r in d.iterrows()}
    c = pd.read_csv(f'{REPO}/scripts/data/short_papers_2021_2025.csv', dtype=str)
    a = pd.read_csv(os.path.expanduser('~/Downloads/Projects/VIN Research/VIN_papers_2021_2025.csv'), dtype=str)
    for _, r in pd.concat([c, a]).iterrows():
        meta.setdefault(r.DOI.lower(), dict(title=r.Title, url=r.Link, first=r.FirstPage, last=r.LastPage))
    return meta


def main():
    meta = paper_meta()
    papers = [json.loads(l) for l in open('manifest.jsonl')]
    os.makedirs(OUT, exist_ok=True)
    man, sheet = [], []
    for p in papers:
        m = meta[p['DOI'].lower()]
        ie = ieee_items(p['ArticleNumber'])
        for r in p['rows']:
            k = r['kind']
            same = len(ie[k]) == p['got'][k]
            cap = ie[k][r['n'] - 1] if same else ''
            os.makedirs(f"{OUT}/{p['Year']}", exist_ok=True)
            shutil.copy2(f"out/{p['Year']}/{r['file']}", f"{OUT}/{p['Year']}/{r['file']}")
            man.append(dict(Year=p['Year'], DOI=p['DOI'], ArticleNumber=p['ArticleNumber'], PaperType=p['PaperType'],
                            ImageType=KIND[k], Number=r['n'], ImageFileName=r['file'], Page=r['page'],
                            Left=r['left'], Top=r['top'], Right=r['right'], Bottom=r['bottom'],
                            PageWidth=r['pageW'], PageHeight=r['pageH'], Confidence=r['conf'],
                            IEEECount=len(ie[k]), CaptionOrLatex=cap))
            sheet.append(['AZ', m['url'], p['Year'], m['title'], p['PaperType'], p['DOI'].lower(), r['file'],
                          '', '', '', '=IMAGE(INDIRECT("H"&ROW()))', KIND[k], '', '', '', '', '',
                          m['first'], m['last'], cap if k != 'eq' else '', ''])
    pd.DataFrame(man).to_csv(f'{OUT}/image_manifest.csv', index=False)
    hdr = ['', 'Paper URL', 'Year', 'Title', 'PaperType', 'DOI', 'ImageFileName', 'imageURL', 'ManuelLabels',
           'Zefeng Lables', 'Image', 'Image Type', 'Coder1', 'VisType_Coder1', 'Dr.ChenCodingVisType', 'Verifier',
           'VisType_Verifier', 'Start Page', 'End Page', 'Caption', 'NewClassifier']
    with open(f'{OUT}/sheet_rows_tables_equations.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh); w.writerow(hdr); w.writerows(sheet)
    df = pd.DataFrame(man)
    print(df.groupby(['Year', 'ImageType']).size().unstack(fill_value=0))
    print('total', len(df), 'papers', len(papers))


if __name__ == '__main__':
    main()

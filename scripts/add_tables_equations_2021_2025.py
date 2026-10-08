#!/usr/bin/env python3
"""Add tables, equations and algorithms of the 2021-2025 IEEE VIS papers (J and C) to the VIN datasets.

Input: scripts/data/tables_equations_2021_2025.csv -- one row per crop: paper, ImageType
       (Table/Equations/Algorithms), Number, page box at 300 dpi, pixel size and the Google Drive
       file id (from the newImage2021-2025 sheet).
       scripts/data/papers_2021_2025.csv             -- paper metadata, for papers with no figure rows yet.

The crops were cut from the IEEE PDFs rendered at 300 dpi (as the VIS30K 1990-2020 crops), tables and
equations located with DocLayout-YOLO and algorithms by their "Algorithm N" caption; see
scripts/data/README_tables_equations.md.

Row conventions follow the 2021-2025 figure rows:
  filename    VIS<year><J|C>.<firstPage>.<table|eq|alg><n>.png  (page label reused from the paper's figures)
  vis_type    16 table, 18 algorithm, 19 equation (same codes as 1990-2020)
  left/top/right/bottom, pageNum, paperSizeW/H: crop box on the 300-dpi page
  url         https://lh3.googleusercontent.com/d/<driveId>       thumb_url: same + "=w400"
Rank is renumbered for 2021+ rows (year, journal before conference, first page, then figures before
tables/algorithms/equations in page order). Existing imageIDs are kept.

Usage: python3 scripts/add_tables_equations_2021_2025.py [--dry-run]
"""
import argparse, collections, csv, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import update_2021_2024 as prev   # reuses clean_authors, normalize_doi, write_atomic, extend_paper_csv

REPO = prev.REPO
SRC_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260925.csv")
NEW_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20261007.csv")
CROPS = os.path.join(REPO, "scripts/data/tables_equations_2021_2025.csv")
PAPERS = os.path.join(REPO, "scripts/data/papers_2021_2025.csv")
csv.field_size_limit(10 ** 9)

VIS_TYPE = {"Table": "16", "Algorithms": "18", "Equations": "19"}
PREFIX = {"Table": "table", "Algorithms": "alg", "Equations": "eq"}


def page_key(row):
    try:
        return int(re.match(r"\d+", row["Paper FirstPage"] or "0").group(0))
    except AttributeError:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    crops = list(csv.DictReader(open(CROPS, encoding="utf-8", newline="")))
    papers = {prev.normalize_doi(p["DOI"]): p for p in csv.DictReader(open(PAPERS, encoding="utf-8", newline=""))}

    with open(SRC_IMAGE_CSV, encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        existing = list(reader)

    # paper-level columns and the page label of each paper's figure filenames
    paper_cols = ["Conference", "PaperType", "FirstPage", "Paper DOI", "Paper type", "Paper Title", "Author",
                  "Keywords Author", "paper_url", "Paper FirstPage", "Paper LastPage"]
    paper_row, page_label = {}, {}
    labels_used = collections.defaultdict(set)
    for r in existing:
        if int(r["Year"]) < 2021:
            continue
        doi = prev.normalize_doi(r["Paper DOI"])
        paper_row.setdefault(doi, {c: r[c] for c in paper_cols})
        page_label.setdefault(doi, r["filename"].split(".")[1])
        labels_used[(r["Year"], r["PaperType"])].add(r["filename"].split(".")[1])
    have = {r["paperImageName"] for r in existing if int(r["Year"]) >= 2021}
    year_index = collections.Counter()
    for r in existing:
        year_index[r["Year"]] = max(year_index[r["Year"]], int(float(r["year-index"] or 0)))

    # papers without figures: metadata from papers_2021_2025.csv; letter a shared first page
    new_papers = set()
    for c in crops:
        doi = prev.normalize_doi(c["DOI"])
        if doi in paper_row:
            continue
        p = papers[doi]
        taken = labels_used[(p["Year"], p["PaperType"])]
        label, n = p["FirstPage"], 0
        while label in taken:
            n += 1
            label = p["FirstPage"] + "bcdefgh"[n - 1]
        taken.add(label)
        page_label[doi] = label
        paper_row[doi] = {
            "Conference": "VIS", "PaperType": p["PaperType"], "FirstPage": p["FirstPage"],
            "Paper DOI": p["DOI"], "Paper type": p["PaperType"], "Paper Title": p["Title"],
            "Author": prev.clean_authors(p["AuthorNames-Deduped"]), "Keywords Author": p["AuthorKeywords"].strip(),
            "paper_url": p["Link"], "Paper FirstPage": p["FirstPage"], "Paper LastPage": p["LastPage"]}
        new_papers.add(doi)

    new_rows = []
    for c in crops:
        if c["ImageFileName"] in have:
            continue
        doi = prev.normalize_doi(c["DOI"])
        pr = paper_row[doi]
        year = c["Year"]
        year_index[year] += 1
        w, h = int(c["Right"]) - int(c["Left"]), int(c["Bottom"]) - int(c["Top"])
        row = {f: "" for f in fields}
        row.update(pr)
        row.update({
            "year-index": str(year_index[year]),
            "filename": "VIS%s%s.%s.%s%s.png" % (year, pr["PaperType"], page_label[doi],
                                                  PREFIX[c["ImageType"]], c["Number"]),
            "paperImageName": c["ImageFileName"],
            "sizeW": str(w), "sizeH": str(h), "image_proportion": "%.6f" % (w / h),
            "left": c["Left"], "top": c["Top"], "right": c["Right"], "bottom": c["Bottom"],
            "vis_type": VIS_TYPE[c["ImageType"]], "caption_index": "", "Year": year, "pageNum": c["Page"],
            "thumb_url": "https://lh3.googleusercontent.com/d/%s=w400" % c["DriveFileId"],
            "url": "https://lh3.googleusercontent.com/d/%s" % c["DriveFileId"],
            "cap_url": "none", "paperSizeW": c["PageWidth"], "paperSizeH": c["PageHeight"],
            "encoding_type": "NA", "check_encoding_type": "0.0",
            "dim_type": "NA", "check_dim_type": "0.0",
            "hardness_type": "NA", "check_hardness_type": "0.0",
        })
        new_rows.append(row)

    # renumber rank from 2021 on: year, journal then conference, paper, figures then the new crops
    old = [r for r in existing if int(r["Year"]) < 2021]
    recent = [r for r in existing if int(r["Year"]) >= 2021]
    order = {id(r): i for i, r in enumerate(recent + new_rows)}
    recent_all = sorted(recent + new_rows, key=lambda r: (
        r["Year"], r["PaperType"] == "C", page_key(r), r["Paper DOI"],
        r["vis_type"] in VIS_TYPE.values(), int(r["pageNum"] or 0) if r["vis_type"] in VIS_TYPE.values() else 0,
        order[id(r)]))
    rank = max(int(float(r["rank"])) for r in old if r["rank"])
    used_ids = {r["imageID"] for r in existing}
    for r in recent_all:
        rank += 1
        r["rank"] = "%d.0" % rank
        if not r["imageID"]:
            n = rank
            while "I%dY%s" % (n, r["Year"]) in used_ids:
                n += 100000
            r["imageID"] = "I%dY%s" % (n, r["Year"])
            used_ids.add(r["imageID"])

    counts = collections.Counter((r["Year"], r["vis_type"]) for r in new_rows)
    for y in sorted({k[0] for k in counts}):
        print("%s: %d tables, %d equations, %d algorithms" % (y, counts[(y, "16")], counts[(y, "19")], counts[(y, "18")]))
    print("images: %d new rows" % len(new_rows))
    dup = [k for k, v in collections.Counter(r["filename"] for r in recent_all).items() if v > 1]
    if dup:
        sys.exit("duplicate filenames: %s" % dup[:5])

    if not args.dry_run:
        prev.write_atomic(NEW_IMAGE_CSV, fields, old + recent_all, encoding="utf-8-sig")
        print("wrote %s (%d rows)" % (os.path.relpath(NEW_IMAGE_CSV, REPO), len(old) + len(recent_all)))

    meta = {doi: dict(papers[doi], Award=papers[doi].get("Award", "")) for doi in new_papers}
    added = prev.extend_paper_csv(meta, new_papers, args.dry_run)
    print("papers: %d appended to paperData_3.0.3.csv" % added)
    if args.dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    main()

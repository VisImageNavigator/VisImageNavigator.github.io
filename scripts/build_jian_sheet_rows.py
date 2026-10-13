#!/usr/bin/env python3
"""Rows to append to Jian's metadata spreadsheet ("FormalStudy: IEEE V-I-S images 1990-2020") for the
images and papers added after VIS30K: the 2020 short papers and all 2021-2025 papers.

  jian_vis30k_rows.csv   tab "VIS30K": one row per figure (F) or table (T), same 16 columns
                         (algorithms and equations are left out, as in the existing tab)
  jian_paper_rows.csv    tab "Paper dataset (all years)": one row per paper, same 20 columns

Captions are matched by Google Drive file id (site url) or file name from the scrape manifests.

Usage: python3 scripts/build_jian_sheet_rows.py --dataset public/dataset/vispubData30_updated_XXXX.csv
           --papers scripts/data/papers_2021_2025.csv [--papers scripts/data/short_papers_2020.csv ...]
           --start-index 3471 --out ~/Downloads/VIN_jian_oct
"""
import argparse, csv, os, re
import pandas as pd

VIN = os.path.expanduser("~/Downloads/Projects/VIN Research")
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIS30K_COLS = ["Year", "filename", "Conference", "Paper DOI", "PaperType", "Image", "Caption", "CaptionText",
               "Image Type", "Image URL", "Caption URL", "Paper Title", "Author", "paper_url",
               "Paper FirstPage", "Paper LastPage"]
PAPER_COLS = ["index", "Conference", "Year", "Title", "DOI", "Link", "FirstPage", "LastPage", "PaperType",
              "Abstract", "AuthorNames-Deduped", "AuthorNames", "AuthorAffiliation", "InternalReferences",
              "AuthorKeywords", "AminerCitationCount_02-2019", "XploreCitationCount - 2020-01", "PubsCited",
              "Award", "Number of Figures"]


def drive_id(url):
    m = re.search(r"(?:/d/|id=)([A-Za-z0-9_-]{20,})", str(url))
    return m.group(1) if m else None


def caption_maps():
    by_id, by_name = {}, {}
    for f in ["scripts/data/images_2021_2025_drive.csv", "scripts/data/short_paper_images_2021_2025.csv",
              "scripts/data/short_paper_images_2020.csv"]:
        p = os.path.join(REPO, f)
        if os.path.exists(p):
            for r in csv.DictReader(open(p, encoding="utf-8")):
                by_id[r["DriveFileId"]] = r.get("Caption", "")
    p = os.path.join(REPO, "scripts/data/tables_equations_2021_2025.csv")
    for f in [p, os.path.join(REPO, "scripts/data/tables_equations_2020.csv")]:
        if os.path.exists(f):
            for r in csv.DictReader(open(f, encoding="utf-8")):
                by_id[r["DriveFileId"]] = r.get("CaptionOrLatex", "")
    for r in csv.DictReader(open(os.path.join(VIN, "VIN_images/image_manifest.csv"), encoding="utf-8")):
        by_name[r["ImageFileName"]] = r["Caption"]
    # Josh's rows: Drive id -> his file name (same tvcg_<year>_<id>_fig_<n>.png names as the manifest)
    josh = pd.read_csv(os.path.join(VIN, "MemorabilityImageData - newImage2021-2025.csv"), dtype=str)
    name_by_id = {drive_id(u): n for u, n in zip(josh.imageURL, josh.ImageFileName) if drive_id(u)}
    return by_id, by_name, name_by_id


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True)
    ap.add_argument("--papers", action="append", required=True)
    ap.add_argument("--start-index", type=int, default=3471)
    ap.add_argument("--out", default=os.path.expanduser("~/Downloads/VIN_jian_oct"))
    args = ap.parse_args()

    d = pd.read_csv(args.dataset, dtype=str, keep_default_na=False, encoding="utf-8-sig")
    yr = d.Year.astype(int)
    new = d[((yr >= 2021) | ((yr == 2020) & (d.Conference == "VIS"))) & ~d.vis_type.isin(["18", "19"])]
    by_id, by_name, name_by_id = caption_maps()
    rows, missing = [], 0
    for _, r in new.iterrows():
        i = drive_id(r.url)
        cap = by_id.get(i)
        if cap is None:
            cap = by_name.get(name_by_id.get(i, ""), by_name.get(r.paperImageName, ""))
        missing += not cap
        rows.append({"Year": r.Year, "filename": r.filename, "Conference": r.Conference,
                     "Paper DOI": r["Paper DOI"], "PaperType": r.PaperType, "Image": "", "Caption": "",
                     "CaptionText": cap, "Image Type": "T" if r.vis_type == "16" else "F",
                     "Image URL": r.url, "Caption URL": "none", "Paper Title": r["Paper Title"],
                     "Author": r.Author, "paper_url": r.paper_url, "Paper FirstPage": r["Paper FirstPage"],
                     "Paper LastPage": r["Paper LastPage"]})
    pd.DataFrame(rows, columns=VIS30K_COLS).to_csv(os.path.join(args.out, "jian_vis30k_rows.csv"), index=False)

    papers = pd.concat([pd.read_csv(p, dtype=str, keep_default_na=False) for p in args.papers])
    papers = papers.drop_duplicates("DOI").sort_values(["Year", "PaperType", "FirstPage"],
                                                       key=lambda s: s.map(lambda x: int(re.sub(r"\D", "", x) or 0)) if s.name == "FirstPage" else s)
    prow = []
    for k, (_, p) in enumerate(papers.iterrows()):
        prow.append({"index": args.start_index + k, "Conference": "VIS", "Year": p.Year, "Title": p.Title,
                     "DOI": p.DOI, "Link": p.Link, "FirstPage": p.FirstPage, "LastPage": p.LastPage,
                     "PaperType": p.PaperType, "Abstract": p.Abstract,
                     "AuthorNames-Deduped": p["AuthorNames-Deduped"], "AuthorNames": p.get("AuthorNames", ""),
                     "AuthorAffiliation": p.get("AuthorAffiliation", ""),
                     "InternalReferences": p.get("InternalReferences", ""),
                     "AuthorKeywords": p.get("AuthorKeywords", ""), "PubsCited": p.get("PubsCited_CrossRef", ""),
                     "Award": p.get("Award", ""), "Number of Figures": p.get("NumFigures", "")})
    pd.DataFrame(prow, columns=PAPER_COLS).to_csv(os.path.join(args.out, "jian_paper_rows.csv"), index=False)
    print("VIS30K rows: %d (%d without caption), by year %s" % (
        len(rows), missing, pd.Series([r["Year"] for r in rows]).value_counts().sort_index().to_dict()))
    print("paper rows: %d, by year %s" % (len(prow), papers.Year.value_counts().sort_index().to_dict()))


if __name__ == "__main__":
    main()

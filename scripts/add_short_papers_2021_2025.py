#!/usr/bin/env python3
"""Add the 2021-2025 IEEE VIS conference short papers ("C") and their figures to the VIN datasets.

Input: scripts/data/short_papers_2021_2025.csv        -- the 271 papers (IEEE metadata, VisPubData columns)
       scripts/data/short_paper_images_2021_2025.csv  -- one row per figure with pixel size and the
                                                         Google Drive file id (from the newImage2021-2025 sheet)

Writes a new image dataset (a copy of the previous one plus the new rows) and appends the papers to
paperData_3.0.3.csv. Row conventions follow the 2021-2025 journal rows (add_images_2021_2025.py):
  filename    VIS<year>C.<firstPage>.<figNumber>.png  (listings: listing<n>, unlabeled: other<n>);
              when two papers of a year share a first page (IEEE data), the later gets a letter: 156b
  url         https://lh3.googleusercontent.com/d/<driveId>       thumb_url: same + "=w400"
  types       vis_type 100, encoding/dim/hardness "NA" with check_* 0.0 (unlabeled)
The site orders images by rank, so rank is renumbered for 2021+ rows (year, journal before
conference, first page, figure order). Existing imageIDs are kept.

Usage: python3 scripts/add_short_papers_2021_2025.py [--dry-run]
"""
import argparse, collections, csv, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import update_2021_2024 as prev   # reuses clean_authors, write_atomic, extend_paper_csv

REPO = prev.REPO
SRC_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260922.csv")
NEW_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260925.csv")
PAPERS = os.path.join(REPO, "scripts/data/short_papers_2021_2025.csv")
IMAGES = os.path.join(REPO, "scripts/data/short_paper_images_2021_2025.csv")
csv.field_size_limit(10 ** 9)


def image_index(im):
    if im["ImageType"] == "L":
        return "listing" + (im["FigNumber"] or im["FigId"].replace("fig", ""))
    if not im["FigNumber"]:
        return "other" + re.sub(r"\D", "", im["FigId"])
    return im["FigNumber"]


def page_key(row):
    try:
        return int(re.match(r"\d+", row["Paper FirstPage"] or "0").group(0))
    except AttributeError:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    papers = {p["DOI"]: p for p in csv.DictReader(open(PAPERS, encoding="utf-8", newline=""))}
    images = list(csv.DictReader(open(IMAGES, encoding="utf-8", newline="")))

    with open(SRC_IMAGE_CSV, encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        existing = list(reader)
    have_dois = {r["Paper DOI"].upper() for r in existing}
    year_index = collections.Counter()
    for r in existing:
        year_index[r["Year"]] = max(year_index[r["Year"]], int(float(r["year-index"] or 0)))

    # page label per paper, lettered when two papers of a year share a first page
    page_label, seen = {}, collections.defaultdict(list)
    for doi, p in sorted(papers.items(), key=lambda kv: (kv[1]["Year"], int(kv[1]["ArticleNumber"]))):
        seen[(p["Year"], p["FirstPage"])].append(doi)
    for dois in seen.values():
        for i, doi in enumerate(dois):
            page_label[doi] = papers[doi]["FirstPage"] + ("" if i == 0 else "bcdefgh"[i - 1])

    new_rows = []
    for im in images:
        p = papers[im["DOI"]]
        if p["DOI"].upper() in have_dois:
            continue
        year = im["Year"]
        year_index[year] += 1
        w, h = int(im["Width"]), int(im["Height"])
        row = {f: "" for f in fields}
        row.update({
            "year-index": str(year_index[year]), "Conference": "VIS", "PaperType": "C",
            "FirstPage": p["FirstPage"],
            "filename": "VIS%sC.%s.%s.png" % (year, page_label[p["DOI"]], image_index(im)),
            "paperImageName": im["ImageFileName"],
            "sizeW": str(w), "sizeH": str(h), "image_proportion": "%.6f" % (w / h),
            "vis_type": "100", "caption_index": "", "Year": year, "pageNum": "0",
            "Paper DOI": p["DOI"],
            "thumb_url": "https://lh3.googleusercontent.com/d/%s=w400" % im["DriveFileId"],
            "url": "https://lh3.googleusercontent.com/d/%s" % im["DriveFileId"],
            "cap_url": "none", "Paper type": "C",
            "Paper Title": p["Title"], "Author": prev.clean_authors(p["AuthorNames-Deduped"]),
            "Keywords Author": p["AuthorKeywords"].strip(),
            "paper_url": p["Link"],
            "Paper FirstPage": p["FirstPage"], "Paper LastPage": p["LastPage"],
            "encoding_type": "NA", "check_encoding_type": "0.0",
            "dim_type": "NA", "check_dim_type": "0.0",
            "hardness_type": "NA", "check_hardness_type": "0.0",
        })
        new_rows.append(row)

    # renumber rank from 2021 on so each year's images stay together (journal, then conference)
    old = [r for r in existing if int(r["Year"]) < 2021]
    recent = [r for r in existing if int(r["Year"]) >= 2021]
    order = {id(r): i for i, r in enumerate(recent + new_rows)}
    recent_all = sorted(recent + new_rows, key=lambda r: (
        r["Year"], r["PaperType"] == "C", page_key(r), r["Paper DOI"], order[id(r)]))
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

    by_year = collections.Counter(r["Year"] for r in new_rows)
    print("images: %d new rows (%s)" % (len(new_rows), ", ".join("%s: %d" % kv for kv in sorted(by_year.items()))))
    dup = [k for k, v in collections.Counter(r["filename"] for r in recent_all).items() if v > 1]
    if dup:
        sys.exit("duplicate filenames: %s" % dup[:5])

    if not args.dry_run:
        prev.write_atomic(NEW_IMAGE_CSV, fields, old + recent_all, encoding="utf-8-sig")
        print("wrote %s (%d rows)" % (os.path.relpath(NEW_IMAGE_CSV, REPO), len(old) + len(recent_all)))

    meta = {doi: dict(p, Award="") for doi, p in papers.items()}
    added = prev.extend_paper_csv(meta, {r["Paper DOI"] for r in new_rows}, args.dry_run)
    print("papers: %d appended to paperData_3.0.3.csv" % added)
    if args.dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    main()

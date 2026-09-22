#!/usr/bin/env python3
"""Add the 2021-2025 IEEE VIS figures scraped from IEEE Xplore (Sept 2026) to the VIN datasets.

Input: scripts/data/images_2021_2025_drive.csv -- one row per image with the IEEE figure
metadata, pixel size, and the Google Drive file id of the uploaded PNG (the same ids that the
MemorabilityImageData / newImage2021-2025 sheet holds in its imageURL column).

Writes a new image dataset (a copy of the previous one plus the new rows) and appends the new
papers to paperData_3.0.3.csv. Row conventions follow the existing 2021-2024 rows:
  filename    VIS<year>J.<firstPage>.<figNumber>.png   (listings: listing<n>, unlabeled: other<n>)
  url         https://lh3.googleusercontent.com/d/<driveId>       thumb_url: same + "=w400"
  year-index  continues after the last existing index of that year;  rank / imageID continue globally
  vis_type 100, encoding/dim/hardness "NA" with check_* 0.0  (unlabeled, to be coded later)

Usage: python3 scripts/add_images_2021_2025.py [--sheet VISPUBDATA.csv] [--dry-run]
"""
import argparse, collections, csv, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import update_2021_2024 as prev   # reuses VisPubData loading, DOI/author cleanup, paperData append

REPO = prev.REPO
SRC_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260901.csv")
NEW_IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260922.csv")
INPUT = os.path.join(REPO, "scripts/data/images_2021_2025_drive.csv")
prev.YEARS = ("2021", "2022", "2023", "2024", "2025")
csv.field_size_limit(10 ** 9)


def image_index(row):
    n = row["FigNumber"] or row["FigId"].replace("fig", "")
    if row["FigId"].startswith("list"):
        return "listing" + n
    if not row["Label"]:
        return "other" + row["FigId"].replace("other", "")
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", help="local VisPubData CSV export")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    meta = prev.load_vispubdata(args.sheet)
    print("VisPubData: %d papers for 2021-2025" % len(meta))

    with open(SRC_IMAGE_CSV, encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        existing = list(reader)
    have_dois = {prev.normalize_doi(r["Paper DOI"]) for r in existing}
    year_index = collections.Counter()
    for r in existing:
        year_index[r["Year"]] = max(year_index[r["Year"]], int(float(r["year-index"] or 0)))
    rank = max(int(float(r["rank"])) for r in existing if r["rank"])

    images = list(csv.DictReader(open(INPUT, encoding="utf-8", newline="")))
    new_rows, skipped, unmatched = [], collections.Counter(), set()
    for im in images:
        doi = prev.normalize_doi(im["DOI"])
        if doi in have_dois:
            skipped["paper already in dataset"] += 1
            continue
        paper = meta.get(doi)
        if not paper:
            unmatched.add(doi); skipped["no VisPubData match"] += 1
            continue
        year = im["Year"]
        year_index[year] += 1
        rank += 1
        w, h = int(im["Width"]), int(im["Height"])
        first = paper["FirstPage"].strip()
        row = {f: "" for f in fields}
        row.update({
            "year-index": str(year_index[year]), "Conference": "VIS", "PaperType": "J",
            "FirstPage": first,
            "filename": "VIS%sJ.%s.%s.png" % (year, first, image_index(im)),
            "paperImageName": im["ImageFileName"],
            "sizeW": str(w), "sizeH": str(h), "image_proportion": "%.6f" % (w / h),
            "vis_type": "100", "caption_index": "", "Year": year, "pageNum": "0",
            "Paper DOI": doi,
            "thumb_url": "https://lh3.googleusercontent.com/d/%s=w400" % im["DriveFileId"],
            "url": "https://lh3.googleusercontent.com/d/%s" % im["DriveFileId"],
            "cap_url": "none", "Paper type": "J",
            "Paper Title": paper["Title"], "Author": prev.clean_authors(paper["AuthorNames-Deduped"]),
            "Keywords Author": paper["AuthorKeywords"].strip(),
            "paper_url": "http://dx.doi.org/" + doi,
            "Paper FirstPage": first, "Paper LastPage": paper["LastPage"].strip(),
            "rank": "%d.0" % rank, "imageID": "I%dY%s" % (rank, year),
            "encoding_type": "NA", "check_encoding_type": "0.0",
            "dim_type": "NA", "check_dim_type": "0.0",
            "hardness_type": "NA", "check_hardness_type": "0.0",
        })
        new_rows.append(row)

    by_year = collections.Counter(r["Year"] for r in new_rows)
    print("images: %d new rows (%s) | skipped: %s"
          % (len(new_rows), ", ".join("%s: %d" % kv for kv in sorted(by_year.items())), dict(skipped) or "none"))
    if unmatched:
        print("  ! no VisPubData match for %d DOI(s): %s" % (len(unmatched), sorted(unmatched)[:5]), file=sys.stderr)

    if not args.dry_run:
        prev.write_atomic(NEW_IMAGE_CSV, fields, existing + new_rows, encoding="utf-8-sig")
        print("wrote %s (%d rows)" % (os.path.relpath(NEW_IMAGE_CSV, REPO), len(existing) + len(new_rows)))

    new_dois = {prev.normalize_doi(r["Paper DOI"]) for r in new_rows} & set(meta)
    added = prev.extend_paper_csv(meta, new_dois, args.dry_run)
    print("papers: %d appended to paperData_3.0.3.csv (%d new papers have images)" % (added, len(new_dois)))
    if args.dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    main()

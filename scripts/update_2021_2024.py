#!/usr/bin/env python3
"""Normalize the 2021-2024 (IEEE VIS journal-track) rows in the VIN datasets.

Addresses the review items from Prof. Chen:

  (2) filename  -> VIS<year>J.<firstPage>.<imageIndex>.<ext>
  (3) Author / Keywords Author  <- joined from VisPubData by DOI
  (4) Conference "Vis" -> "VIS" for 2021 and later
  (5) check_encoding_type set so the new images participate in the type
      filters; dim_type / hardness_type stay "NA" (still to be labeled)

Also, so that the new metadata is actually searchable:
  - Paper DOI is upper-cased to the 10.1109/TVCG.<year>.<id> form used by
    every pre-2021 row and by paper_url.
  - the 2021-2024 papers are appended to paperData_3.0.3.csv, which backs
    the title/abstract search mode (it previously stopped at 2020).

Usage:
    python3 scripts/update_2021_2024.py [--sheet PATH] [--dry-run]

Without --sheet the VisPubData export is downloaded from Google Sheets.
"""

import argparse
import collections
import csv
import io
import os
import re
import sys
import tempfile
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_CSV = os.path.join(REPO, "public/dataset/vispubData30_updated_20260901.csv")
PAPER_CSV = os.path.join(REPO, "public/dataset/paperData_3.0.3.csv")

VISPUBDATA_EXPORT = (
    "https://docs.google.com/spreadsheets/d/"
    "1xgoOPu28dQSSGPIp_HHQs0uvvcyLNdkMF9XtRajhhxU/export"
    "?format=csv&gid=2045182644"
)

YEARS = ("2021", "2022", "2023", "2024")

# tvcg_2021_3114815_fig_51.png
SOURCE_NAME = re.compile(r"^tvcg_(?P<year>\d{4})_(?P<id>\d+)_fig_(?P<index>\d+)\.(?P<ext>\w+)$")
# "Georgia Panagiotidou 0001" -> "Georgia Panagiotidou"
DEDUPE_SUFFIX = re.compile(r"\s+\d{4}$")

csv.field_size_limit(10 ** 9)


def load_vispubdata(path):
    if path:
        text = open(path, encoding="utf-8-sig").read()
    else:
        with urllib.request.urlopen(VISPUBDATA_EXPORT) as resp:
            text = resp.read().decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))
    return {normalize_doi(r["DOI"]): r for r in rows if r["Year"] in YEARS}


def normalize_doi(doi):
    """10.1109/tvcg.2021.3114815 -> 10.1109/TVCG.2021.3114815"""
    return (doi or "").strip().replace("10.1109/tvcg.", "10.1109/TVCG.")


def clean_authors(names):
    parts = [DEDUPE_SUFFIX.sub("", n).strip() for n in (names or "").split(";")]
    return ";".join(p for p in parts if p)


def rewrite_image_csv(meta, dry_run):
    with open(IMAGE_CSV, encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        rows = list(reader)

    stats = collections.Counter()
    unmatched = set()

    for row in rows:
        if row["Year"] not in YEARS:
            continue
        stats["rows"] += 1

        row["Conference"] = "VIS"
        doi = normalize_doi(row["Paper DOI"])
        row["Paper DOI"] = doi

        match = SOURCE_NAME.match(row["filename"])
        if match:
            row["filename"] = "VIS{year}J.{page}.{index}.{ext}".format(
                year=row["Year"],
                page=row["FirstPage"],
                index=match.group("index"),
                ext=match.group("ext"),
            )
            stats["renamed"] += 1
        elif not row["filename"].startswith("VIS"):
            stats["rename_skipped"] += 1

        paper = meta.get(doi)
        if paper:
            row["Author"] = clean_authors(paper["AuthorNames-Deduped"])
            row["Keywords Author"] = paper["AuthorKeywords"].strip()
            if row["Author"]:
                stats["authors"] += 1
            if row["Keywords Author"]:
                stats["keywords"] += 1
        else:
            unmatched.add(doi)

        # A stray scraper error leaked into the encoding labels; treat it as
        # unlabeled rather than as a type name.
        if row["encoding_type"].strip().lower().startswith("error:"):
            row["encoding_type"] = "NA"
            stats["encoding_cleaned"] += 1

        # Match the pre-2021 convention: check_* is 1.0 exactly when the
        # corresponding label exists, and the type filters gate on it.
        row["check_encoding_type"] = "0.0" if row["encoding_type"] == "NA" else "1.0"
        row["check_dim_type"] = "0.0" if row["dim_type"] == "NA" else "1.0"
        row["check_hardness_type"] = "0.0" if row["hardness_type"] == "NA" else "1.0"
        if row["check_encoding_type"] == "1.0":
            stats["encoding_labeled"] += 1

    if unmatched:
        print("  ! no VisPubData match for %d DOI(s): %s"
              % (len(unmatched), sorted(unmatched)[:5]), file=sys.stderr)

    if not dry_run:
        # utf-8-sig / "\n": preserve the byte-level shape of the existing file
        # so the diff stays limited to the rows we actually touched.
        write_atomic(IMAGE_CSV, fields, rows, encoding="utf-8-sig")
    return stats


def write_atomic(path, fields, rows, encoding, errors=None):
    directory = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=directory, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding=encoding, errors=errors, newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=fields, lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp, path)
    except BaseException:
        os.path.exists(tmp) and os.unlink(tmp)
        raise


def extend_paper_csv(meta, dois, dry_run):
    """Append the 2021-2024 papers to the paper-level dataset.

    Strictly append-only: the existing rows are never rewritten. One 2018 row
    in this file is malformed CSV (an unbalanced quote inside its abstract),
    and rewriting the file silently mangles it.
    """
    with open(PAPER_CSV, encoding="utf-8", errors="surrogateescape", newline="") as fh:
        rows = list(csv.reader(fh))
    fields = rows[0]
    doi_at, index_at = fields.index("DOI"), fields.index("index")

    have = {normalize_doi(r[doi_at]) for r in rows[1:] if len(r) > doi_at}
    next_index = max(int(r[index_at]) for r in rows[1:]
                     if r and r[index_at].isdigit()) + 1

    column = {
        "Conference": lambda p: "VIS",
        "Year": lambda p: p["Year"],
        "Title": lambda p: p["Title"],
        "DOI": lambda p: normalize_doi(p["DOI"]),
        "Link": lambda p: p["Link"],
        "FirstPage": lambda p: p["FirstPage"],
        "LastPage": lambda p: p["LastPage"],
        "PaperType": lambda p: p["PaperType"],
        "Abstract": lambda p: p["Abstract"],
        "AuthorNames-Deduped": lambda p: clean_authors(p["AuthorNames-Deduped"]),
        "AuthorAffiliation": lambda p: p["AuthorAffiliation"],
        "AuthorKeywords": lambda p: p["AuthorKeywords"],
        "Award": lambda p: p["Award"],
    }

    pending = []
    for doi in sorted(dois, key=lambda d: (meta[d]["Year"], d)):
        if doi in have:
            continue
        paper = meta[doi]
        row = [column[f](paper) if f in column else "" for f in fields]
        row[index_at] = str(next_index)
        pending.append(row)
        next_index += 1

    if not dry_run and pending:
        buf = io.StringIO(newline="")
        csv.writer(buf, lineterminator="\n").writerows(pending)
        with open(PAPER_CSV, "a", encoding="utf-8", errors="surrogateescape",
                  newline="") as fh:
            fh.write(buf.getvalue())
    return len(pending)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", help="local VisPubData CSV export")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    meta = load_vispubdata(args.sheet)
    print("VisPubData: %d papers for %s" % (len(meta), "-".join((YEARS[0], YEARS[-1]))))

    stats = rewrite_image_csv(meta, args.dry_run)
    print("images: %(rows)d rows | %(renamed)d renamed | %(authors)d with authors | "
          "%(keywords)d with keywords | %(encoding_labeled)d encoding-labeled" % stats)
    if stats["encoding_cleaned"]:
        print("        %d bad encoding label(s) reset to NA" % stats["encoding_cleaned"])
    if stats["rename_skipped"]:
        print("        %d filename(s) left alone (unrecognized pattern)" % stats["rename_skipped"])

    with open(IMAGE_CSV, encoding="utf-8-sig", newline="") as fh:
        dois = {normalize_doi(r["Paper DOI"]) for r in csv.DictReader(fh)
                if r["Year"] in YEARS}
    dois &= set(meta)
    added = extend_paper_csv(meta, dois, args.dry_run)
    print("papers: %d appended to paperData_3.0.3.csv (%d have images)"
          % (added, len(dois)))

    if args.dry_run:
        print("(dry run: nothing written)")


if __name__ == "__main__":
    main()

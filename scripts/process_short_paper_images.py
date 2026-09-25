#!/usr/bin/env python3
"""Unpack the per-year figure zips downloaded from IEEE Xplore for the VIS short papers (2021-2025),
convert every figure to PNG with the manifest file name, and write the deliverables.

Input:  ~/Downloads/VIN_short_papers_work/zips/*.zip       (each has the images + download_log.tsv)
        ~/Downloads/VIN_short_papers_work/figure_manifest.csv  (from build_short_papers_meta.py)
        ~/Downloads/VIN_short_papers/papers_short_2021_2025.csv
Output: ~/Downloads/VIN_short_papers/<year>/*.png
        ~/Downloads/VIN_short_papers/image_manifest.csv       (manifest + Width/Height/Variant/Status)
        ~/Downloads/VIN_short_papers/sheet_rows_short_papers.csv  (newImage2021-2025 tab, 21 columns)

Usage: python3 scripts/process_short_paper_images.py
"""
import csv, glob, io, os, zipfile
from PIL import Image

OUT = os.path.expanduser("~/Downloads/VIN_short_papers")
WORK = os.path.expanduser("~/Downloads/VIN_short_papers_work")
SHEET_FIELDS = ["", "Paper URL", "Year", "Title", "PaperType", "DOI", "ImageFileName", "imageURL",
                "ManuelLabels", "Zefeng Lables", "Image", "Image Type", "Coder1", "VisType_Coder1",
                "Dr.ChenCodingVisType", "Verifier", "VisType_Verifier", "Start Page", "End Page",
                "Caption", "NewClassifier"]


def main():
    manifest = list(csv.DictReader(open(os.path.join(WORK, "figure_manifest.csv"), encoding="utf-8")))
    papers = {p["ArticleNumber"]: p for p in
              csv.DictReader(open(os.path.join(OUT, "papers_short_2021_2025.csv"), encoding="utf-8"))}
    by_key = {(m["ArticleNumber"], m["FigId"]): m for m in manifest}

    got = {}
    for zpath in sorted(glob.glob(os.path.join(WORK, "zips", "*.zip"))):
        with zipfile.ZipFile(zpath) as z:
            log = z.read("download_log.tsv").decode("utf-8").splitlines()[1:]
            for line in log:
                if not line.strip():
                    continue
                year, ar, fig_id, variant, source, name, _ = line.split("\t")
                m = by_key[(ar, fig_id)]
                img = Image.open(io.BytesIO(z.read(name)))
                img = img.convert("RGBA" if "transparency" in img.info or img.mode in ("RGBA", "LA") else "RGB")
                os.makedirs(os.path.join(OUT, year), exist_ok=True)
                img.save(os.path.join(OUT, year, m["ImageFileName"]), optimize=True)
                got[(ar, fig_id)] = (variant, source, img.width, img.height)

    rows, sheet = [], []
    for m in manifest:
        variant, source, w, h = got.get((m["ArticleNumber"], m["FigId"]), ("", "", "", ""))
        rows.append(dict(m, Variant=variant, SourceFile=source, Width=w, Height=h,
                         Status="ok" if variant else "missing"))
        if not variant:
            continue
        p = papers[m["ArticleNumber"]]
        sheet.append({"": "AZ", "Paper URL": p["Link"], "Year": m["Year"], "Title": p["Title"],
                      "PaperType": "C", "DOI": m["DOI"].lower(), "ImageFileName": m["ImageFileName"],
                      "Image": '=IMAGE(INDIRECT("H"&ROW()))', "Start Page": p["FirstPage"],
                      "End Page": p["LastPage"], "Caption": m["Caption"]})

    fields = list(manifest[0].keys()) + ["Variant", "SourceFile", "Width", "Height", "Status"]
    with open(os.path.join(OUT, "image_manifest.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fields)
        w.writeheader()
        w.writerows(rows)
    with open(os.path.join(OUT, "sheet_rows_short_papers.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, SHEET_FIELDS, extrasaction="ignore")
        w.writeheader()
        w.writerows(sheet)
    missing = [r for r in rows if r["Status"] == "missing"]
    print("%d of %d figures saved as PNG, %d missing" % (len(rows) - len(missing), len(rows), len(missing)))
    for r in missing[:20]:
        print("  missing:", r["Year"], r["ArticleNumber"], r["FigId"])


if __name__ == "__main__":
    main()

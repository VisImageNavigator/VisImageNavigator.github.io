#!/usr/bin/env python3
"""Point the 2020 VIS30K figure/table thumbnails at the full-size images.

Every thumb_url under https://ivcl.jiangsn.com/VIS30K/ImagesThumb/2020/ returns 404 (the full-size
Images/2020 and Tables/2020 files are there), so the site showed broken thumbnails for 2020.

Usage: python3 scripts/fix_2020_thumbnails.py public/dataset/vispubData30_updated_XXXX.csv
"""
import csv, sys
sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import update_2021_2024 as prev

path = sys.argv[1]
with open(path, encoding="utf-8-sig", newline="") as fh:
    reader = csv.DictReader(fh)
    fields, rows = reader.fieldnames, list(reader)
n = 0
for r in rows:
    if "/VIS30K/ImagesThumb/2020/" in r["thumb_url"]:
        r["thumb_url"] = r["url"]
        n += 1
prev.write_atomic(path, fields, rows, encoding="utf-8-sig")
print("2020 thumbnails repointed: %d" % n)

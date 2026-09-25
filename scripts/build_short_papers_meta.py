#!/usr/bin/env python3
"""Build paper metadata and a figure manifest for the IEEE VIS conference (short paper, "C")
proceedings 2021-2025 from the raw IEEE Xplore responses collected in the browser.

Input:  ~/Downloads/VIN_short_papers_work/meta_raw.json   ({toc: {year: [...]}, meta: {articleNumber: {year, meta, figs}}})
Output: ~/Downloads/VIN_short_papers/papers_short_2021_2025.csv   (VisPubData sheet columns)
        ~/Downloads/VIN_short_papers_work/figure_manifest.csv     (one row per figure to download)

Usage: python3 scripts/build_short_papers_meta.py
"""
import csv, html, json, os, re

OUT = os.path.expanduser("~/Downloads/VIN_short_papers")
WORK = os.path.expanduser("~/Downloads/VIN_short_papers_work")
RAW = os.path.join(WORK, "meta_raw.json")

PAPER_FIELDS = ["Conference", "Year", "Title", "DOI", "Link", "FirstPage", "LastPage", "PaperType",
                "Abstract", "AuthorNames-Deduped", "AuthorNames", "AuthorAffiliation",
                "InternalReferences", "AuthorKeywords", "AminerCitationCount",
                "CitationCount_CrossRef", "PubsCited_CrossRef", "Downloads_Xplore", "Award",
                "GraphicsReplicabilityStamp", "ArticleNumber", "MediaPath", "NumFigures"]
FIG_FIELDS = ["Year", "DOI", "ArticleNumber", "FirstPage", "FigId", "FigNumber", "Label", "ImageType",
              "Caption", "ImageFileName", "MediaPath", "HiresFile", "LargeFile"]


def strip_tags(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def keywords(meta, kind):
    for k in meta.get("keywords") or []:
        if k.get("type") == kind:
            return k.get("kwd") or []
    return []


def image_file_name(year, doi, image_type, number, position):
    doi_id = doi.rsplit(".", 1)[-1]
    if image_type == "L":
        return "vis_%s_%s_listing_%s.png" % (year, doi_id, number or position)
    if not number:
        return "vis_%s_%s_fig_other%d.png" % (year, doi_id, position)
    return "vis_%s_%s_fig_%s.png" % (year, doi_id, number)


def main():
    raw = json.load(open(RAW, encoding="utf-8"))
    papers, figs = [], []
    for ar, v in sorted(raw["meta"].items(), key=lambda kv: (kv[1]["year"], int(kv[1]["meta"].get("startPage") or 0))):
        m, year = v["meta"], v["year"]
        authors = m.get("authors") or []
        doi = m.get("doi", "")
        fig_list = v["figs"] if isinstance(v["figs"], list) else []
        papers.append({
            "Conference": "VIS",
            "Year": year,
            "Title": strip_tags(m.get("title")),
            "DOI": doi,
            "Link": "http://dx.doi.org/" + doi,
            "FirstPage": m.get("startPage", ""),
            "LastPage": m.get("endPage", ""),
            "PaperType": "C",
            "Abstract": strip_tags(m.get("abstract")),
            "AuthorNames-Deduped": ";".join(a.get("name", "") for a in authors),
            "AuthorNames": ";".join(a.get("name", "") for a in authors),
            "AuthorAffiliation": ";".join(" & ".join(a.get("affiliation") or []) for a in authors),
            "AuthorKeywords": ",".join(keywords(m, "Author Keywords")),
            "PubsCited_CrossRef": m.get("referenceCount", ""),
            "ArticleNumber": ar,
            "MediaPath": m.get("mediaPath", ""),
            "NumFigures": len(fig_list),
        })
        for i, f in enumerate(fig_list, 1):
            label = (f.get("label") or "").strip()
            num = re.search(r"\d+", label)
            kind = label.split(" ")[0].rstrip(".:").lower()
            image_type = {"figure": "F", "fig": "F", "listing": "L", "code": "L"}.get(kind, "O")
            g = f.get("graphic") or {}
            figs.append({
                "Year": year, "DOI": doi, "ArticleNumber": ar, "FirstPage": m.get("startPage", ""),
                "FigId": f.get("id", "fig%d" % i), "FigNumber": num.group(0) if num else "",
                "Label": label, "ImageType": image_type, "Caption": strip_tags(f.get("caption")),
                # same pattern as the journal batch (tvcg_<year>_<doiId>_fig_<n>.png), keyed on the
                # last DOI segment, which is unique within each proceedings volume
                "ImageFileName": image_file_name(year, doi, image_type, num.group(0) if num else "", i),
                "MediaPath": m.get("mediaPath", ""),
                "HiresFile": g.get("hires", ""), "LargeFile": g.get("large", ""),
            })

    with open(os.path.join(OUT, "papers_short_2021_2025.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, PAPER_FIELDS, extrasaction="ignore")
        w.writeheader()
        w.writerows(papers)
    with open(os.path.join(WORK, "figure_manifest.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, FIG_FIELDS)
        w.writeheader()
        w.writerows(figs)
    print("%d papers, %d figures" % (len(papers), len(figs)))
    print("papers without a figure list:", [p["ArticleNumber"] for p in papers if not p["NumFigures"]])


if __name__ == "__main__":
    main()

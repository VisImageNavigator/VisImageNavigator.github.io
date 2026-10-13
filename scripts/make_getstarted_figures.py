#!/usr/bin/env python3
"""Regenerate the three figures on getStarted.html from the current image dataset.

  public/images/paperCard.png          timeline of selected years, one column of thumbnails per track
  public/images/total-img-by-year.png  # images (figures and tables) per year, per track + all combined
  public/images/avg-img-by-year.png    # images per page per year, per track + all combined

Counts follow the original figures: figures and tables only (vis_type 18/19 = algorithms/equations are
left out); pages per paper = LastPage - FirstPage + 1, ignoring malformed page ranges.
Thumbnails are cached in ~/Downloads/VIN_jian_oct/thumbs.

Usage: python3 scripts/make_getstarted_figures.py [--dataset public/dataset/vispubData30_updated_XXXX.csv]
"""
import argparse, io, os, random, re, sys, urllib.request
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/Downloads/VIN_jian_oct/thumbs")
TRACKS = ["Vis", "SciVis", "InfoVis", "VAST", "VIS"]
COLORS = {"Vis": "#fbad3e", "SciVis": "#1f78c1", "InfoVis": "#ef4136", "VAST": "#39b54a", "VIS": "#8e63c7"}
LABELS = {"Vis": "Vis", "SciVis": "SciVis", "InfoVis": "InfoVis", "VAST": "VAST", "VIS": "VIS (2020 short papers; single track from 2021)"}
GREY = "#d3d3d3"


def first_int(x):
    m = re.match(r"\s*(\d+)", str(x))
    return int(m.group(1)) if m else None


def load(path):
    d = pd.read_csv(path, low_memory=False, dtype=str)
    d["Year"] = d["Year"].astype(int)
    d["vis_type"] = d["vis_type"].astype(int)
    return d


def bar_chart(stats, value, fmt, out, ylabel_ticks=None):
    years = sorted(stats.index.get_level_values(0).unique())
    fig, ax = plt.subplots(figsize=(25, 4.8), dpi=170)
    for i, y in enumerate(years):
        tr = [t for t in TRACKS if (y, t) in stats.index]
        total = stats.loc[(y, "all"), value]
        ax.bar(i, total, width=0.82, color=GREY, zorder=1)
        ax.text(i, total, fmt(total), ha="center", va="bottom", fontsize=13)
        w = 0.82 / max(len(tr) + 1, 2)
        for k, t in enumerate(tr):
            ax.bar(i - 0.41 + w * (k + 0.5), stats.loc[(y, t), value], width=w, color=COLORS[t], zorder=2)
    ax.set_xticks(range(len(years)))
    ax.set_xticklabels(years, rotation=40, fontsize=15)
    ax.tick_params(axis="y", labelsize=15)
    for s in ("top", "right", "left"):
        ax.spines[s].set_visible(False)
    ax.yaxis.grid(True, color="#eeeeee", zorder=0)
    ax.set_xlim(-0.6, len(years) - 0.4)
    handles = [plt.Rectangle((0, 0), 1, 1, color=GREY)] + [plt.Rectangle((0, 0), 1, 1, color=COLORS[t]) for t in TRACKS]
    ax.legend(handles, ["all tracks combined"] + [LABELS[t] for t in TRACKS], loc="lower center", fontsize=14,
              bbox_to_anchor=(0.5, 1.02), ncol=6, frameon=False)
    fig.tight_layout()
    fig.savefig(out)
    plt.close(fig)


def stats_by_year(d):
    img = d[~d.vis_type.isin([18, 19])]
    papers = d.drop_duplicates("Paper DOI").copy()
    papers["first"] = papers["Paper FirstPage"].map(first_int)
    papers["last"] = papers["Paper LastPage"].map(first_int)
    # some 1990s LastPage values are only the color-plate page ("27" - "506"); fall back to the gap to
    # the next paper's first page in the same proceedings, else the year's median length
    papers = papers.sort_values(["Year", "Conference", "PaperType", "first"])
    nxt = papers.groupby(["Year", "Conference", "PaperType"])["first"].shift(-1)
    pages = []
    for a, b, n in zip(papers["first"], papers["last"], nxt):
        if a is not None and b is not None and 1 <= b - a + 1 <= 40:
            pages.append(b - a + 1)
        elif a is not None and pd.notna(n) and 1 <= n - a <= 40:
            pages.append(n - a)
        else:
            pages.append(None)
    papers["pages"] = pages
    papers["pages"] = papers["pages"].fillna(papers.groupby("Year")["pages"].transform("median"))
    rows = []
    for (y, t), g in img.groupby(["Year", "Conference"]):
        p = papers[(papers.Year == y) & (papers.Conference == t)]
        rows.append((y, t, len(g), len(g) / p.pages.sum()))
    for y, g in img.groupby("Year"):
        p = papers[papers.Year == y]
        rows.append((y, "all", len(g), len(g) / p.pages.sum()))
    return pd.DataFrame(rows, columns=["Year", "Track", "images", "per_page"]).set_index(["Year", "Track"])


def thumb(url):
    os.makedirs(CACHE, exist_ok=True)
    fn = os.path.join(CACHE, re.sub(r"[^A-Za-z0-9._-]", "_", url)[-120:])
    if not os.path.exists(fn):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                open(fn, "wb").write(r.read())
        except Exception:
            return None
    try:
        im = Image.open(fn).convert("RGBA")
    except Exception:
        return None
    bg = Image.new("RGB", im.size, "white")
    bg.paste(im, mask=im.split()[3])  # transparent PNGs on white, not black
    return bg


def paper_card(d, out, years):
    """Timeline with one card column per track for each selected year, thumbnails grouped by paper."""
    random.seed(7)
    col_w, gap, thumb_h, head_h, top = 230, 22, 46, 34, 150
    col_h = 1400
    img = d[d.vis_type.isin([100, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 16, 50, 51])].copy()
    img.loc[(img.Conference == "VIS") & (img.PaperType == "C"), "Conference"] = "VIS short"
    groups = []
    for y in years:
        tr = [t for t in TRACKS + ["VIS short"] if ((img.Year == y) & (img.Conference == t)).any()]
        groups.append((y, tr))
    sel_years = [y for y, _ in groups]
    width = 120 + sum(len(tr) * col_w + max(gap * 3, ((sel_years[i + 1] if i + 1 < len(sel_years) else y + 1) - y - 1) * 78 + 40)
                      for i, (y, tr) in enumerate(groups))
    canvas = Image.new("RGB", (width, top + col_h + 30), "white")
    dr = ImageDraw.Draw(canvas)
    try:
        font_b = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 30)
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
    except OSError:
        font_b = font = ImageFont.load_default()
    # timeline axis 1990..max year
    y0, y1 = 1990, max(d.Year)
    axis_y = 70
    dr.line([(40, axis_y), (width - 40, axis_y)], fill="#999999", width=3)
    sel_years = [y for y, _ in groups]
    x = 60
    centers = {}
    for i, (y, tr) in enumerate(groups):
        w = len(tr) * col_w
        centers[y] = (x, x + w)
        nxt = sel_years[i + 1] if i + 1 < len(sel_years) else y + 1
        x += w + max(gap * 3, (nxt - y - 1) * 78 + 40)
    # place every year tick: selected years at their columns, others interpolated between
    sel = sorted(centers)
    tick_x = {}
    for yr in range(y0, y1 + 1):
        if yr in centers:
            tick_x[yr] = centers[yr][0] + 10
        else:
            prev = max(s for s in sel if s < yr)
            nxt = min((s for s in sel if s > yr), default=None)
            a = centers[prev][1] + 10
            b = (centers[nxt][0] + 10) if nxt else width - 60
            between = [v for v in range(prev + 1, (nxt or y1 + 1))]
            k = between.index(yr) + 1
            tick_x[yr] = a + (b - a) * k / (len(between) + 1)
    for yr, tx in tick_x.items():
        dr.ellipse([tx - 7, axis_y - 7, tx + 7, axis_y + 7], fill="#b8924d")
        dr.text((tx - 28, axis_y - 48), str(yr), fill="black", font=font_b if yr in centers else font)
    for y, tr in groups:
        cx = centers[y][0]
        dr.line([(tick_x[y], axis_y), (tick_x[y], top - 8)], fill="#b8924d", width=2)
        for t in tr:
            dr.rectangle([cx, top, cx + col_w - 6, top + head_h], fill="#eeeeee", outline="#888888")
            name = {"VIS": "VIS (journal)", "VIS short": "VIS (short)"}.get(t, t)
            tw = dr.textlength(name, font=font)
            dr.text((cx + (col_w - 6 - tw) / 2, top + 4), name, fill="black", font=font)
            dr.rectangle([cx, top + head_h, cx + col_w - 6, top + col_h], fill="#dfe6f3", outline="#888888")
            sub = img[(img.Year == y) & (img.Conference == t)]
            dois = list(sub["Paper DOI"].unique())
            random.shuffle(dois)
            py = top + head_h + 8
            for doi in dois:
                rows_ = sub[sub["Paper DOI"] == doi].head(6)
                ims = [thumb(t) or thumb(u) for t, u in zip(rows_["thumb_url"], rows_["url"])]
                ims = [im for im in ims if im is not None]
                if not ims:
                    continue
                # one white card per paper, thumbnails in rows
                row, rows, rw = [], [], 0
                for im in ims:
                    w = max(10, int(im.width * thumb_h / im.height))
                    w = min(w, col_w - 26)
                    if rw + w > col_w - 26 and row:
                        rows.append(row); row, rw = [], 0
                    row.append((im, w)); rw += w + 4
                rows.append(row)
                card_h = len(rows) * (thumb_h + 4) + 8
                if py + card_h > top + col_h - 6:
                    break
                dr.rectangle([cx + 5, py, cx + col_w - 11, py + card_h], fill="white", outline="#bbbbbb")
                ry = py + 5
                for row in rows:
                    rx = cx + 10
                    for im, w in row:
                        canvas.paste(im.resize((w, thumb_h)), (rx, ry))
                        rx += w + 4
                    ry += thumb_h + 4
                py += card_h + 8
            cx += col_w
    canvas.save(out, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True)
    ap.add_argument("--years", default="1990,1996,2002,2006,2010,2014,2018,2020,2022,2025")
    args = ap.parse_args()
    d = load(args.dataset)
    st = stats_by_year(d)
    st.to_csv(os.path.expanduser("~/Downloads/VIN_jian_oct/images_by_year.csv"))
    bar_chart(st, "images", lambda v: "%d" % v, os.path.join(REPO, "public/images/total-img-by-year.png"))
    bar_chart(st, "per_page", lambda v: "%.1f" % v, os.path.join(REPO, "public/images/avg-img-by-year.png"))
    paper_card(d, os.path.join(REPO, "public/images/paperCard.png"), [int(y) for y in args.years.split(",")])
    print(st.xs("all", level=1))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
从 SEC EDGAR 拉取 13F-HR 持仓，对比最近两期，生成 smart_money_positions 格式的增量数据。

用法:
    python3 scripts/update_data.py                       # 跑全部机构
    python3 scripts/update_data.py --inst "Berkshire Hathaway"
    python3 scripts/update_data.py --top 40              # 每家机构最多输出 40 条变化

输出:
    data/smart_money_positions_new.csv  —— 供人工复核后合并进主 CSV（不会自动覆盖）
    data/cusip_tickers.json             —— CUSIP→Ticker 映射缓存，遇到未知 CUSIP 会提示补充

仅依赖 Python 标准库。SEC 要求请求带联系方式 UA，限速 ~10 req/s（脚本保守 sleep）。
"""
import argparse
import csv
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
UA = {"User-Agent": "LazySheepcapital genghua321@gmail.com"}

# 机构 → (CIK, 分类)。CIK 来自 EDGAR 全文检索，跑一次脚本会打印
# EDGAR 注册名以便核对；标 None 的需要自行到 efts.sec.gov 查 CIK 后补上。
INSTITUTIONS = {
    "Berkshire Hathaway":       (1067983, "Core Smart Money"),
    "BlackRock":                (1364742, "Core Smart Money"),
    "Goldman Sachs":            (886982,  "Core Smart Money"),
    "JPMorgan Chase":           (19617,   "Core Smart Money"),
    "Morgan Stanley":           (895421,  "Core Smart Money"),
    "Vanguard":                 (102909,  "Long Only Asset Managers"),
    "Bridgewater Associates":   (1350694, "13F Hedge Funds"),
    "Citadel Advisors":         (1423053, "13F Hedge Funds"),
    "DE Shaw":                  (1009207, "13F Hedge Funds"),
    "Millennium Management":    (1273087, "13F Hedge Funds"),
    "Renaissance Technologies": (1037389, "13F Hedge Funds"),
    "Two Sigma Investments":    (1179392, "13F Hedge Funds"),
    "Point72 Asset Management": (1603466, "13F Hedge Funds"),
    "Appaloosa Management":     (1656456, "13F Hedge Funds"),
    "Pershing Square":          (1336528, "13F Hedge Funds"),
    "Third Point":              (1040273, "13F Hedge Funds"),
    "Blackstone":               (1393818, "Alternative Assets"),
    "KKR":                      (1404912, "Alternative Assets"),
    "Apollo Global Management": (None,    "Alternative Assets"),
    "Alphabet":                 (1652044, "AI Core Holdings"),
    "NVIDIA":                   (1045810, "AI Core Holdings"),
}

# 常见 CUSIP 种子映射；运行中可在 data/cusip_tickers.json 持续补充
SEED_CUSIPS = {
    "037833100": ("AAPL", "Apple"),          "594918104": ("MSFT", "Microsoft"),
    "67066G104": ("NVDA", "Nvidia"),         "023135106": ("AMZN", "Amazon"),
    "02079K305": ("GOOGL", "Alphabet A"),    "02079K107": ("GOOG", "Alphabet C"),
    "30303M102": ("META", "Meta Platforms"), "88160R101": ("TSLA", "Tesla"),
    "11135F101": ("AVGO", "Broadcom"),       "084670702": ("BRK.B", "Berkshire B"),
    "46625H100": ("JPM", "JPMorgan"),        "92826C839": ("V", "Visa"),
    "91324P102": ("UNH", "UnitedHealth"),    "30231G102": ("XOM", "Exxon Mobil"),
    "532457108": ("LLY", "Eli Lilly"),       "478160104": ("JNJ", "Johnson & Johnson"),
    "57636Q104": ("MA", "Mastercard"),       "22160K105": ("COST", "Costco"),
    "931142103": ("WMT", "Walmart"),         "060505104": ("BAC", "Bank of America"),
    "64110L106": ("NFLX", "Netflix"),        "007903107": ("AMD", "AMD"),
    "68389X105": ("ORCL", "Oracle"),         "747525103": ("QCOM", "Qualcomm"),
    "874039100": ("TSM", "TSMC ADR"),        "69608A108": ("PLTR", "Palantir"),
    "166764100": ("CVX", "Chevron"),         "674599105": ("OXY", "Occidental"),
    "458140100": ("INTC", "Intel"),          "595112103": ("MU", "Micron"),
    "86800U104": ("SMCI", "Super Micro"),    "92537N108": ("VRT", "Vertiv"),
}


def get(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(1.5 * (i + 1))
    return None


def quarter_label(date_str):
    y, m = int(date_str[:4]), int(date_str[5:7])
    return f"Q{(m - 1) // 3 + 1} {y}"


def recent_13f_filings(cik, n=2):
    """返回最近 n 期 13F-HR: [(accession, report_date, filing_date), ...] 新→旧"""
    data = json.loads(get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json"))
    name = data.get("name", "?")
    rec = data["filings"]["recent"]
    out = []
    for form, acc, rdate, fdate in zip(rec["form"], rec["accessionNumber"],
                                       rec["reportDate"], rec["filingDate"]):
        if form == "13F-HR":
            out.append((acc, rdate, fdate))
        if len(out) >= n:
            break
    return name, out


def fetch_holdings(cik, accession):
    """下载并解析 information table，返回 {cusip: {issuer, value_usd, shares}}"""
    acc = accession.replace("-", "")
    idx = json.loads(get(f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/index.json"))
    xml_name = None
    for item in idx["directory"]["item"]:
        n = item["name"].lower()
        if n.endswith(".xml") and "primary_doc" not in n:
            xml_name = item["name"]
            break
    if not xml_name:
        raise RuntimeError(f"no infotable xml in {accession}")
    raw = get(f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/{xml_name}")
    # 去掉 namespace 前缀，简化查找
    raw = re.sub(rb'xmlns(:\w+)?="[^"]+"', b"", raw)
    raw = re.sub(rb"<(/?)\w+:", rb"<\1", raw)
    root = ET.fromstring(raw)
    holdings = {}
    for it in root.iter("infoTable"):
        cusip = (it.findtext("cusip") or "").strip().upper()
        if not cusip:
            continue
        h = holdings.setdefault(cusip, {"issuer": (it.findtext("nameOfIssuer") or "").strip(),
                                        "value": 0, "shares": 0})
        h["value"] += int(float(it.findtext("value") or 0))
        amt = it.find("shrsOrPrnAmt")
        if amt is not None:
            h["shares"] += int(float(amt.findtext("sshPrnamt") or 0))
    return holdings


def diff_rows(inst, cat, cur, prev, rdate, fdate, cusip_map, top):
    rows, unknown = [], set()
    changes = []
    for cusip, h in cur.items():
        p = prev.get(cusip)
        if p is None:
            changes.append((cusip, h, None))
        elif h["shares"] != p["shares"]:
            changes.append((cusip, h, p))
    for cusip, p in prev.items():
        if cusip not in cur:
            changes.append((cusip, None, p))

    def val_delta(c):
        _, h, p = c
        return abs((h["value"] if h else 0) - (p["value"] if p else 0))

    changes.sort(key=val_delta, reverse=True)
    for cusip, h, p in changes[:top]:
        if cusip in cusip_map:
            ticker, company = cusip_map[cusip]
        else:
            issuer = (h or p)["issuer"]
            ticker, company = issuer.upper()[:24], issuer.title()
            unknown.add(f"{cusip}  {issuer}")
        if h and not p:
            action, pct = "New Position", ""
        elif p and not h:
            action, pct = "Exited", -100
        else:
            d = h["shares"] - p["shares"]
            action = "Added" if d > 0 else "Reduced" if d < 0 else "Held"
            pct = round(d / p["shares"] * 100, 1) if p["shares"] else ""
        dv = ((h["value"] if h else 0) - (p["value"] if p else 0)) / 1e6  # USD → $M
        rows.append([cat, inst, quarter_label(rdate), rdate, ticker, company,
                     action, round(dv, 1), pct,
                     "EDGAR 13F 自动生成，待人工复核", f"披露日: {fdate}"])
    return rows, unknown


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inst", help="只跑指定机构（名称需与 INSTITUTIONS 一致）")
    ap.add_argument("--top", type=int, default=30, help="每家机构最多输出的变化条数")
    args = ap.parse_args()

    map_path = DATA / "cusip_tickers.json"
    cusip_map = dict(SEED_CUSIPS)
    if map_path.exists():
        cusip_map.update({k: tuple(v) for k, v in json.loads(map_path.read_text()).items()})

    targets = {args.inst: INSTITUTIONS[args.inst]} if args.inst else INSTITUTIONS
    all_rows, all_unknown = [], set()

    for inst, (cik, cat) in targets.items():
        if cik is None:
            print(f"⚠️  {inst}: 未配置 CIK，跳过（到 https://efts.sec.gov/LATEST/search-index?q= 查询后填入脚本）")
            continue
        try:
            name, filings = recent_13f_filings(cik)
            if len(filings) < 2:
                print(f"⚠️  {inst} ({name}): 13F-HR 不足两期，跳过")
                continue
            (acc_new, rd_new, fd_new), (acc_old, rd_old, _) = filings[0], filings[1]
            print(f"▶ {inst}  [EDGAR: {name}]  {rd_old} → {rd_new}")
            cur = fetch_holdings(cik, acc_new)
            time.sleep(0.2)
            prev = fetch_holdings(cik, acc_old)
            time.sleep(0.2)
            rows, unknown = diff_rows(inst, cat, cur, prev, rd_new, fd_new, cusip_map, args.top)
            all_rows += rows
            all_unknown |= unknown
            print(f"   {len(cur)} 持仓 vs {len(prev)} 持仓 → {len(rows)} 条变化")
        except Exception as e:
            print(f"✗ {inst}: {e}")

    out = DATA / "smart_money_positions_new.csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["category", "institution", "quarter", "quarter_end_date",
                    "stock_ticker", "stock_company", "action", "value_change_usd_mn",
                    "pct_change", "notes", "timing_known"])
        w.writerows(all_rows)
    map_path.write_text(json.dumps({k: list(v) for k, v in cusip_map.items()},
                                   ensure_ascii=False, indent=1))
    print(f"\n✅ 共 {len(all_rows)} 条 → {out.relative_to(ROOT)}（人工复核后合并进主 CSV）")
    if all_unknown:
        print(f"\n⚠️  {len(all_unknown)} 个未知 CUSIP（已用发行人名称占位，可补充进 data/cusip_tickers.json）:")
        for u in sorted(all_unknown)[:20]:
            print("   ", u)


if __name__ == "__main__":
    sys.exit(main())

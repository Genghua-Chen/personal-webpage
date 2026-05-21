#!/usr/bin/env python3
"""
parse_pasted_holdings.py — parse a WhaleWisdom holdings table pasted from the browser
and update lazysheepcapital/data/holdings_summary.json

Usage:
    1. On WhaleWisdom, select all the table rows and copy (Cmd+C)
    2. Paste into a text file, e.g. /tmp/paste.txt
    3. Run:
           python3 scripts/parse_pasted_holdings.py --fund VANGUARD --file /tmp/paste.txt
       OR pipe directly:
           pbpaste | python3 scripts/parse_pasted_holdings.py --fund VANGUARD

The script auto-detects WhaleWisdom column order:
    Ticker | Type | Sector | Value($K) | Shares | %Portfolio | %Prev | (rank) | ChgShares

Fund metadata (name, manager, emoji, category) is looked up from the FUND_META table.
If your fund isn't listed, use --name / --manager flags to set it manually.
"""

import re
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

OUTPUT_JSON = Path(__file__).parent.parent / "lazysheepcapital" / "data" / "holdings_summary.json"

FUND_META = {
    "VANGUARD":    ("Vanguard",                 "Salim Ramji",      "📊", "Index / Passive"),
    "BLK":         ("BlackRock",                "Larry Fink",       "🏔️", "Asset Manager"),
    "JPMORGAN":    ("JPMorgan Chase",           "Jamie Dimon",      "🏦", "Investment Bank"),
    "MORGANST":    ("Morgan Stanley",           "James Gorman",     "🏢", "Investment Bank"),
    "GOLDMAN":     ("Goldman Sachs",            "David Solomon",    "💰", "Investment Bank"),
    "DESHAW":      ("DE Shaw",                  "David Shaw",       "🔬", "Quant"),
    "POINT72":     ("Point72 Asset Management", "Steve Cohen",      "🎲", "Multi-Strategy"),
    "APOLLO":      ("Apollo Global Management", "Marc Rowan",       "🦅", "Private Equity"),
    "BLACKSTONE":  ("Blackstone",               "Steve Schwarzman", "⚫", "Private Equity"),
    "KKR":         ("KKR",                      "Henry Kravis",     "🔑", "Private Equity"),
    "ALPHABET":    ("Alphabet",                 "Sundar Pichai",    "🔤", "Technology"),
    "BRK":         ("Berkshire Hathaway",       "Warren Buffett",   "🏛️", "Value"),
    "PSC":         ("Pershing Square",          "Bill Ackman",      "♟️", "Activist"),
    "AM":          ("Appaloosa Management",     "David Tepper",     "🐎", "Macro / Value"),
    "TP":          ("Third Point",              "Daniel Loeb",      "🔱", "Activist / Event"),
    "CITADEL":     ("Citadel Advisors",         "Ken Griffin",      "⚔️", "Multi-Strategy"),
    "MILLENNIUM":  ("Millennium Management",    "Izzy Englander",   "⚡", "Multi-Strategy"),
    "TWOSIGMA":    ("Two Sigma Investments",    "John Overdeck",    "📐", "Quant"),
    "RENTECH":     ("Renaissance Technologies", "Jim Simons",       "🧮", "Quant"),
    "BRIDGEWATER": ("Bridgewater Associates",   "Ray Dalio",        "🌊", "Macro"),
    "TGM":         ("Tiger Global Management",  "Chase Coleman",    "🐯", "Growth / Tech"),
    "TCI":         ("TCI Fund Management",      "Chris Hohn",       "🎯", "Concentrated"),
    "GFT":         ("Gates Foundation Trust",   "Bill Gates",       "🌍", "Foundation"),
    "BAUPOST":     ("Baupost Group",            "Seth Klarman",     "🦉", "Value"),
    "SAM":         ("Scion Asset Management",   "Michael Burry",    "🌊", "Value / Contrarian"),
}


def clean_num(s):
    return re.sub(r"[^0-9.\-]", "", s)


def parse_value(s):
    """Parse '$1.23B', '$456M', '880,933' → float in millions."""
    s = s.replace(",", "").replace("$", "").strip()
    m = re.match(r"([\-\d.]+)\s*([BbTtMmKk]?)", s)
    if not m:
        return 0.0
    n = float(m.group(1))
    suf = m.group(2).upper()
    if suf in ("B", "T"):
        return n * 1000
    if suf == "K":
        return n / 1000
    return n  # already M, or raw → treat as M


def parse_pct(s):
    s = clean_num(s.replace("%", ""))
    try:
        return float(s)
    except ValueError:
        return 0.0


def parse_shares(s):
    s = re.sub(r"[^0-9]", "", s)
    return int(s) if s else 0


def infer_activity(chg_val):
    if chg_val > 0:
        return "Added"
    if chg_val < 0:
        return "Reduced"
    return "Held"


def detect_columns(header_row):
    """Try to identify column positions from a header row."""
    cols = {}
    for i, cell in enumerate(header_row):
        c = cell.lower().strip()
        if "ticker" in c or "symbol" in c:
            cols["ticker"] = i
        elif "company" in c or "name" in c or "security" in c:
            cols["company"] = i
        elif "sector" in c or "industry" in c:
            cols["sector"] = i
        elif "value" in c or "market" in c:
            cols["value"] = i
        elif "share" in c:
            cols["shares"] = i
        elif "%" in c and "prev" not in c and "chg" not in c and "change" not in c:
            cols["pct"] = i
        elif "change" in c or "chg" in c:
            cols["chg"] = i
    return cols


def parse_table(text):
    """Parse tab-separated WhaleWisdom table text into holdings list."""
    lines = [l for l in text.strip().split("\n") if l.strip()]
    holdings = []
    cols = {}
    quarter_date = ""
    aum_bn = 0.0

    # Try to extract quarter date from text
    for line in lines:
        d = re.search(r"(20\d{2}-\d{2}-\d{2})", line)
        if d:
            quarter_date = d.group(1)
            break
        # WhaleWisdom sometimes shows "Q1 2026" or "as of MM/DD/YYYY"
        d2 = re.search(r"(\d{1,2}/\d{1,2}/20\d{2})", line)
        if d2:
            try:
                dt = datetime.strptime(d2.group(1), "%m/%d/%Y")
                quarter_date = dt.strftime("%Y-%m-%d")
                break
            except Exception:
                pass

    for line in lines:
        parts = line.split("\t")
        if not parts:
            continue

        # Detect header row
        joined = " ".join(parts).lower()
        if any(k in joined for k in ("ticker", "symbol", "% portfolio", "market value")):
            cols = detect_columns(parts)
            continue

        # Skip non-data rows
        if len(parts) < 3:
            continue
        if not re.match(r"^[A-Z]", parts[0].strip()):
            continue

        ticker = parts[0].strip().upper()
        if not ticker or ticker in ("TICKER", "SYMBOL"):
            continue

        # Heuristic column detection if header wasn't found
        # WhaleWisdom default: Ticker | Type | Sector | Value($K) | Shares | %Port | %Prev | Rank | ChgShares
        if not cols:
            # Try to identify numeric columns
            nums = [(i, p.replace(",","").replace("%","").replace("$","").strip()) for i, p in enumerate(parts)]
            val_idx = sh_idx = pct_idx = chg_idx = -1
            for i, n in nums[2:]:  # skip first 2 (ticker, type/name)
                if n.startswith("-") or (n.replace(".","").isdigit() and len(n) > 5):
                    if val_idx == -1:
                        val_idx = i
                    elif sh_idx == -1:
                        sh_idx = i
                elif "." in n and 0 < float(n or "0") < 100 and pct_idx == -1:
                    pct_idx = i
            # Last numeric column is usually change in shares
            for i in range(len(parts)-1, -1, -1):
                n = parts[i].replace(",","").strip()
                if re.match(r"^-?\d+$", n) and i != val_idx and i != sh_idx:
                    chg_idx = i
                    break
        else:
            val_idx = cols.get("value", 3)
            sh_idx  = cols.get("shares", 4)
            pct_idx = cols.get("pct", 5)
            chg_idx = cols.get("chg", -1)

        def safe_get(idx, default="0"):
            if idx < 0 or idx >= len(parts):
                return default
            return parts[idx].strip() or default

        company = safe_get(cols.get("company", 1), ticker) if cols else safe_get(1, ticker)
        company = company.replace("**Subadvisor**", "").replace("**", "").strip() or ticker

        raw_val = safe_get(val_idx, "0")
        raw_sh  = safe_get(sh_idx, "0")
        raw_pct = safe_get(pct_idx, "0")
        raw_chg = safe_get(chg_idx, "0") if chg_idx >= 0 else "0"

        # Detect value unit: if col5 >> col4 by 10x+ → col4=shares, col5=value($)
        # Otherwise col4=value($K), col5=shares
        v4 = float(clean_num(raw_val) or "0")
        v5 = float(clean_num(raw_sh)  or "0")
        if v5 > v4 * 10 and v4 > 0:
            # JPMorgan-style: col4=shares, col5=value($)
            shares   = int(v4)
            value_mn = round(v5 / 1_000_000, 3)
            raw_sh   = raw_val  # already set above
        else:
            # Vanguard-style: col4=value($K), col5=shares
            value_mn = round(v4 / 1000, 3) if v4 > 1000 else round(v4, 3)
            shares   = int(v5)

        shares = parse_shares(raw_sh)
        pct    = parse_pct(raw_pct)
        chg    = int(clean_num(raw_chg) or "0") if raw_chg != "0" else 0
        activity = infer_activity(chg)

        if not ticker or (value_mn == 0 and shares == 0):
            continue

        holdings.append({
            "ticker":   ticker,
            "company":  company,
            "value_mn": round(value_mn, 3),
            "pct":      round(pct, 4),
            "shares":   shares,
            "activity": activity,
        })

    # Compute/estimate AUM from first holding if pct > 0
    for h in holdings:
        if h["pct"] > 0 and h["value_mn"] > 0:
            aum_bn = round(h["value_mn"] / (h["pct"] / 100) / 1000, 2)
            break

    # Fill missing pct from value
    total_val = sum(h["value_mn"] for h in holdings)
    for h in holdings:
        if h["pct"] == 0 and total_val > 0:
            h["pct"] = round(h["value_mn"] / total_val * 100, 4)

    return holdings, quarter_date, aum_bn


def quarter_label(date_str):
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return f"Q{(dt.month-1)//3+1} {dt.year}"
    except Exception:
        return ""


def load_json():
    if OUTPUT_JSON.exists():
        return json.loads(OUTPUT_JSON.read_text())
    return {"last_updated": "", "source": "whalewisdom.com · dataroma.com · SEC EDGAR", "funds": []}


def main():
    parser = argparse.ArgumentParser(description="Parse pasted WhaleWisdom table → holdings_summary.json")
    parser.add_argument("--fund",     required=True, help="Fund ID (e.g. VANGUARD, DESHAW)")
    parser.add_argument("--file",     help="Text file containing pasted table (default: stdin)")
    parser.add_argument("--quarter",  help="Quarter date override, e.g. 2026-03-31")
    parser.add_argument("--aum",      type=float, help="AUM in billions override")
    parser.add_argument("--name",     help="Fund name override")
    parser.add_argument("--manager",  help="Manager name override")
    parser.add_argument("--emoji",    default="🏛️", help="Emoji override")
    parser.add_argument("--category", help="Category override")
    parser.add_argument("--append",   action="store_true", help="Append to existing holdings instead of replacing")
    args = parser.parse_args()

    fund_id = args.fund.upper()
    meta = FUND_META.get(fund_id, (fund_id, "Unknown", "🏛️", "Unknown"))
    name     = args.name     or meta[0]
    manager  = args.manager  or meta[1]
    emoji    = args.emoji    or meta[2]
    category = args.category or meta[3]

    # Read input
    if args.file:
        text = Path(args.file).read_text()
    else:
        text = sys.stdin.read()

    if not text.strip():
        print("ERROR: No input. Paste table text into stdin or use --file.")
        sys.exit(1)

    holdings, quarter_date, aum_bn = parse_table(text)

    if not holdings:
        print("ERROR: Could not parse any holdings from input.")
        sys.exit(1)

    if args.quarter:
        quarter_date = args.quarter
    if args.aum:
        aum_bn = args.aum

    quarter = quarter_label(quarter_date)

    data = load_json()

    if args.append:
        # Merge with existing entry
        existing = next((f for f in data["funds"] if f["id"] == fund_id), None)
        if existing:
            existing_tickers = {h["ticker"] for h in existing["holdings"]}
            new = [h for h in holdings if h["ticker"] not in existing_tickers]
            existing["holdings"].extend(new)
            existing["holdings"].sort(key=lambda h: h["value_mn"], reverse=True)
            existing["num_holdings"] = len(existing["holdings"])
            print(f"Appended {len(new)} new holdings to {fund_id} (total: {existing['num_holdings']})")
        else:
            print(f"No existing entry for {fund_id}, creating new.")
            args.append = False

    if not args.append:
        entry = {
            "id":           fund_id,
            "name":         name,
            "manager":      manager,
            "emoji":        emoji,
            "category":     category,
            "quarter":      quarter,
            "quarter_date": quarter_date,
            "aum_bn":       aum_bn,
            "num_holdings": len(holdings),
            "holdings":     sorted(holdings, key=lambda h: h["value_mn"], reverse=True),
        }
        data["funds"] = [f for f in data["funds"] if f["id"] != fund_id]
        data["funds"].append(entry)

    data["last_updated"] = datetime.now().strftime("%Y-%m-%d")
    data["funds"].sort(key=lambda f: f.get("aum_bn", 0), reverse=True)
    OUTPUT_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    fund_entry = next(f for f in data["funds"] if f["id"] == fund_id)
    print(f"\n✓ {fund_id} ({name}) → {OUTPUT_JSON}")
    print(f"  Quarter: {quarter} · AUM: ${aum_bn:.1f}B · Holdings: {fund_entry['num_holdings']}")
    print(f"\n  Top 5:")
    for h in fund_entry["holdings"][:5]:
        print(f"    {h['ticker']:7s} {h['company']:35s} ${h['value_mn']:.1f}M  {h['pct']}%  {h['activity']}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
fetch_holdings.py — scrape 13F holdings from WhaleWisdom using Selenium
and update lazysheepcapital/data/holdings_summary.json

Requirements:
    pip3 install selenium webdriver-manager

Usage:
    python3 scripts/fetch_holdings.py                      # update all funds
    python3 scripts/fetch_holdings.py --fund VANGUARD      # one fund
    python3 scripts/fetch_holdings.py --list               # list fund IDs
    python3 scripts/fetch_holdings.py --headless false      # show browser window
"""

import re
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHROMEDRIVER_PATH = "/tmp/chromedriver_112/chromedriver"

OUTPUT_JSON = Path(__file__).parent.parent / "lazysheepcapital" / "data" / "holdings_summary.json"

# WhaleWisdom filer slugs + display metadata
FUNDS = {
    "BRK":         ("berkshire-hathaway-inc",              "Berkshire Hathaway",       "Warren Buffett",  "🏛️", "Value"),
    "PSC":         ("pershing-square-capital-management-lp","Pershing Square",          "Bill Ackman",     "♟️", "Activist"),
    "AM":          ("appaloosa-management-lp",              "Appaloosa Management",     "David Tepper",    "🐎", "Macro / Value"),
    "TP":          ("third-point-llc",                      "Third Point",              "Daniel Loeb",     "🔱", "Activist / Event"),
    "BAUPOST":     ("baupost-group-llc",                    "Baupost Group",            "Seth Klarman",    "🦉", "Value"),
    "TGM":         ("tiger-global-management-llc",          "Tiger Global Management",  "Chase Coleman",   "🐯", "Growth / Tech"),
    "TCI":         ("tci-fund-management-ltd",              "TCI Fund Management",      "Chris Hohn",      "🎯", "Concentrated"),
    "GFT":         ("bill-melinda-gates-foundation-trust",  "Gates Foundation Trust",   "Bill Gates",      "🌍", "Foundation"),
    "SAM":         ("scion-asset-management-llc",           "Scion Asset Management",   "Michael Burry",   "🌊", "Value / Contrarian"),
    "BLK":         ("blackrock-inc",                        "BlackRock",                "Larry Fink",      "🏔️", "Asset Manager"),
    "CITADEL":     ("citadel-advisors-llc",                 "Citadel Advisors",         "Ken Griffin",     "⚔️", "Multi-Strategy"),
    "BRIDGEWATER": ("bridgewater-associates-lp",            "Bridgewater Associates",   "Ray Dalio",       "🌊", "Macro"),
    "RENTECH":     ("renaissance-technologies-llc",         "Renaissance Technologies", "Jim Simons",      "🧮", "Quant"),
    "TWOSIGMA":    ("two-sigma-investments-lp",             "Two Sigma Investments",    "John Overdeck",   "📐", "Quant"),
    "MILLENNIUM":  ("millennium-management-llc",            "Millennium Management",    "Izzy Englander",  "⚡", "Multi-Strategy"),
    "GOLDMAN":     ("goldman-sachs-group-inc",              "Goldman Sachs",            "David Solomon",   "💰", "Investment Bank"),
    "VANGUARD":    ("vanguard-group-inc",                   "Vanguard",                 "Mortimer Buckley","📊", "Index / Passive"),
    "JPMORGAN":    ("jpmorgan-chase-co",                    "JPMorgan Chase",           "Jamie Dimon",     "🏦", "Investment Bank"),
    "MORGANST":    ("morgan-stanley",                       "Morgan Stanley",           "James Gorman",    "🏢", "Investment Bank"),
    "DESHAW":      ("de-shaw-co-lp",                        "DE Shaw",                  "David Shaw",      "🔬", "Quant"),
    "POINT72":     ("point72-asset-management-lp",          "Point72 Asset Management", "Steve Cohen",     "🎲", "Multi-Strategy"),
    "APOLLO":      ("apollo-global-management-inc",         "Apollo Global Management", "Marc Rowan",      "🦅", "Private Equity"),
    "BLACKSTONE":  ("blackstone-inc",                       "Blackstone",               "Steve Schwarzman","⚫", "Private Equity"),
    "KKR":         ("kkr-co-inc",                           "KKR",                      "Henry Kravis",    "🔑", "Private Equity"),
    "ALPHABET":    ("alphabet-inc",                         "Alphabet",                 "Sundar Pichai",   "🔤", "Technology"),
}

BASE_URL = "https://whalewisdom.com/filer/{slug}"


def make_driver(headless: bool = True) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1440,900")
    # Anti-detection
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.49 Safari/537.36")
    service = Service(executable_path=CHROMEDRIVER_PATH)
    driver = webdriver.Chrome(service=service, options=opts)
    # Mask navigator.webdriver
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    return driver


def parse_value_str(s: str) -> float:
    """'$1.23B' -> 1230.0 (millions), '$456M' -> 456.0, '$1,234' -> 0.001234"""
    s = s.replace(",", "").replace("$", "").strip()
    m = re.match(r"([\d.]+)\s*([BbMmKkTt]?)", s)
    if not m:
        return 0.0
    n = float(m.group(1))
    suf = m.group(2).upper()
    if suf in ("B", "T"):
        return n * 1000
    if suf == "K":
        return n / 1000
    return n


def parse_pct(s: str) -> float:
    s = re.sub(r"[^0-9.]", "", s)
    try:
        return float(s)
    except ValueError:
        return 0.0


def parse_shares(s: str) -> int:
    s = re.sub(r"[^0-9]", "", s)
    return int(s) if s else 0


def infer_activity(change_str: str) -> str:
    s = change_str.strip().lower()
    if "new" in s:
        return "New"
    if s.startswith("+") or "increas" in s or "add" in s or "buy" in s:
        return "Added"
    if s.startswith("-") or "decreas" in s or "reduc" in s or "sold" in s:
        return "Reduced"
    if "exit" in s or "sold out" in s:
        return "Exited"
    return "Held"


def quarter_from_date(date_str: str) -> str:
    """'2026-03-31' -> 'Q1 2026'"""
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        q = (dt.month - 1) // 3 + 1
        return f"Q{q} {dt.year}"
    except Exception:
        return ""


def scrape_whalewisdom(driver: webdriver.Chrome, slug: str):
    url = BASE_URL.format(slug=slug)
    print(f"  → {url}")
    driver.get(url)

    wait = WebDriverWait(driver, 20)
    time.sleep(3)  # let initial page load + ads render

    from selenium.webdriver.common.keys import Keys

    # Press Escape first to close any modal
    try:
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
        time.sleep(0.5)
    except Exception:
        pass

    # Click any close/dismiss buttons
    dismiss_selectors = [
        "button[id*='close']", "button[class*='close']", "button[aria-label*='close']",
        ".modal-close", ".close-btn", "#close-btn", "[class*='dismiss']",
        "button[class*='accept']", "#onetrust-accept-btn-handler",
        ".fc-button-label", ".fc-cta-consent",
        "button[class*='agree']", "button[class*='consent']",
        "[data-testid='close']", ".modal .btn", ".popup .btn",
        "a[class*='close']", "span[class*='close']",
    ]
    for sel in dismiss_selectors:
        try:
            btns = driver.find_elements(By.CSS_SELECTOR, sel)
            for btn in btns:
                if btn.is_displayed():
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(0.3)
        except Exception:
            pass

    # Nuclear option: use JS to remove all modals, overlays, and ad iframes
    try:
     driver.execute_script("""
        // Remove fixed/sticky overlays and modals
        document.querySelectorAll(
            '.modal, .modal-backdrop, .overlay, [class*="overlay"], [class*="modal"],
            [class*="popup"], [class*="lightbox"], [id*="modal"], [id*="overlay"],
            [id*="popup"], .fc-consent-root, .fc-dialog-container,
            [aria-modal="true"], [role="dialog"]'
        ).forEach(el => el.remove());

        // Remove ad iframes
        document.querySelectorAll('iframe').forEach(f => f.remove());

        // Reset body overflow (often locked by modals)
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    """)
    except Exception:
        pass
    time.sleep(0.5)

    # Wait for the holdings tab to appear and click it
    try:
        tab = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "a#tabholdings_tab_link, a[href='#tabholdings'], .holdings-tab")
        ))
        driver.execute_script("arguments[0].click();", tab)
    except Exception:
        pass  # may already be on holdings view

    # Wait for the holdings table to load
    try:
        wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "table.holdings-table, #holdings_table, table[id*='holding'], .dataTables_wrapper table")
        ))
        time.sleep(2)  # let JS finish rendering
    except Exception:
        time.sleep(4)

    # --- Pull AUM / quarter from page text ---
    aum_bn = 0.0
    quarter_date = ""
    try:
        page_text = driver.find_element(By.TAG_NAME, "body").text
        # AUM
        m = re.search(r"\$([\d,.]+)\s*[Bb]illion", page_text)
        if not m:
            m = re.search(r"Portfolio Value[:\s]+\$([\d,.]+)\s*([BbMm])", page_text)
        if m:
            raw = float(m.group(1).replace(",", ""))
            suf = m.group(2).upper() if len(m.groups()) > 1 else "B"
            aum_bn = raw if suf == "B" else raw / 1000
        # Quarter date
        d = re.search(r"(\d{4}-\d{2}-\d{2})", page_text)
        if d:
            quarter_date = d.group(1)
        else:
            d2 = re.search(r"(Q[1-4]\s+20\d{2})", page_text)
            if d2:
                pass  # we'll derive it later
    except Exception:
        pass

    # --- Parse holdings table ---
    holdings = []
    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            "table.holdings-table tbody tr, #holdings_table tbody tr, .dataTables_wrapper tbody tr"
        )
        if not rows:
            # Try any table
            rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")

        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) < 3:
                continue
            texts = [c.text.strip() for c in cells]

            # Heuristic: first non-empty cell that looks like a ticker
            ticker = ""
            company = ""
            value_mn = 0.0
            pct = 0.0
            shares = 0
            activity = "Held"

            for i, t in enumerate(texts):
                if re.match(r"^[A-Z]{1,6}$", t) and not ticker:
                    ticker = t
                    company = texts[i + 1] if i + 1 < len(texts) else ""
                    break

            if not ticker:
                continue

            # Scan remaining cells for value / pct / shares / change
            for t in texts:
                if re.search(r"\$[\d,.]+[BbMm]?", t) and value_mn == 0:
                    value_mn = parse_value_str(t)
                elif re.search(r"^\d+\.?\d*%$", t) and pct == 0:
                    pct = parse_pct(t)
                elif re.match(r"^[\d,]+$", t) and shares == 0 and len(t) > 3:
                    shares = parse_shares(t)
                elif any(k in t.lower() for k in ("new", "add", "increas", "reduc", "decreas", "exit", "sold")):
                    activity = infer_activity(t)

            if ticker and value_mn > 0:
                holdings.append({
                    "ticker": ticker,
                    "company": company,
                    "value_mn": round(value_mn, 2),
                    "pct": round(pct, 4),
                    "shares": shares,
                    "activity": activity,
                })

    except Exception as e:
        print(f"  Table parse error: {e}")

    if not holdings:
        print("  WARNING: no holdings extracted")
        return None

    # Compute pct from value if missing
    total_val = sum(h["value_mn"] for h in holdings)
    for h in holdings:
        if h["pct"] == 0 and total_val > 0:
            h["pct"] = round(h["value_mn"] / total_val * 100, 4)

    holdings.sort(key=lambda h: h["value_mn"], reverse=True)
    quarter = quarter_from_date(quarter_date)

    return {
        "quarter": quarter,
        "quarter_date": quarter_date,
        "aum_bn": round(aum_bn, 2),
        "num_holdings": len(holdings),
        "holdings": holdings,
    }


def load_json() -> dict:
    if OUTPUT_JSON.exists():
        return json.loads(OUTPUT_JSON.read_text())
    return {"last_updated": "", "source": "whalewisdom.com · dataroma.com · SEC EDGAR", "funds": []}


def save_json(data: dict):
    data["last_updated"] = datetime.now().strftime("%Y-%m-%d")
    OUTPUT_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"\n✓ Saved → {OUTPUT_JSON}")


def main():
    parser = argparse.ArgumentParser(description="Fetch 13F holdings via Selenium from WhaleWisdom")
    parser.add_argument("--fund",      help="Fund ID to update (e.g. VANGUARD, BLK)")
    parser.add_argument("--list",      action="store_true", help="List all fund IDs")
    parser.add_argument("--headless",  default="true", help="Run headless browser (true/false)")
    args = parser.parse_args()

    if args.list:
        print("Available fund IDs:")
        for fid, meta in FUNDS.items():
            print(f"  {fid:12s}  {meta[1]:35s} {meta[2]}")
        return

    headless = args.headless.lower() != "false"
    data = load_json()

    targets = [args.fund.upper()] if args.fund else list(FUNDS.keys())
    targets = [t for t in targets if t in FUNDS]

    if not targets:
        print(f"Unknown fund. Use --list to see available IDs.")
        return

    print(f"Starting {'headless ' if headless else ''}Chrome...")
    driver = make_driver(headless=headless)

    try:
        for fund_id in targets:
            meta = FUNDS[fund_id]
            slug, name, manager, emoji, category = meta
            print(f"\n[{fund_id}] {name}")

            result = scrape_whalewisdom(driver, slug)
            if not result or not result["holdings"]:
                print(f"  Skipped — no data extracted")
                continue

            data["funds"] = [f for f in data["funds"] if f["id"] != fund_id]
            data["funds"].append({
                "id": fund_id,
                "name": name,
                "manager": manager,
                "emoji": emoji,
                "category": category,
                **result,
            })
            print(f"  ✓ {result['num_holdings']} holdings · AUM ${result['aum_bn']:.1f}B · {result['quarter']}")

    finally:
        driver.quit()

    data["funds"].sort(key=lambda f: f.get("aum_bn", 0), reverse=True)
    save_json(data)


if __name__ == "__main__":
    main()

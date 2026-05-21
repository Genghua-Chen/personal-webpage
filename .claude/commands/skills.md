# /skills — Project Skills & Capabilities Reference

This command documents what this project can do and how to use Claude Code to update it.

---

## Available Slash Commands

| Command | Description |
|---------|-------------|
| `/skills` | Show this reference |
| `/update-smart-money` | Scrape latest 13F data from dataroma and update holdings |

---

## Project: LazySheepcapital Financial Dashboard

### Data Sources
- **13F Holdings**: `dataroma.com` — fetch latest quarterly holdings per fund
- **Position Changes**: Manually curated in `lazysheepcapital/data/smart_money_positions.csv`
- **Holdings Summary**: `lazysheepcapital/data/holdings_summary.json` — scraped Q1 2026 data

### Key Files
- `lazysheepcapital/smart_money/index.html` — main dashboard (Holdings + Position Changes)
- `lazysheepcapital/data/holdings_summary.json` — 13F portfolio compositions per fund
- `lazysheepcapital/data/smart_money_positions.csv` — quarterly position changes (signals)
- `lazysheepcapital/index.html` — main landing page

---

## How to Update Smart Money Data

### Refresh holdings from dataroma

Fetch from these dataroma fund codes:
- `BRK` — Berkshire Hathaway (Warren Buffett)
- `psc` — Pershing Square (Bill Ackman)
- `AM`  — Appaloosa Management (David Tepper)
- `tp`  — Third Point (Daniel Loeb)
- `BAUPOST` — Baupost Group (Seth Klarman)
- `TGM` — Tiger Global (Chase Coleman)
- `tci` — TCI Fund Management (Chris Hohn)
- `GFT` — Gates Foundation Trust (Bill Gates)
- `SAM` — Scion Asset Management (Michael Burry)

URL pattern: `https://www.dataroma.com/m/holdings.php?m=<CODE>`

Ask Claude to fetch these pages and update `holdings_summary.json`.

### Add new quarter data to position changes CSV

CSV columns: `category,institution,quarter,quarter_end_date,stock_ticker,stock_company,action,value_change_usd_mn,pct_change,notes,timing_known`

Actions: `New Position`, `Added`, `Held`, `Reduced`, `Exited`, `Mixed Signal`, `Smart Money Buy`

---

## Tech Stack

- Pure HTML + CSS + Vanilla JS (no frameworks, no bundler)
- Hosted on GitHub Pages (CNAME configured)
- Charts: CSS-only (no D3, no Chart.js)
- Data: JSON + CSV loaded via `fetch()`

---

## To run locally

```bash
cd lazysheepcapital
python3 -m http.server 8080
# then open http://localhost:8080/smart_money/
```

#!/usr/bin/env python3
"""拉取美股板块 + 科技细分的当日涨跌、分时曲线、近一月曲线，写入 data/sectors.json。

页面 sectors/ 读取这个 JSON 渲染。GitHub Actions 每个交易日收盘后自动跑一次
（见 .github/workflows/sectors-daily.yml），也可以手动跑。

纯标准库，无需安装依赖。数据源：Yahoo Finance chart API。

用法（在 lazysheepcapital 目录下）：
    python3 scripts/fetch_sectors.py
"""
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "sectors.json")
HIST = os.path.join(ROOT, "data", "sectors_history.csv")

INDICES = [("SPY", "标普 500"), ("QQQ", "纳指 100"), ("IWM", "罗素 2000")]

SECTORS = [
    ("XLK", "科技"), ("XLF", "金融"), ("XLE", "能源"), ("XLV", "医疗保健"),
    ("XLI", "工业"), ("XLY", "可选消费"), ("XLP", "必需消费"), ("XLU", "公用事业"),
    ("XLB", "原材料"), ("XLRE", "房地产"), ("XLC", "通信服务"),
]

TECH_ETFS = [
    ("XLK", "科技 · 市值加权"), ("SMH", "半导体 · 市值加权"), ("SOXX", "半导体 · 更均衡"),
    ("IGV", "软件"), ("WCLD", "云软件"), ("CIBR", "网络安全"), ("FDN", "互联网"), ("BOTZ", "机器人 / AI"),
]

# 科技细分：(key, 中文名, 英文名, [(ticker, 名称), ...])
# 改分组 / 加股票只需要改这里，页面会自动适配。
TECH_GROUPS = [
    ("gpu", "GPU / AI 芯片", "AI Accelerators", [
        ("NVDA", "英伟达"), ("AVGO", "博通"), ("AMD", "AMD"), ("MRVL", "Marvell"), ("ARM", "ARM")]),
    ("memory", "存储", "Memory & Storage", [
        ("MU", "美光"), ("SNDK", "闪迪"), ("WDC", "西部数据"), ("STX", "希捷"), ("NTAP", "NetApp"), ("PSTG", "Pure Storage")]),
    ("equip", "半导体设备", "Semi Equipment", [
        ("ASML", "阿斯麦"), ("AMAT", "应用材料"), ("LRCX", "泛林"), ("KLAC", "科磊"), ("TER", "泰瑞达")]),
    ("foundry", "代工 / 模拟 / 手机芯片", "Foundry · Analog · Mobile", [
        ("TSM", "台积电"), ("INTC", "英特尔"), ("TXN", "德州仪器"), ("ADI", "亚德诺"), ("QCOM", "高通"),
        ("NXPI", "恩智浦"), ("ON", "安森美"), ("MCHP", "微芯")]),
    ("hardware", "服务器 / 硬件", "Servers & Hardware", [
        ("AAPL", "苹果"), ("DELL", "戴尔"), ("HPE", "慧与"), ("SMCI", "超微电脑")]),
    ("network", "网络 / 光通信", "Networking & Optics", [
        ("ANET", "Arista"), ("CSCO", "思科"), ("CIEN", "Ciena"), ("COHR", "Coherent"), ("LITE", "Lumentum")]),
    ("software", "软件", "Software", [
        ("MSFT", "微软"), ("ORCL", "甲骨文"), ("CRM", "Salesforce"), ("NOW", "ServiceNow"), ("ADBE", "Adobe"),
        ("PLTR", "Palantir"), ("SNOW", "Snowflake"), ("INTU", "Intuit"), ("WDAY", "Workday")]),
    ("security", "网络安全", "Cybersecurity", [
        ("CRWD", "CrowdStrike"), ("PANW", "Palo Alto"), ("ZS", "Zscaler"), ("FTNT", "Fortinet"), ("NET", "Cloudflare")]),
    ("internet", "互联网平台", "Internet Platforms", [
        ("GOOGL", "谷歌"), ("META", "Meta"), ("AMZN", "亚马逊"), ("NFLX", "奈飞")]),
    ("services", "IT 服务", "IT Services", [("IBM", "IBM"), ("ACN", "埃森哲")]),
]

UA = {"User-Agent": "Mozilla/5.0"}


def _get(sym, rng, interval, tries=3):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range={rng}&interval={interval}"
    err = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=15) as r:
                return json.load(r)["chart"]["result"][0]
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(1 + i)
    print(f"  ⚠️  {sym} {rng}: {err}", file=sys.stderr)
    return None


def fetch(sym):
    """返回 {price, prev, chg, time, intraday:[[t,%]...], month:[[date,%]...]}；失败返回 None。"""
    day = _get(sym, "1d", "5m")
    if not day:
        return None
    m = day["meta"]
    prev = m.get("chartPreviousClose") or m.get("previousClose")
    closes = day["indicators"]["quote"][0].get("close") or []
    last = [c for c in closes if c is not None]
    price = m.get("regularMarketPrice") or (last[-1] if last else None)
    if not price or not prev:
        print(f"  ⚠️  {sym}: 无报价 (meta keys: {sorted(m)[:8]}…)", file=sys.stderr)
        return None
    intraday = [[t, round((c / prev - 1) * 100, 2)]
                for t, c in zip(day.get("timestamp") or [], closes) if c is not None]

    month = []
    mo = _get(sym, "1mo", "1d")
    if mo:
        pts = [(t, c) for t, c in zip(mo.get("timestamp") or [], mo["indicators"]["quote"][0]["close"]) if c]
        if pts:
            base = pts[0][1]
            month = [[datetime.fromtimestamp(t, timezone(timedelta(hours=-5))).strftime("%Y-%m-%d"),
                      round((c / base - 1) * 100, 2)] for t, c in pts]
    return {"price": round(price, 2), "prev": round(prev, 2),
            "chg": round((price / prev - 1) * 100, 2), "time": m.get("regularMarketTime") or (day.get("timestamp") or [0])[-1],
            "intraday": intraday, "month": month}


def avg_curve(curves):
    """多条 [[x, y], ...] 按 x 对齐做等权平均（缺失点向前填充）。"""
    curves = [c for c in curves if c]
    if not curves:
        return []
    xs = sorted({x for c in curves for x, _ in c})
    maps = [dict(c) for c in curves]
    last = [None] * len(curves)
    out = []
    for x in xs:
        vals = []
        for i, mp in enumerate(maps):
            if x in mp:
                last[i] = mp[x]
            if last[i] is not None:
                vals.append(last[i])
        out.append([x, round(sum(vals) / len(vals), 3)])
    return out


def main():
    syms = sorted({s for s, _ in INDICES + SECTORS + TECH_ETFS}
                  | {s for g in TECH_GROUPS for s, _ in g[3]})
    with ThreadPoolExecutor(8) as ex:
        q = dict(zip(syms, ex.map(fetch, syms)))

    def rows(pairs):
        return [{"sym": s, "name": n, **q[s]} for s, n in pairs if q.get(s)]

    groups = []
    for key, zh, en, items in TECH_GROUPS:
        stocks = sorted(rows(items), key=lambda r: -r["chg"])
        if not stocks:
            continue
        up = sum(r["chg"] > 0 for r in stocks)
        groups.append({
            "key": key, "name": zh, "en": en,
            "avg": round(sum(r["chg"] for r in stocks) / len(stocks), 2),
            "up": up, "down": len(stocks) - up, "stocks": stocks,
            "intraday": avg_curve([r["intraday"] for r in stocks]),
            "month": avg_curve([r["month"] for r in stocks]),
        })
    groups.sort(key=lambda g: -g["avg"])

    asof = max(v["time"] for v in q.values() if v)
    et = timezone(timedelta(hours=-4 if _is_edt(asof) else -5))
    asof_dt = datetime.fromtimestamp(asof, et)
    missing = [s for s, v in q.items() if not v]
    out = {
        "asof": asof,
        "asof_et": asof_dt.strftime("%Y-%m-%d %H:%M") + " ET",
        "date": asof_dt.strftime("%Y-%m-%d"),
        "closed": asof_dt.hour >= 16,
        "generated": int(time.time()),
        "indices": rows(INDICES),
        "sectors": sorted(rows(SECTORS), key=lambda r: -r["chg"]),
        "tech_etfs": rows(TECH_ETFS),
        "tech_groups": groups,
        "missing": missing,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    _append_history(out)
    print(f"✅ {os.path.relpath(OUT, ROOT)}  截至 {out['asof_et']}  ({len(q) - len(missing)}/{len(q)} 只)")
    if missing:
        print("   缺失:", ", ".join(missing))


def _is_edt(ts):
    """美东夏令时：3 月第二个周日 ~ 11 月第一个周日。"""
    d = datetime.fromtimestamp(ts, timezone.utc)
    def nth_sunday(month, n):
        first = datetime(d.year, month, 1, tzinfo=timezone.utc)
        return first + timedelta(days=(6 - first.weekday()) % 7 + 7 * (n - 1))
    return nth_sunday(3, 2) + timedelta(hours=7) <= d < nth_sunday(11, 1) + timedelta(hours=6)


def _append_history(out):
    """每天一行：日期 + 各板块 / 细分的涨跌，方便以后做长期统计。同一天重复跑会覆盖那一行。"""
    cols = [s for s, _ in SECTORS] + [g[0] for g in TECH_GROUPS]
    vals = {r["sym"]: r["chg"] for r in out["sectors"]}
    vals.update({g["key"]: g["avg"] for g in out["tech_groups"]})
    lines = []
    if os.path.exists(HIST):
        with open(HIST, encoding="utf-8") as f:
            lines = [l for l in f.read().splitlines()[1:] if l and not l.startswith(out["date"])]
    lines.append(",".join([out["date"]] + [str(vals.get(c, "")) for c in cols]))
    with open(HIST, "w", encoding="utf-8") as f:
        f.write(",".join(["date"] + cols) + "\n" + "\n".join(sorted(lines)) + "\n")


if __name__ == "__main__":
    main()

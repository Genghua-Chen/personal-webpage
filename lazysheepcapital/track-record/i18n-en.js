/* English dictionary for track-record/ — per-trade thesis/lesson English lives in the TRADES data (thesis_en / lesson_en) */
I18N.html({
  '实盘记录 <span class="grad">Track Record</span>': 'Live <span class="grad">Track Record</span>',
  '每一笔下注都公开。赢要赢得明白，输要输得服气。<a class="pr-link" href="../#principle-06">祖训第 6 条</a>：相信自己的投资原则。':
    'Every bet is public. Know why you won; own it when you lose. <a class="pr-link" href="../#principle-06">Principle 6</a>: trust your own investment principles.'
});
I18N.add({
  "实盘记录 — LazySheepcapital": "Track Record — LazySheepcapital",
  "净值曲线": "Equity Curve",
  "已平仓累计收益（按仓位加权）": "Cumulative return on closed trades (position-weighted)",
  "当前持仓": "Open Positions", "已平仓": "Closed Trades",
  "标的": "Ticker", "方向": "Side", "仓位": "Size", "开仓日": "Opened",
  "成本价": "Entry", "现价": "Last", "浮动盈亏": "Unrealized P&L", "下注逻辑": "Thesis",
  "持有区间": "Holding period", "进出价": "Entry → Exit", "盈亏": "P&L", "复盘": "Post-mortem",
  "以上为个人实盘记录 · 不构成任何投资建议 · 赌狗自负盈亏 🐑": "Personal live-trading record · Not investment advice · Degens bear their own losses 🐑",
  "累计收益（已平仓）": "Total return (closed)", "胜率": "Win rate", "已平仓笔数": "Closed trades",
  "最佳 / 最差单笔": "Best / worst trade", "当前现金": "Cash",
  "做多 ▲": "Long ▲", "做空 ▼": "Short ▼",
  "空仓中 · 耐心等待（祖训 09）": "All cash · waiting patiently (principle 09)",
  "起点": "Start",
  "每个节点 = 一笔平仓 · 悬停查看明细": "Each point = one closed trade · hover for details"
});
I18N.patterns([
  [/^(\d+) 笔 · 仓位 (\d+(?:\.\d+)?)%$/, function (m, n, p) { return n + (n === "1" ? " trade" : " trades") + " · " + p + "% invested"; }],
  [/^(\d+) 笔$/, function (m, n) { return n + (n === "1" ? " trade" : " trades"); }],
  [/^(\S+) (\d{4}-\d\d-\d\d) · 累计 (.+)$/, function (m, l, d, v) { return I18N.tr(l) + " " + d + " · cumulative " + v; }]
]);

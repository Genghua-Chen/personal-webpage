/* English dictionary for sectors/ — sector/stock names from data/sectors.json live in ../i18n.js */
I18N.add({
  "板块涨跌 — LazySheepcapital": "Sector Moves — LazySheepcapital",
  "加载中…": "Loading…",
  "数据加载失败，请稍后再试。": "Couldn't load data. Please try again later.",
  "回到最新": "Back to latest",
  "‹ 前一天": "‹ Prev day", "后一天 ›": "Next day ›",
  "历史回放": "Replay", "收盘数据": "Closing data", "盘中快照": "Intraday snapshot",
  "每个交易日收盘后自动更新": "updated automatically after every trading-day close",
  "今日板块涨跌": "Today's Sector Moves",
  "科技板块": "Tech Sector",
  "11 大板块": "11 Sectors",
  "当日分时": "Intraday", "今日分时": "Today", "近一月": "1 Month",
  "科技细分热力图": "Tech Sub-sector Heatmap",
  "Tech Sub-sectors · 等权平均": "Equal-weighted",
  "点击方块跳到成分股": "Click a tile to jump to its stocks",
  "细分走势对比": "Sub-sector Comparison",
  "悬停图例高亮 · 点击开关": "Hover legend to highlight · click to toggle",
  "科技股涨跌榜": "Tech Leaders & Laggards",
  "领涨": "Top gainers", "领跌": "Top losers",
  "成分股明细": "Constituents",
  "科技细分 ETF": "Tech Sub-sector ETFs"
});
I18N.patterns([
  [/^没有 (.+) 的存档。$/, function (m, d) { return "No archive for " + d + "."; }],
  [/^(\d\d\/\d\d) 板块涨跌$/, function (m, d) { return "Sector Moves · " + d; }],
  [/^(\d+) 涨 · (\d+) 跌$/, function (m, u, d) { return u + " up · " + d + " down"; }],
  [/^(\d+) 只龙头$/, function (m, n) { return n + " leaders"; }],
  [/^(收盘数据|盘中快照|历史回放) · (.+?)( · 每个交易日收盘后自动更新)?$/, function (m, a, t, u) {
    return I18N.tr(a) + " · " + t + (u ? " · updated after every trading-day close" : "");
  }],
  [/^(\d{4}-\d\d-\d\d) 周([日一二三四五六])( · 最新)?$/, function (m, d, w, l) {
    return d + " " + { 日: "Sun", 一: "Mon", 二: "Tue", 三: "Wed", 四: "Thu", 五: "Fri", 六: "Sat" }[w] + (l ? " · latest" : "");
  }]
]);

/* English dictionary for lazysheepcapital/calendar/index.html (zh source stays verbatim in the HTML/JS) */
(function () {
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTH_ZH = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  var MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = { "日": "Sun", "一": "Mon", "二": "Tue", "三": "Wed", "四": "Thu", "五": "Fri", "六": "Sat" };
  var mon = function (n) { return MON[Number(n) - 1] || n; };
  /* "2026/11/11 周三" → "Wed, Nov 11, 2026" */
  var dispDate = function (y, m, d, w) { return WD[w] + ", " + mon(m) + " " + d + ", " + y; };

  /* earnings notes from data/earnings_dates.csv: translate segment by segment so
     "Q1 FY2027 — 6月季度；AI芯片授权持续扩张" works without one entry per row */
  function trNote(s) {
    return s.split(/( — |；|;| · )/).map(function (seg) {
      if (seg === "；") return "; ";
      return I18N.tr(seg);
    }).join("");
  }

  I18N.add({
    "财报日 · FOMC 会议 · 13F 申报截止 · 经济数据 · 2025–2027":
      "Earnings · FOMC meetings · 13F deadlines · Economic data · 2025–2027",

    /* nav buttons, weekday header, sidebar */
    "今天": "Today",
    "日": "Sun", "一": "Mon", "二": "Tue", "三": "Wed", "四": "Thu", "五": "Fri", "六": "Sat",
    "近期事件": "Upcoming Events",
    "暂无符合条件的事件。": "No matching events.",
    "▲ 盘前": "▲ Pre-market", "▼ 盘后": "▼ After-hours",

    /* legend */
    "财报": "Earnings", "13F 截止": "13F Deadlines", "经济数据": "Economic Data", "分红除息": "Ex-Dividend",

    /* filter chips */
    "FOMC 会议": "FOMC Meetings", "股息除息": "Ex-Dividend", "NYSE 休市": "NYSE Holidays",
    "⚡ 期权到期 OPEX": "⚡ Options Expiry (OPEX)", "📊 机构调仓": "📊 Rebalancing", "🤖 CTA调仓": "🤖 CTA Rebalancing",
    "点击筛选类型": "Click to filter by type",

    /* type badges */
    "股息": "Dividend", "NYSE休市": "NYSE Closed", "期权到期": "Options Expiry",
    "机构调仓": "Rebalancing", "CTA调仓": "CTA Rebal",

    /* OPEX */
    "📅 月度 OPEX": "📅 Monthly OPEX",
    "月度期权到期日 — 标普500/个股期权结算，波动性提升":
      "Monthly options expiration — S&P 500 / single-stock options settle; volatility tends to rise",
    "月度期权到期日 — 标普500/个股期权结算":
      "Monthly options expiration — S&P 500 / single-stock options settle",
    "月度期权到期日（4月18日耶稣受难日休市，提前至4月17日）":
      "Monthly options expiration (moved up to Apr 17; market closed Apr 18 for Good Friday)",
    "⚡ 三重到期 Triple Witching": "⚡ Triple Witching",
    "Q2 三重到期（提前至6月18日，6月19日六月节休市）— 股指期货+股指期权+个股期权同时结算":
      "Q2 triple witching (moved up to Jun 18; market closed Jun 19 for Juneteenth) — index futures + index options + stock options all settle",

    /* rebalancing */
    "📊 月末调仓": "📊 Month-End Rebalance",
    "月末最后交易日 — 养老金/保险/平衡基金回归目标配比，尾盘资金流动明显":
      "Last trading day of the month — pensions, insurers and balanced funds rebalance to target weights; heavy flows into the close",
    "月末最后交易日 — 养老金/保险/平衡基金回归目标配比":
      "Last trading day of the month — pensions, insurers and balanced funds rebalance to target weights",
    "📊 月末调仓 + MSCI季度调整": "📊 Month-End + MSCI Quarterly Review",
    "MSCI季度再平衡生效（收盘后）+ 月末养老金调仓":
      "MSCI quarterly rebalance takes effect (after the close) + month-end pension rebalancing",
    "MSCI季度再平衡生效（收盘后）+ 月末养老金调仓（感恩节次日，成交量偏低）":
      "MSCI quarterly rebalance takes effect (after the close) + month-end pension rebalancing (day after Thanksgiving, light volume)",
    "📊 季末调仓 Q1": "📊 Quarter-End Rebalance Q1",
    "📊 季末调仓 Q2": "📊 Quarter-End Rebalance Q2",
    "📊 季末调仓 Q3": "📊 Quarter-End Rebalance Q3",
    "📊 季末调仓 Q4 / 年末": "📊 Q4 / Year-End Rebalance",
    "Q1季末 — 最大规模调仓窗口：养老金+主权基金+共同基金回归目标配比，尾盘数百亿资金流动":
      "Q1 quarter-end — the biggest rebalancing window: pensions, sovereign wealth funds and mutual funds return to target weights, with tens of billions moving into the close",
    "Q4/年末最大调仓 — 养老金+主权基金年度再平衡，税损收割结束，新资金入市":
      "Q4 / year-end, the largest rebalance — annual pension and sovereign-fund rebalancing, tax-loss harvesting ends, new money comes in",
    "📋 罗素初步名单 Rank Day": "📋 Russell Rank Day",
    "Russell 2000/1000/3000 年度重组：初步纳入/剔除名单公布，小盘股波动显著":
      "Russell 2000/1000/3000 annual reconstitution: preliminary add/delete lists published; notable small-cap volatility",
    "🔄 罗素年度重组 Russell Recon": "🔄 Russell Reconstitution",
    "Russell指数年度重组生效（收盘后）— ~$10万亿被动资产跟踪，全年最大单日指数调仓事件":
      "Russell annual reconstitution takes effect (after the close) — ~$10T in passive assets track it; the year's largest single-day index rebalance",

    /* CTA */
    "月度CTA信号更新 — 趋势跟踪基金重新计算持仓比例，执行月度再平衡（约$3500亿CTA敞口调整）":
      "Monthly CTA signal update — trend followers recompute position sizes and rebalance (≈$350B of CTA exposure adjusted)",
    "月度CTA信号更新 — 趋势跟踪基金重新计算持仓比例，执行月度再平衡":
      "Monthly CTA signal update — trend followers recompute position sizes and rebalance",
    "月度CTA信号更新 — Q1季初，趋势信号重置，方向性资金流入明显":
      "Monthly CTA signal update — start of Q1, trend signals reset, strong directional inflows",
    "月度CTA信号更新 — Q2季初，养老金再平衡叠加CTA调仓，资金流放大":
      "Monthly CTA signal update — start of Q2, pension rebalancing stacks on CTA flows, amplifying them",
    "月度CTA信号更新 — 趋势跟踪基金执行再平衡":
      "Monthly CTA signal update — trend-following funds rebalance",
    "月度CTA信号更新 — Q2末前，趋势信号调整，三重到期前资金预布局":
      "Monthly CTA signal update — ahead of Q2-end, trend signals adjust, positioning ahead of triple witching",
    "月度CTA信号更新 — Q3季初，趋势跟踪基金重新建仓":
      "Monthly CTA signal update — start of Q3, trend followers rebuild positions",
    "月度CTA信号更新 — 夏季低流动性窗口，CTA调仓冲击更大":
      "Monthly CTA signal update — thin summer liquidity, so CTA flows hit harder",
    "月度CTA信号更新 — Q3末前，三重到期在即，CTA+机构同向调仓":
      "Monthly CTA signal update — ahead of Q3-end with triple witching near, CTAs and institutions rebalance the same way",
    "月度CTA信号更新 — Q4季初，全年收益博弈阶段，趋势信号敏感":
      "Monthly CTA signal update — start of Q4, the race for full-year performance; trend signals are sensitive",
    "月度CTA信号更新 — 美联储会议后首个交易周，CTA与宏观信号叠加":
      "Monthly CTA signal update — first trading week after the Fed meeting; CTA and macro signals compound",
    "月度CTA信号更新 — 年末税损收割 + CTA调仓 + 流动性下降，波动率抬升":
      "Monthly CTA signal update — year-end tax-loss harvesting + CTA flows + thinning liquidity; volatility rises",
    "月度CTA信号更新 — 新年首个交易日，年度趋势信号重置，资金方向性强":
      "Monthly CTA signal update — first trading day of the year, annual trend signals reset, strongly directional flows",
    "月度CTA信号更新 — Q1季初，趋势信号重置":
      "Monthly CTA signal update — start of Q1, trend signals reset",
    "月度CTA信号更新 — Q2季初，养老金再平衡叠加CTA调仓":
      "Monthly CTA signal update — start of Q2, pension rebalancing stacks on CTA flows",
    "月度CTA信号更新 — 罗素Rank Day前，小盘股敞口调整":
      "Monthly CTA signal update — ahead of Russell Rank Day, small-cap exposure adjusts",
    "月度CTA信号更新 — 罗素重组前最后调仓，三重到期(6/18)前预布局":
      "Monthly CTA signal update — last rebalance before the Russell recon, positioning ahead of triple witching (6/18)",
    "月度CTA信号更新 — 夏季低流动性，CTA调仓冲击放大":
      "Monthly CTA signal update — thin summer liquidity amplifies CTA flows",
    "月度CTA信号更新 — Q3末前，三重到期(9/18)在即，CTA+机构同向调仓":
      "Monthly CTA signal update — ahead of Q3-end with triple witching (9/18) near, CTAs and institutions rebalance the same way",
    "月度CTA信号更新 — Q4季初，全年收益博弈，趋势信号敏感":
      "Monthly CTA signal update — start of Q4, the race for full-year performance; trend signals are sensitive",
    "月度CTA信号更新 — 年末税损收割 + CTA调仓 + 流动性下降，波动放大":
      "Monthly CTA signal update — year-end tax-loss harvesting + CTA flows + thinning liquidity; volatility widens",

    /* NYSE holidays */
    "🏛 元旦 · NYSE休市": "🏛 New Year's Day · NYSE closed",
    "🏛 马丁路德金日 · NYSE休市": "🏛 MLK Day · NYSE closed",
    "🏛 总统日 · NYSE休市": "🏛 Presidents' Day · NYSE closed",
    "🏛 耶稣受难日 · NYSE休市": "🏛 Good Friday · NYSE closed",
    "🏛 阵亡将士纪念日 · NYSE休市": "🏛 Memorial Day · NYSE closed",
    "🏛 六月节 · NYSE休市": "🏛 Juneteenth · NYSE closed",
    "🏛 独立日 · NYSE休市": "🏛 Independence Day · NYSE closed",
    "🏛 独立日 (观察日) · NYSE休市": "🏛 Independence Day (observed) · NYSE closed",
    "🏛 劳动节 · NYSE休市": "🏛 Labor Day · NYSE closed",
    "🏛 感恩节 · NYSE休市": "🏛 Thanksgiving · NYSE closed",
    "🏛 圣诞节 · NYSE休市": "🏛 Christmas · NYSE closed",

    /* FOMC */
    "FOMC 决议日": "FOMC Decision Day",
    "利率决议·鲍威尔新闻发布会": "Rate decision · Powell press conference",
    "联邦基金利率公布": "Fed funds rate announced",
    "利率决议·SEP 点阵图": "Rate decision · SEP dot plot",
    "利率决议": "Rate decision",

    /* economic data */
    "非农就业": "Nonfarm Payrolls",
    "PCE 核心通胀": "Core PCE Inflation",

    /* dividends */
    "摩根大通": "JPMorgan Chase",

    /* earnings notes — segments (see trNote) */
    "日历季度": "calendar quarter",
    "视觉SoC": "vision SoCs", "仓储自动化": "warehouse automation", "伺服执行器": "servo actuators",
    "工厂自动化": "factory automation", "连接器/传感器": "connectors/sensors",
    "磷化铟需求强劲": "strong indium phosphide demand",
    "AI数据中心光互连材料": "optical interconnect materials for AI data centers",
    "营收$15.9B 超预期": "revenue $15.9B, beat estimates",
    "混合云+AI Watson加速": "hybrid cloud + AI (Watson) accelerating",
    "营收$151M +51% YoY 第四连续季度纪录": "revenue $151M +51% YoY, 4th straight record quarter",
    "数据中心需求驱动": "driven by data-center demand",
    "EUV订单关键": "EUV orders are key", "EUV 订单": "EUV orders",
    "散热backlog": "thermal backlog", "散热需求": "thermal demand",
    "数据中心REIT": "data-center REIT", "核电PPA": "nuclear PPAs",
    "AI芯片授权持续扩张": "AI chip licensing keeps expanding",
    "NAND周期峰值观察": "watch for the NAND cycle peak",
    "AI Agent收入加速": "AI agent revenue accelerating",
    "营收 +27.6% YoY": "revenue +27.6% YoY",
    "数据中心占比76%": "data center 76% of revenue",
    "营收$43.8B +88% YoY 创纪录": "record revenue $43.8B +88% YoY",
    "AI服务器$16.1B +757%": "AI servers $16.1B +757%",
    "营收$44B +69% YoY": "revenue $44B +69% YoY",
    "数据中心$39.1B 创纪录": "record data center $39.1B",
    "4D激光雷达": "4D lidar", "激光雷达": "lidar",
    "仓储机器人": "warehouse robots", "配送机器人": "delivery robots", "手术机器人": "surgical robots",
    "半导体制程设备（MOCVD/离子束/激光退火）": "semiconductor process equipment (MOCVD / ion beam / laser annealing)",
    "半导体制程设备": "semiconductor process equipment",
    "协作机器人UR/MiR": "cobots (UR/MiR)",
    "工业机器人(拟售软银)": "industrial robots (pending sale to SoftBank)",
    "无框电机/运动控制": "frameless motors / motion control",
    "机器视觉": "machine vision", "电机/传动": "motors / power transmission", "稀土磁材": "rare-earth magnets",
    "磷化铟历史最高季度预期": "record indium phosphide quarter expected",
    "营收指引 $180-198M": "revenue guidance $180–198M",
    "含AI ASIC收入": "incl. AI ASIC revenue",
    "营收$3.03B +31% QoQ": "revenue $3.03B +31% QoQ",
    "独立上市后首季强劲": "strong first quarter since the spin-off",
    "云增长": "cloud growth", "800G受益": "800G tailwind", "AI服务器": "AI servers",
    "HBM需求": "HBM demand",
    "营收$5.95B +97% QoQ": "revenue $5.95B +97% QoQ",
    "NAND需求超强": "very strong NAND demand",
    "营收创纪录": "record revenue",
    "授权费+版税创纪录": "record licensing + royalty revenue"
  });

  I18N.patterns([
    /* calendar header "2026年 十一月" */
    [/^(\d{4})年 (.+月)$/, function (m, y, mo) {
      var i = MONTH_ZH.indexOf(mo);
      return i < 0 ? m : MONTH_EN[i] + " " + y;
    }],
    /* sidebar head / list dates */
    [/^(\d{4})\/(\d{1,2})\/(\d{1,2}) 周(.) 的事件$/, function (m, y, mo, d, w) { return "Events · " + dispDate(y, mo, d, w); }],
    [/^(\d{4})\/(\d{1,2})\/(\d{1,2}) 周(.)$/, function (m, y, mo, d, w) { return dispDate(y, mo, d, w); }],

    /* earnings: sidebar title "NVDA 财报 ✓" → "NVDA Earnings ✓"; the grid pill carries a
       ▲/▼ timing prefix and is only ~100px wide, so there "▲ NVDA 财报" → "▲ NVDA"
       (pill colour already marks it as earnings; the title tooltip keeps the full label) */
    [/^([▲▼] )?(\S+) 财报(.*)$/, function (m, pre, tk, rest) { return pre ? pre + tk + rest : tk + " Earnings" + rest; }],
    /* earnings desc: "<company> <fiscal_quarter> · <notes>" */
    [/^(.+? (?:F?Q\d) (?:FY)?\d{4}) · (.+)$/, function (m, head, note) { return head + " · " + trNote(note); }],
    /* note segments */
    [/^(\d{1,2})月季度$/, function (m, n) { return mon(n) + " quarter"; }],
    [/^(.+?) ?日历季度$/, function (m, q) { return q + " calendar quarter"; }],

    /* OPEX */
    [/^(Q\d) 三重到期：股指期货 \+ 股指期权 \+ 个股期权同时结算，成交量暴增$/,
      "$1 triple witching: index futures + index options + stock options all settle; volume surges"],
    /* rebalancing */
    [/^(Q\d)季末 — 最大规模调仓窗口：养老金\+主权基金\+共同基金回归目标配比$/,
      "$1 quarter-end — the biggest rebalancing window: pensions, sovereign wealth funds and mutual funds return to target weights"],
    /* CTA */
    [/^🤖 CTA月初调仓 (\d{1,2})月$/, function (m, n) { return "🤖 CTA Rebalance · " + mon(n); }],
    /* holidays desc */
    [/^(.+) — 股市休市$/, "$1 — market closed"],
    /* FOMC */
    [/^FOMC 会议 \((\d{1,2})月\)$/, function (m, n) { return "FOMC Meeting (" + mon(n) + ")"; }],
    /* 13F */
    [/^13F 截止 — (.+)$/, "13F Deadline — $1"],
    [/^机构持仓申报截止（(\d{1,2})月(\d{1,2})日快照）$/, function (m, mo, d) {
      return "Institutional holdings filing deadline (" + mon(mo) + " " + d + " snapshot)";
    }],
    /* economic data */
    [/^GDP (Q\d \d{4}) 初值$/, "GDP $1 Advance"],
    [/^美国(Q\d \d{4}) GDP初步估算$/, "US $1 GDP advance estimate"],
    [/^(\d{4})年(\d{1,2})月非农就业人数$/, function (m, y, mo) { return mon(mo) + " " + y + " nonfarm payrolls"; }],
    [/^(\d{4})年(\d{1,2})月通胀数据$/, function (m, y, mo) { return mon(mo) + " " + y + " inflation data"; }],
    [/^08:30 ET · (\d{4})年(\d{1,2})月通胀 · 美联储偏好指标$/, function (m, y, mo) {
      return "08:30 ET · " + mon(mo) + " " + y + " inflation · the Fed's preferred gauge";
    }],
    /* dividends */
    [/^(\S+) 除息$/, "$1 Ex-Dividend"],
    [/^(\S+) ((?:Q\d) (?:FY)?\d{4}) 股息$/, function (m, co, q) { return I18N.tr(co) + " " + q + " dividend"; }]
  ]);
})();

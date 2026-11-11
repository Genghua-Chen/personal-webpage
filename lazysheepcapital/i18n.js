/* LazySheepcapital i18n — English by default, 中文 on toggle.
 *
 * The HTML/JS source stays in Chinese (the zh version). In EN mode this script
 * walks the DOM and swaps every Chinese text node / attribute for its English
 * entry from a zh→en dictionary, and keeps doing so for anything JS renders
 * later (MutationObserver). Switching back to 中文 restores the originals.
 *
 * Usage, in <head>:
 *   <script src="../i18n.js"></script>          (sync, before any CSS paint)
 *   <script src="i18n-en.js"></script>          (per-page dictionary, optional)
 *
 * Dictionary API (per-page files):
 *   I18N.add({ "中文原文": "English", ... })      exact match on trimmed, whitespace-collapsed text
 *   I18N.patterns([[/^共 (\d+) 只$/, (m, n) => n + " stocks"], ...])
 *                                                regex fallbacks for interpolated strings;
 *                                                use I18N.tr(x) inside to translate captures
 *   I18N.html({ "<b>原文</b>…": "<b>English</b>…" })
 *                                                for elements marked data-i18n-html: key is the
 *                                                element's whitespace-collapsed innerHTML
 *   I18N.attrs.push("data-tip")                  extra attributes to translate
 *   <x data-lang="en">…</x><x data-lang="zh">…</x>   render both, CSS shows the active one
 *                                                (for sentences assembled from live data)
 *
 * Runtime API for page JS:
 *   I18N.lang            "en" | "zh"
 *   I18N.t(zh)           translated string for the current language
 *   I18N.set("zh")       switch language (persists in localStorage)
 *   window "i18n:change" event fires after a switch (detail = lang)
 *   I18N.leftovers()     debug: Chinese text still visible in EN mode
 */
(function () {
  var KEY = "lsc-lang";
  var CJK = /[　-〿㐀-鿿＀-￯]/;
  var lang;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (lang !== "zh") lang = "en";

  var root = document.documentElement;
  root.lang = lang === "en" ? "en" : "zh-CN";

  var dict = Object.create(null);
  var htmlDict = Object.create(null);
  var pats = [];
  var attrs = ["title", "placeholder", "aria-label", "alt", "value", "data-label", "data-tip"];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1 };

  /* shorter labels for the top nav only, so 9–10 English links fit on one row */
  var NAV = { "聪明钱追踪": "Smart Money", "板块涨跌": "Sectors", "AI 流向图": "AI Flow", "太空板块": "Space",
    "物理AI": "Physical AI", "财报日历": "Earnings", "蜡烛图": "Candlesticks", "割肉自查": "Cut-Loss", "实盘记录": "Track Record", "实验室": "Lab" };
  function navLabel(node, src) {
    var p = node.parentNode;
    return p && p.classList && (p.classList.contains("sn-link") || p.classList.contains("nav-link")) ? NAV[src.trim()] : null;
  }
  var norm = function (s) { return String(s).replace(/\s+/g, " ").trim(); };

  function trCore(core) {
    var hit = dict[core];
    if (hit !== undefined) return hit;
    /* "🚀 太空板块" / "★ 新建仓" / "收盘 ›": retry without a leading/trailing symbol run */
    var sm = core.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N})）」】]*)$/u);
    if (sm && (sm[1] || sm[3]) && sm[2] && dict[sm[2]] !== undefined) return sm[1] + dict[sm[2]] + sm[3];
    for (var i = 0; i < pats.length; i++) {
      var m = core.match(pats[i][0]);
      if (m) {
        var r = pats[i][1];
        return typeof r === "function" ? r.apply(null, m) : core.replace(pats[i][0], r);
      }
    }
    return null;
  }
  /* zh → en, preserving surrounding whitespace; returns input if unknown */
  function tr(s) {
    if (s == null) return s;
    s = String(s);
    if (!CJK.test(s)) return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    var out = trCore(norm(s));
    return out == null ? s : lead + out + trail;
  }

  /* ── DOM swapping ── */
  var origText = new WeakMap(), wroteText = new WeakMap();
  var origAttr = new WeakMap(), origHtml = new WeakMap();

  function doText(node) {
    var src;
    if (origText.has(node) && wroteText.get(node) === node.data) src = origText.get(node);
    else { src = node.data; if (!CJK.test(src) && !origText.has(node)) return; origText.set(node, src); }
    var out = lang === "en" ? (navLabel(node, src) || tr(src)) : src;
    if (out !== node.data) node.data = out;
    wroteText.set(node, out);
  }
  function doAttrs(el) {
    var store = origAttr.get(el);
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (!el.hasAttribute(a)) continue;
      var cur = el.getAttribute(a), rec = store && store[a], src;
      if (rec && rec.w === cur) src = rec.o;
      else { if (!CJK.test(cur)) continue; src = cur; }
      var out = lang === "en" ? tr(src) : src;
      if (!store) { store = {}; origAttr.set(el, store); }
      store[a] = { o: src, w: out };
      if (out !== cur) el.setAttribute(a, out);
    }
  }
  function doHtml(el) {
    var rec = origHtml.get(el), cur = el.innerHTML, src;
    if (rec && rec.w === cur) src = rec.o; else src = cur;
    var hit = htmlDict[norm(src)];
    var out = lang === "en" && hit !== undefined ? hit : src;
    origHtml.set(el, { o: src, w: out });
    if (out !== cur) el.innerHTML = out;
    origHtml.get(el).w = el.innerHTML;
  }
  function walk(node) {
    if (node.nodeType === 3) { var p = node.parentNode; if (!p || !SKIP[p.nodeName]) doText(node); return; }
    if (node.nodeType !== 1 || SKIP[node.nodeName]) return;
    if (node.id === "i18n-toggle" || node.hasAttribute("data-lang")) return;
    doAttrs(node);
    if (node.hasAttribute("data-i18n-html")) { doHtml(node); return; }
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  var observer = null, busy = false;
  function onMut(list) {
    if (busy) return;
    busy = true;
    observer.disconnect();
    try {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === "childList") for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
        else if (m.type === "characterData") walk(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
      }
    } finally { observe(); busy = false; }
  }
  function observe() {
    if (!window.MutationObserver) return;
    observer = observer || new MutationObserver(onMut);
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attrs });
  }
  function apply() {
    if (observer) observer.disconnect();
    walk(root);
    observe();
    syncToggle();
  }

  /* ── toggle (EN / 中) ── */
  var css =
    "html.i18n-pending body{visibility:hidden}" +
    /* bilingual blocks rendered side by side: <span data-lang="en">…</span><span data-lang="zh">…</span> */
    "html[lang=en] [data-lang=zh],html:not([lang=en]) [data-lang=en]{display:none!important}" +
    "#i18n-toggle{display:inline-flex;align-items:center;flex:none;margin-left:6px;padding:2px;border-radius:999px;" +
    "border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);cursor:pointer;font:600 .72rem/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}" +
    "#i18n-toggle span{padding:4px 8px;border-radius:999px;color:rgba(200,200,230,.5);transition:all .15s;}" +
    "#i18n-toggle span.on{background:rgba(255,255,255,.12);color:#e8e8f0;}" +
    "#i18n-toggle:hover{border-color:rgba(255,255,255,.22);}" +
    ".nav #i18n-toggle{margin-left:10px;}" +
    ".nav .nav-link{white-space:nowrap;}" +
    "@media(max-width:1180px){html[lang=en] .nav .nav-link{padding:6px 8px;}html[lang=en] .site-nav .sn-link{padding:5px 8px;}}" +
    ".nav .nav-links{margin-left:auto;}";
  var st = document.createElement("style");
  st.textContent = css;
  (document.head || root).appendChild(st);
  if (lang === "en") root.classList.add("i18n-pending");

  function syncToggle() {
    var b = document.getElementById("i18n-toggle");
    if (!b) return;
    b.children[0].className = lang === "en" ? "on" : "";
    b.children[1].className = lang === "zh" ? "on" : "";
    b.title = lang === "en" ? "切换到中文" : "Switch to English";
    b.setAttribute("aria-label", b.title);
  }
  function mountToggle() {
    if (document.getElementById("i18n-toggle")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.id = "i18n-toggle";
    b.innerHTML = '<span lang="en">EN</span><span lang="zh-CN">中</span>';
    b.addEventListener("click", function () { I18N.set(lang === "en" ? "zh" : "en"); });
    var sn = document.querySelector(".site-nav .sn-links");
    var nav = document.querySelector("nav.nav");
    if (sn) sn.appendChild(b);
    else if (nav) nav.appendChild(b);
    else { b.style.cssText = "position:fixed;top:12px;right:12px;z-index:9999"; document.body.appendChild(b); }
  }

  function init() {
    mountToggle();
    try { apply(); } finally { root.classList.remove("i18n-pending"); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  /* never leave the page hidden if something throws */
  setTimeout(function () { root.classList.remove("i18n-pending"); }, 1500);

  var I18N = window.I18N = {
    attrs: attrs,
    get lang() { return lang; },
    add: function (o) { for (var k in o) dict[norm(k)] = o[k]; return I18N; },
    html: function (o) { for (var k in o) htmlDict[norm(k)] = o[k]; return I18N; },
    patterns: function (list) { pats.push.apply(pats, list); return I18N; },
    tr: tr,
    t: function (s) { return lang === "en" ? tr(s) : s; },
    set: function (l) {
      l = l === "zh" ? "zh" : "en";
      if (l === lang) return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      root.lang = l === "en" ? "en" : "zh-CN";
      apply();
      window.dispatchEvent(new CustomEvent("i18n:change", { detail: l }));
    },
    retranslate: apply,
    leftovers: function () {
      if (observer) { var pend = observer.takeRecords(); if (pend.length) onMut(pend); }
      var out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        var n = w.currentNode, p = n.parentNode;
        if (SKIP[p.nodeName] || !CJK.test(n.data)) continue;
        if (p.closest && p.closest("#i18n-toggle,[data-lang]")) continue;
        out.push(norm(n.data));
      }
      document.querySelectorAll("*").forEach(function (el) {
        if (el.closest("#i18n-toggle,[data-lang]")) return;
        attrs.forEach(function (a) { var v = el.getAttribute(a); if (v && CJK.test(v)) out.push("@" + a + ": " + norm(v)); });
      });
      if (CJK.test(document.title)) out.push("<title>: " + document.title);
      return Array.from(new Set(out));
    }
  };

  /* ── shared vocabulary: nav, common UI, sector/index names from data/sectors.json ── */
  I18N.add({
    "聪明钱追踪": "Smart Money", "板块涨跌": "Sector Moves", "AI 流向图": "AI Flow Map",
    "太空板块": "Space", "物理AI": "Physical AI", "物理 AI": "Physical AI", "财报日历": "Earnings Calendar",
    "蜡烛图": "Candlesticks", "割肉自查": "Cut-Loss Check", "实盘记录": "Track Record", "实验室": "Lab",
    "收盘": "Close", "盘中": "Intraday", "盘前": "Pre-market", "盘后": "After-hours",
    /* data/sectors.json labels — translated at render time, data file stays Chinese */
    "标普 500": "S&P 500", "纳指 100": "Nasdaq 100", "罗素 2000": "Russell 2000",
    "科技": "Tech", "通信服务": "Comm. Services", "可选消费": "Cons. Disc.", "必需消费": "Cons. Staples",
    "金融": "Financials", "医疗保健": "Health Care", "工业": "Industrials", "能源": "Energy",
    "原材料": "Materials", "公用事业": "Utilities", "房地产": "Real Estate",
    "科技 · 市值加权": "Tech · cap-weighted", "半导体 · 市值加权": "Semis · cap-weighted",
    "半导体 · 更均衡": "Semis · more balanced", "半导体设备": "Semi Equipment",
    "GPU / AI 芯片": "AI Accelerators", "存储": "Memory & Storage", "代工 / 模拟 / 手机芯片": "Foundry · Analog · Mobile",
    "网络 / 光通信": "Networking & Optics", "服务器 / 硬件": "Servers & Hardware", "软件": "Software",
    "云软件": "Cloud Software", "网络安全": "Cybersecurity", "互联网": "Internet", "互联网平台": "Internet Platforms",
    "IT 服务": "IT Services", "机器人 / AI": "Robotics / AI",
    "英伟达": "NVIDIA", "博通": "Broadcom", "台积电": "TSMC", "美光": "Micron", "闪迪": "SanDisk",
    "西部数据": "Western Digital", "希捷": "Seagate", "阿斯麦": "ASML", "应用材料": "Applied Materials",
    "泛林": "Lam Research", "科磊": "KLA", "泰瑞达": "Teradyne", "英特尔": "Intel", "高通": "Qualcomm",
    "德州仪器": "Texas Instruments", "亚德诺": "Analog Devices", "恩智浦": "NXP", "安森美": "onsemi",
    "微芯": "Microchip", "思科": "Cisco", "戴尔": "Dell", "慧与": "HPE", "超微电脑": "Supermicro",
    "微软": "Microsoft", "甲骨文": "Oracle", "苹果": "Apple", "谷歌": "Alphabet", "亚马逊": "Amazon",
    "奈飞": "Netflix", "埃森哲": "Accenture"
  });
})();

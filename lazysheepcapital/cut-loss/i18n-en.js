/* English dictionary for cut-loss/ */
I18N.html({
  '割肉<span class="grad-text">自查</span>': 'Before You <span class="grad-text">Cut</span>',
  '想割肉之前，先依次回答下面的问题。<br>只要有任何一题的答案是「否」，就不应该轻易割肉。':
    'Before you cut a losing position, answer the questions below in order.<br>If the answer to any one of them is “no”, don’t sell in a hurry.',
  '投资的关键是不要被情绪吓跑。回去看看你自己写下的<a href="../#principle-06">投资原则</a>，然后关掉行情软件。':
    'The key to investing is not letting emotions scare you out. Go reread the <a href="../#principle-06">investment principles</a> you wrote yourself, then close your trading app.'
});
I18N.add({
  "割肉自查 — LazySheepcapital": "Cut-Loss Checklist — LazySheepcapital",
  "标普和纳斯达克是否都下跌超过 15%？": "Are both the S&P 500 and the Nasdaq down more than 15%?",
  "只有指数级别的系统性崩盘才值得重新评估。单纯的回调和震荡，不算。":
    "Only an index-level, systemic crash justifies a rethink. Ordinary pullbacks and chop don't count.",
  "大盘连 15% 都没跌，这只是市场的正常波动。你慌什么？":
    "The market isn't even down 15%. This is normal volatility. What are you panicking about?",
  "当前公司基本面是否存在问题？": "Is something actually wrong with the company's fundamentals?",
  "营收、利润、护城河是真的恶化了？还是只有股价在跌？":
    "Have revenue, profits or the moat really deteriorated? Or is it just the stock price falling?",
  "基本面没问题，价值终将回归。基本面好的公司，股价跌了，终究会涨回去。":
    "The fundamentals are fine, and value always comes back. A company with good fundamentals will recover after its stock drops.",
  "你当初买入的逻辑是否已经被证伪？": "Has your original reason for buying been proven wrong?",
  "回忆一下当初为什么买。那个理由，现在还成立吗？": "Remember why you bought it. Does that reason still hold today?",
  "买入逻辑还在，变的只是价格。逻辑没破，凭什么割？":
    "Your thesis is intact; only the price changed. If the thesis isn't broken, why sell?",
  "你是否在用杠杆，且马上要被强制平仓？": "Are you using leverage and about to get margin-called out?",
  "被强平不叫割肉，叫认命。没上杠杆的话，没有人能逼你卖。":
    "Getting force-liquidated isn't cutting a loss, it's surrender. Without leverage, nobody can force you to sell.",
  "没有杠杆，就没有人能逼你交出筹码。时间站在你这边。":
    "No leverage means nobody can make you hand over your shares. Time is on your side.",
  "你是 sb 吗？": "Are you an idiot?",
  "诚实一点。": "Be honest.",
  "你不是 sb，那就别做只有 sb 才会做的事——在底部把筹码交出去。":
    "You're not an idiot, so don't do what only an idiot would: hand over your shares at the bottom.",
  "是": "Yes", "否": "No",
  "不应该轻易割肉！": "Don't cut it yet!",
  "重新自查": "Start over",
  "行吧……割吧。": "Fine… cut it.",
  "大盘崩了，基本面崩了，买入逻辑证伪了，杠杆要爆了，你还亲口承认自己是 sb。":
    "The market crashed, the fundamentals collapsed, your thesis was disproven, your leverage is about to blow up, and you admitted you're an idiot.",
  "这种情况下，割肉是你仅剩的尊严。留得青山在，不怕没柴烧。割完记得复盘，下次别再让自己走到第五题。":
    "In that case, cutting is the last bit of dignity you have left. Live to fight another day. Do a post-mortem afterwards, and never let yourself reach question five again."
});
I18N.patterns([
  [/^问题 (\d+) \/ (\d+)$/, function (m, a, b) { return "Question " + a + " / " + b; }]
]);

/* 日本蜡烛图技术 — 形态数据库
 * 字段说明
 *   id   唯一标识            zh/en  中英文名      al   别名（用于搜索）
 *   type rev 反转 | cont 持续 | ind 犹豫/单根 | trend 趋势与西方技术
 *   dir  bull 看涨 | bear 看跌 | neu 中性
 *   tier S/A/B/C/D 实用度      rel 1-5 可靠性    freq 1 常见 | 2 一般 | 3 罕见
 *   book 1 = 《日本蜡烛图技术》(Nison) 原书讲解；0 = 后人补充（Bulkowski / Morris 等）
 *   ctx  前置趋势 down/up/side  g   与前置趋势的跳空距离
 *   c    形态K线 [开, 高, 低, 收]   after 预期走势 up/down/none
 *   path 趋势图路径（趋势类条目）  k 每段K线数  lines 斜线  hl 水平线  ma 均线  panel 副图
 *   rec 识别要点  psy 市场含义  use 实战用法
 */
(function () {
  const P = [];
  const add = (o) => P.push(o);
  // 生成 n 根连续创新高的阳线（新价线）
  const rising = (n, start, step) => Array.from({ length: n }, (_, i) => {
    const o = start + step * i, c = o + step * 1.1;
    return [o, c + 0.25, o - 0.2, c];
  });

  /* ═════════════ 单根K线 ═════════════ */

  add({ id: 'hammer', zh: '锤子线', en: 'Hammer', al: 'chuizi 锤头 takuri', type: 'rev', dir: 'bull', tier: 'S', rel: 4, freq: 1, book: 1,
    c: [[9.5, 10.5, 5.2, 10.3]],
    rec: '出现在下跌趋势中；实体很小、位于价格区间上端；下影线长度至少是实体的 2 倍；几乎没有上影线。实体颜色不重要，阳线略强。',
    psy: '开盘后空方一度大幅砸低，但收盘前多方把价格拉回到开盘价附近——空方失去了对局面的控制。',
    use: '最好等次日确认：次日收盘高于锤子线实体，信号更可靠。锤子线的最低点可作为止损位。下影线越长、出现位置越接近重要支撑，信号越强。' });

  add({ id: 'hanging-man', zh: '上吊线', en: 'Hanging Man', al: 'shangdiao', type: 'rev', dir: 'bear', tier: 'A', rel: 3, freq: 1, book: 1,
    c: [[20, 20.1, 15.4, 19.5]],
    rec: '外形与锤子线完全相同，但出现在上涨趋势之后的高位。下影线 ≥ 实体 2 倍，几乎无上影线。',
    psy: '盘中出现了一次明显的抛售，说明高位开始有人兑现；虽然收盘被拉回，但多方的根基已经松动。',
    use: '必须等待确认：次日开盘低于上吊线实体、或收出阴线并收在实体之下才算成立。阴实体比阳实体更偏空。单独出现时可靠性一般。' });

  add({ id: 'inverted-hammer', zh: '倒锤子线', en: 'Inverted Hammer', al: 'daochuizi', type: 'rev', dir: 'bull', tier: 'A', rel: 3, freq: 2, book: 1,
    c: [[5, 9.6, 4.8, 5.6]],
    rec: '出现在下跌趋势中；小实体位于区间下端；长上影线 ≥ 实体 2 倍；几乎没有下影线。形状与流星线相同。',
    psy: '多方尝试反攻但被打回，不过空方已不能继续压低收盘。属于“试探性”的底部信号。',
    use: '确认要求比锤子线更严格：次日最好高开，并收出阳线。没有确认时不宜单凭倒锤子抄底。' });

  add({ id: 'shooting-star', zh: '流星线', en: 'Shooting Star', al: 'liuxing 射击之星', type: 'rev', dir: 'bear', tier: 'S', rel: 4, freq: 1, book: 1, g: -0.8,
    c: [[20.6, 25.2, 20.0, 20.1]],
    rec: '出现在上涨趋势中；小实体位于区间下端，长上影线 ≥ 实体 2 倍，几乎没有下影线。理想状态下实体与前一根K线之间有跳空。',
    psy: '开盘后多方继续冲高，但高位遭遇大量抛盘，收盘几乎回到最低点——上攻失败。',
    use: '次日收在流星线实体下方即确认。流星线的最高点是天然的阻力/止损位。出现在前高或阻力位时可靠性更高。' });

  add({ id: 'gravestone-doji', zh: '墓碑十字线', en: 'Gravestone Doji', al: 'mubei 墓碑线 倒T', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 1, g: -0.6,
    c: [[20.5, 25, 20.4, 20.5]],
    rec: '开盘价=收盘价=最低价（或非常接近），只有长长的上影线，形如“⊥”。',
    psy: '多方把价格推到高处，最终全部被抹去，收在当天最低——在高位是非常强的看跌信号，名字本身就是“埋葬多头”的意思。',
    use: '在上涨趋势顶部最有效；在下跌趋势中出现时意义较弱。等待下一根阴线确认。' });

  add({ id: 'dragonfly-doji', zh: '蜻蜓十字线', en: 'Dragonfly Doji', al: 'qingting T字线', type: 'rev', dir: 'bull', tier: 'A', rel: 3, freq: 2, book: 1,
    c: [[8, 8.05, 3, 8]],
    rec: '开盘价=收盘价=最高价，只有长长的下影线，形如“T”。可看作锤子线的极端版本。',
    psy: '空方盘中大幅压低价格，但收盘完全收回失地，显示低位承接很强。',
    use: '出现在下跌趋势底部或重要支撑处最有意义；次日阳线确认。若出现在高位，则与上吊线类似，反而偏空。' });

  add({ id: 'long-legged-doji', zh: '长腿十字线', en: 'Long-Legged Doji', al: 'changtui 长脚十字', type: 'ind', dir: 'neu', tier: 'A', rel: 3, freq: 2, book: 1, ctx: 'up',
    c: [[20, 24, 16, 20]],
    rec: '开盘价≈收盘价，上下影线都很长。',
    psy: '多空在当天经历了剧烈争夺，最终打成平手——市场完全失去方向感。',
    use: '在长期上涨之后出现，是趋势可能见顶的警示；在横盘区间中出现则意义不大。重要的是它出现的位置。' });

  add({ id: 'rickshaw-man', zh: '黄包车夫', en: 'Rickshaw Man', al: 'huangbaoche 人力车夫', type: 'ind', dir: 'neu', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'up',
    c: [[20, 24, 16, 20.05]],
    rec: '长腿十字线的一种：实体（十字）恰好位于整根K线的正中间。',
    psy: '与长腿十字线相同，表示供需完全均衡、市场犹豫不决。',
    use: '原书将其作为特殊的长腿十字线讲解。在高位或低位出现时，提示趋势可能变化。' });

  add({ id: 'doji', zh: '十字线', en: 'Doji', al: 'shizi 十字星', type: 'ind', dir: 'neu', tier: 'A', rel: 3, freq: 1, book: 1, ctx: 'up',
    c: [[20, 21.6, 18.5, 20]],
    rec: '开盘价与收盘价相同或几乎相同，实体是一条横线。“几乎相同”的标准要相对于近期K线的实体大小来判断。',
    psy: '市场处于犹豫和转折点上。Nison 指出：十字线在上涨趋势中的警示作用强于在下跌趋势中——上涨需要买盘持续推动，而下跌可以靠自身重量。',
    use: '十字线本身不是交易信号，是“注意”信号。在长阳线之后出现、或在超买区出现，应收紧止损。若市场频繁出现十字线，则单根十字线没有意义。' });

  add({ id: 'northern-doji', zh: '北方十字线', en: 'Northern Doji', al: 'beifang 高位十字', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    c: [[20.3, 21.6, 19, 20.3]],
    rec: '出现在上涨趋势中（价格处于“北方”/高位）的十字线。',
    psy: '上涨中出现犹豫，说明买盘推动力减弱。Nison 认为高位十字线的看跌意义相当可靠。',
    use: '如果十字线后出现阴线，收在十字线下方，可视为见顶确认；也可作为减仓或收紧止损的提示。（名称来自 Bulkowski；“高位十字线更重要”的观点来自 Nison）' });

  add({ id: 'southern-doji', zh: '南方十字线', en: 'Southern Doji', al: 'nanfang 低位十字', type: 'rev', dir: 'bull', tier: 'C', rel: 2, freq: 2, book: 1,
    c: [[5, 6.4, 3.8, 5]],
    rec: '出现在下跌趋势中（低位）的十字线。',
    psy: '卖压暂时得到平衡。但下跌中的十字线意义弱于上涨中的十字线：下跌可以“自由落体”，不需要卖盘持续推动。',
    use: '需要后续阳线确认，单独出现时往往只是下跌中的短暂停顿。（名称来自 Bulkowski）' });

  add({ id: 'spinning-top', zh: '纺锤线', en: 'Spinning Top', al: 'fangchui 陀螺 小实体', type: 'ind', dir: 'neu', tier: 'B', rel: 2, freq: 1, book: 1, ctx: 'up',
    c: [[20, 21.8, 18.3, 20.7]],
    rec: '实体很小（阴阳均可），上下影线长度适中、通常比实体长。',
    psy: '多空力量趋于平衡，原有趋势的推动力在减弱。',
    use: '出现在长阳之后或长阴之后，提示原趋势动力衰竭。它也是星线、孕线等多根形态中的组成部分。' });

  add({ id: 'high-wave', zh: '高浪线', en: 'High Wave', al: 'gaolang 风高浪大线', type: 'ind', dir: 'neu', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'up',
    c: [[20, 25, 15, 20.6]],
    rec: '实体很小，但上影线和下影线都特别长。',
    psy: '市场情绪剧烈动荡、方向感完全丧失。连续出现几根高浪线时，常常是趋势变化的前兆。',
    use: '在上涨尾声或下跌尾声出现时提高警惕，配合确认K线行动。' });

  add({ id: 'takuri', zh: '探水竿', en: 'Takuri Line', al: 'tanshuigan 测深线', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 3, book: 0,
    c: [[8, 8.4, 2, 8.3]],
    rec: '锤子线的加强版：下影线长度至少是实体的 3 倍，几乎没有上影线。日文 takuri 意为“探测水深”。',
    psy: '空方把价格压到“水底”，又被完全拉回，说明下方承接极强。',
    use: '与锤子线用法相同，次日确认后入场，止损放在最低点下方。' });

  add({ id: 'bull-belt-hold', zh: '看涨捉腰带线', en: 'Bullish Belt-Hold', al: 'zhuoyaodai 开盘光脚阳线 yorikiri', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1, g: 1,
    c: [[3, 9.2, 3, 9]],
    rec: '下跌趋势中，开盘即为全天最低价（光脚），随后一路上涨收出长阳线，几乎没有下影线。',
    psy: '低开后多方立即接管，全天都没有给空方机会。日文 yorikiri 是相扑术语：抓住对手腰带把他推出场外。',
    use: '实体越长越重要。若随后的K线收盘跌破捉腰带线的最低点，则信号失效。' });

  add({ id: 'bear-belt-hold', zh: '看跌捉腰带线', en: 'Bearish Belt-Hold', al: 'zhuoyaodai 开盘光头阴线', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1, g: -1,
    c: [[22, 22, 15.8, 16]],
    rec: '上涨趋势中，开盘即为全天最高价（光头），随后一路下跌收出长阴线。',
    psy: '高开之后空方立刻掌控全局，全天抛压不断。',
    use: '若后续K线收盘重新站上捉腰带线的最高点，则信号失效。在长期上涨之后出现更有意义。' });

  add({ id: 'white-marubozu', zh: '光头光脚阳线', en: 'White Marubozu', al: 'guangtou guangjiao 大阳线 秃头', type: 'cont', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'side',
    c: [[8, 15, 8, 15]],
    rec: '长阳线，没有上影线也没有下影线：开盘=最低，收盘=最高。marubozu 意为“光头”。',
    psy: '多方从开盘到收盘完全掌控局面，强烈的看涨力量。',
    use: '突破横盘区间时出现，是有效突破的有力证据；在长期上涨后出现，则可能是情绪化的“最后冲刺”。其中点常作为支撑。' });

  add({ id: 'black-marubozu', zh: '光头光脚阴线', en: 'Black Marubozu', al: 'guangtou guangjiao 大阴线', type: 'cont', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'side',
    c: [[15, 15, 8, 8]],
    rec: '长阴线，没有上下影线：开盘=最高，收盘=最低。',
    psy: '空方从开盘到收盘完全掌控局面，强烈的看跌力量。',
    use: '跌破支撑时出现说明破位有效；在长期下跌后出现，可能是恐慌性抛售的尾声。' });

  add({ id: 'closing-marubozu-w', zh: '收盘光头阳线', en: 'Closing White Marubozu', al: 'guangtou 收盘秃头', type: 'cont', dir: 'bull', tier: 'C', rel: 3, freq: 2, book: 0, ctx: 'side',
    c: [[8, 15, 7.2, 15]],
    rec: '长阳线，收盘价=最高价（无上影线），但有下影线。',
    psy: '收盘时买盘仍然很强，多方把价格推到全天最高位才收盘。',
    use: '常见于上涨中继，强度略低于光头光脚阳线。' });

  add({ id: 'closing-marubozu-b', zh: '收盘光脚阴线', en: 'Closing Black Marubozu', al: 'guangjiao', type: 'cont', dir: 'bear', tier: 'C', rel: 3, freq: 2, book: 0, ctx: 'side',
    c: [[15, 15.8, 8, 8]],
    rec: '长阴线，收盘价=最低价（无下影线），但有上影线。',
    psy: '收盘时卖压仍然很重，空方把价格压到全天最低才收盘。',
    use: '下跌中继中常见；若出现在支撑位附近则需警惕破位。' });

  add({ id: 'opening-marubozu-w', zh: '开盘光脚阳线', en: 'Opening White Marubozu', al: 'guangjiao', type: 'cont', dir: 'bull', tier: 'D', rel: 2, freq: 2, book: 0, ctx: 'side',
    c: [[8, 15.8, 8, 15]],
    rec: '长阳线，开盘价=最低价（无下影线），但有上影线。',
    psy: '开盘后一路上涨，但尾盘略有回落。',
    use: '强度弱于收盘光头阳线（尾盘有获利了结）。实战意义有限。' });

  add({ id: 'opening-marubozu-b', zh: '开盘光头阴线', en: 'Opening Black Marubozu', al: 'guangtou', type: 'cont', dir: 'bear', tier: 'D', rel: 2, freq: 2, book: 0, ctx: 'side',
    c: [[15, 15, 7.2, 8]],
    rec: '长阴线，开盘价=最高价（无上影线），但有下影线。',
    psy: '开盘后一路下跌，但尾盘略有承接。',
    use: '强度弱于收盘光脚阴线。实战意义有限。' });

  add({ id: 'long-white', zh: '长阳线', en: 'Long White Candle', al: 'changyang 大阳', type: 'ind', dir: 'bull', tier: 'C', rel: 2, freq: 1, book: 1, ctx: 'side',
    c: [[8, 15.4, 7.6, 15]],
    rec: '实体明显长于近期平均水平的阳线，影线较短。',
    psy: '多方占据主动。Nison 强调：长阳线若击穿阻力位，往往意味着阻力转为支撑。',
    use: '单独一根长阳线不是反转信号，但它是吞没、刺透、启明星等形态的组成部分，也常用来确认其他形态。' });

  add({ id: 'long-black', zh: '长阴线', en: 'Long Black Candle', al: 'changyin 大阴', type: 'ind', dir: 'bear', tier: 'C', rel: 2, freq: 1, book: 1, ctx: 'side',
    c: [[15, 15.4, 7.6, 8]],
    rec: '实体明显长于近期平均水平的阴线，影线较短。',
    psy: '空方占据主动。长阴线跌破支撑位时，支撑往往转化为阻力。',
    use: '常作为乌云盖顶、黄昏星、看跌吞没等形态的确认K线。' });

  add({ id: 'short-line', zh: '短K线（小阳/小阴）', en: 'Short Line', al: 'duan xiaoyang xiaoyin', type: 'ind', dir: 'neu', tier: 'D', rel: 1, freq: 1, book: 0, ctx: 'side',
    c: [[11, 12, 10.2, 11.7], [11.6, 12.1, 10.6, 11]],
    rec: '实体和影线都很短的K线，波动幅度小于近期平均。',
    psy: '交投清淡，多空都没有明显意愿。',
    use: '单独没有交易意义；连续出现多根短K线时表示市场在蓄势，等待方向选择。' });

  add({ id: 'long-upper-shadow', zh: '长上影线', en: 'Long Upper Shadow', al: 'changshangying 避雷针', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 1, book: 0, g: -0.3,
    c: [[20, 24.5, 19.6, 20.9]],
    rec: '上影线特别长（通常 ≥ 整根K线的 2/3），实体位于下端，阴阳均可。',
    psy: '长上影线说明高位有供给，多方未能守住高点。（Nison 强调影线和实体一样重要；作为单独形态命名来自 Morris）',
    use: '在阻力位或前高附近出现时偏空；与流星线、墓碑十字同源。' });

  add({ id: 'long-lower-shadow', zh: '长下影线', en: 'Long Lower Shadow', al: 'changxiaying 定海神针', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 1, book: 0,
    c: [[8.5, 9.3, 4, 8.8]],
    rec: '下影线特别长（通常 ≥ 整根K线的 2/3），实体位于上端，阴阳均可。',
    psy: '低位有需求，空方无法守住低点。',
    use: '在支撑位附近出现时偏多；与锤子线、蜻蜓十字同源。' });

  window.CANDLE_PATTERNS = P;
  window.__candleAdd = add;
  window.__candleRising = rising;
})();

/* ═════════════ 两根K线 ═════════════ */
(function () {
  const add = window.__candleAdd;

  add({ id: 'bull-engulfing', zh: '看涨吞没', en: 'Bullish Engulfing', al: 'tunmo 阳包阴 抱线', type: 'rev', dir: 'bull', tier: 'S', rel: 4, freq: 1, book: 1,
    s: '下跌中，一根大阳线把前一根阴线整个“吃掉”。',
    c: [[8, 8.3, 5.6, 6], [5.5, 9.4, 5.2, 9.2]],
    rec: '①前面是明确的下跌趋势；②第一根是阴线（小一些）；③第二根是阳线，实体完全包住第一根的实体（影线不要求）。',
    psy: '空方还想继续往下砸，但当天多方反手把价格推得比前一天开盘还高——力量对比瞬间翻转。',
    use: 'Nison 认为是最重要的反转形态之一。第二根阳线越大、成交量越大、包住的K线越多，信号越强。止损放在两根K线的最低点下方。' });

  add({ id: 'bear-engulfing', zh: '看跌吞没', en: 'Bearish Engulfing', al: 'tunmo 阴包阳 抱线', type: 'rev', dir: 'bear', tier: 'S', rel: 4, freq: 1, book: 1,
    s: '上涨中，一根大阴线把前一根阳线整个“吃掉”。',
    c: [[18, 20.2, 17.8, 20], [20.5, 20.8, 16.8, 17]],
    rec: '①前面是明确的上涨趋势；②第一根是阳线；③第二根是阴线，实体完全包住第一根的实体。',
    psy: '多方高开后被空方全面压制，收盘低于前一天开盘——上涨的人全部被套。',
    use: '最常用、最可靠的见顶信号之一。两根K线的最高点就是阻力位/止损位。出现在长期上涨后或阻力位附近时尤其要重视。' });

  add({ id: 'dark-cloud', zh: '乌云盖顶', en: 'Dark Cloud Cover', al: 'wuyun gaiding', type: 'rev', dir: 'bear', tier: 'S', rel: 4, freq: 2, book: 1,
    s: '上涨中高开，然后跌回前一根阳线实体的一半以下。',
    c: [[14, 20.2, 13.8, 20], [21, 21.5, 16.2, 16.5]],
    rec: '①上涨趋势；②第一根是长阳线；③第二根高开（高于前一根最高价），然后收阴线，收盘价深入第一根阳线实体的 50% 以下。',
    psy: '早盘还在冲新高，结果收盘时已经吐掉前一天大半涨幅——乌云遮住了太阳。',
    use: '收盘越深入阳线实体，信号越强；如果完全吞没，就变成看跌吞没（更强）。第二根的最高点是阻力。' });

  add({ id: 'piercing', zh: '刺透形态', en: 'Piercing Pattern', al: 'citou 刺穿线 曙光初现', type: 'rev', dir: 'bull', tier: 'S', rel: 4, freq: 2, book: 1,
    s: '下跌中低开，然后涨回前一根阴线实体的一半以上。',
    c: [[12, 12.2, 6, 6.2], [5, 9.8, 4.6, 9.6]],
    rec: '①下跌趋势；②第一根是长阴线；③第二根低开（低于前一根最低价），然后收阳线，收盘价超过阴线实体的 50%。',
    psy: '早盘还在创新低，收盘却收复了大半失地——乌云盖顶的反面。',
    use: '收盘必须超过阴线实体中点，否则只是“插入线/切入线”（偏空的持续形态）。止损放在第二根最低点下方。' });

  add({ id: 'bull-harami', zh: '看涨孕线', en: 'Bullish Harami', al: 'yunxian 母子线 身怀六甲', type: 'rev', dir: 'bull', tier: 'A', rel: 3, freq: 1, book: 1,
    s: '下跌中，大阴线后面跟一根小K线，小K线“藏”在大阴线肚子里。',
    c: [[12, 12.3, 5, 5.5], [7.2, 8.8, 6.8, 8.5]],
    rec: '①下跌趋势；②第一根是长阴线；③第二根是小实体（阴阳均可，阳线更好），整个实体在第一根实体范围之内。和吞没形态正好相反。',
    psy: 'harami 在日语里是“怀孕”。大阴线之后突然波动收窄，说明下跌动能“刹车”了。',
    use: '孕线是“趋势可能停止”而不一定是“立刻反转”的信号。等第三根阳线收盘高于第一根阴线的开盘价再确认（即“三内部上涨”）。' });

  add({ id: 'bear-harami', zh: '看跌孕线', en: 'Bearish Harami', al: 'yunxian 母子线', type: 'rev', dir: 'bear', tier: 'A', rel: 3, freq: 1, book: 1,
    s: '上涨中，大阳线后面跟一根小K线，小K线藏在大阳线肚子里。',
    c: [[14, 20.2, 13.8, 20], [18.6, 19.2, 17, 17.4]],
    rec: '①上涨趋势；②第一根是长阳线；③第二根是小实体，整个实体在第一根实体之内。',
    psy: '大阳线之后突然没了力气，多方动能出现“刹车”。',
    use: '更多是“涨势暂停”的提示，可以减仓或收紧止损；第三根收低才是更明确的见顶（即“三内部下跌”）。' });

  add({ id: 'bull-harami-cross', zh: '看涨十字孕线', en: 'Bullish Harami Cross', al: 'shizi yunxian', type: 'rev', dir: 'bull', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '孕线的第二根是十字线，反转意味比普通孕线更强。',
    c: [[12, 12.3, 5, 5.5], [8, 9, 7, 8]],
    rec: '同看涨孕线，但第二根是十字线（开盘≈收盘）。',
    psy: '长阴线后市场完全犹豫，空方失去了持续性。',
    use: 'Nison 认为十字孕线是重要的反转形态，比普通孕线更值得重视。仍建议等次日阳线确认。' });

  add({ id: 'bear-harami-cross', zh: '看跌十字孕线', en: 'Bearish Harami Cross', al: 'shizi yunxian', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '大阳线后出现一根被包住的十字线，上涨可能见顶。',
    c: [[14, 20.2, 13.8, 20], [17.5, 18.6, 16.4, 17.5]],
    rec: '同看跌孕线，但第二根是十字线。',
    psy: '长阳线之后突然犹豫不决——上涨需要持续买盘，十字线说明买盘断了。',
    use: '在长期上涨的末端出现时是很强的警告信号，适合减仓/收紧止损。' });

  add({ id: 'tweezers-top', zh: '平头顶部', en: 'Tweezers Top', al: 'pingtou dingbu 镊子顶 双针顶', type: 'rev', dir: 'bear', tier: 'A', rel: 3, freq: 1, book: 1,
    s: '两根（或几根）相邻K线的最高价几乎一样，像一个平顶。',
    c: [[15, 20, 14.8, 19.5], [19.4, 20, 16, 16.5]],
    rec: '上涨趋势中，两根或多根K线的最高点相同或几乎相同（像镊子的两个尖）。K线不必相邻，但相邻更好。',
    psy: '价格两次冲击同一高度都失败，说明那里有一道“天花板”。',
    use: '单独看是一般信号；如果同时组成看跌吞没、乌云盖顶、看跌孕线，或第二根是流星线，可靠性大幅提升。平头的高点是阻力。' });

  add({ id: 'tweezers-bottom', zh: '平头底部', en: 'Tweezers Bottom', al: 'pingtou dibu 镊子底 双针探底', type: 'rev', dir: 'bull', tier: 'A', rel: 3, freq: 1, book: 1,
    s: '两根相邻K线的最低价几乎一样，像一个平底。',
    c: [[10, 10.3, 5, 5.5], [5.6, 8.5, 5, 8]],
    rec: '下跌趋势中，两根或多根K线的最低点相同或几乎相同。',
    psy: '价格两次下探同一位置都被托住，下方有“地板”。',
    use: '与看涨吞没、刺透、孕线或锤子线组合时更可靠。平底的低点是支撑和止损位。' });

  add({ id: 'bull-counterattack', zh: '看涨反击线', en: 'Bullish Counterattack / Meeting Line', al: 'fanji yuehui 约会线 相逢线', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '下跌中大幅低开，但收盘刚好回到前一天收盘价。',
    c: [[12, 12.2, 6, 6.3], [3, 6.5, 2.8, 6.3]],
    rec: '①下跌趋势；②第一根长阴线；③第二根大幅低开后收长阳线，收盘价与前一根收盘价相同或几乎相同。',
    psy: '空方开盘占尽优势，多方却在一天之内把失地全部收回，打成平手。',
    use: '比刺透形态弱（没有深入阴线实体）。需要后续K线确认。' });

  add({ id: 'bear-counterattack', zh: '看跌反击线', en: 'Bearish Counterattack / Meeting Line', al: 'fanji yuehui 约会线', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '上涨中大幅高开，但收盘刚好跌回前一天收盘价。',
    c: [[14, 20.2, 13.8, 20], [23, 23.2, 19.8, 20]],
    rec: '①上涨趋势；②第一根长阳线；③第二根大幅高开后收长阴线，收盘价与前一根收盘价相同。',
    psy: '早盘大涨，收盘全部吐回——多方的乐观被浇灭。',
    use: '是乌云盖顶的弱化版本。第二根的最高点是阻力位。' });

  add({ id: 'bull-separating', zh: '看涨分手线', en: 'Bullish Separating Lines', al: 'fenshou', type: 'cont', dir: 'bull', tier: 'C', rel: 3, freq: 3, book: 1,
    s: '上涨途中回调一根阴线，第二天从同一开盘价直接涨上去。',
    c: [[14, 14.2, 10.6, 10.8], [14, 18.6, 14, 18.4]],
    rec: '①上涨趋势；②第一根是阴线（逆势）；③第二根阳线的开盘价与第一根开盘价相同，然后一路上涨。',
    psy: '回调只是一天的插曲，多方马上“跟它分手”，恢复上涨。',
    use: '是持续形态，说明上涨趋势未变。第二根若为捉腰带线则更强。' });

  add({ id: 'bear-separating', zh: '看跌分手线', en: 'Bearish Separating Lines', al: 'fenshou', type: 'cont', dir: 'bear', tier: 'C', rel: 3, freq: 3, book: 1,
    s: '下跌途中反弹一根阳线，第二天从同一开盘价直接跌下去。',
    c: [[10, 13.8, 9.8, 13.5], [10, 10, 5.2, 5.5]],
    rec: '①下跌趋势；②第一根是阳线（逆势反弹）；③第二根阴线开盘价与第一根开盘价相同，然后一路下跌。',
    psy: '反弹被一刀斩断，空方恢复控制。',
    use: '持续形态：下跌趋势继续，反弹不宜追多。' });

  add({ id: 'on-neck', zh: '待入线', en: 'On-Neck Line', al: 'dairu', type: 'cont', dir: 'bear', tier: 'C', rel: 2, freq: 2, book: 1,
    s: '下跌中的小反弹，收盘只碰到前一根阴线的最低价——太弱了。',
    c: [[12, 12.2, 6, 6.3], [4.5, 6.1, 4.2, 6]],
    rec: '①下跌趋势；②长阴线；③第二根低开后收小阳线，收盘价仅仅回到前一根阴线的最低价附近。',
    psy: '多方的反击连阴线实体都没碰到，只是“把脖子伸到”前一根的底部。',
    use: '看跌持续：价格跌破这根小阳线的低点时，下跌继续。不要把它误认作刺透形态。' });

  add({ id: 'in-neck', zh: '切入线', en: 'In-Neck Line', al: 'qieru', type: 'cont', dir: 'bear', tier: 'C', rel: 2, freq: 2, book: 1,
    s: '下跌中的小反弹，收盘刚刚进入前一根阴线实体一点点。',
    c: [[12, 12.2, 6, 6.3], [4.5, 6.9, 4.2, 6.7]],
    rec: '同待入线，但第二根阳线收盘略高于阴线收盘价，只是稍微“切入”实体底部。',
    psy: '反弹力度仍然很弱。',
    use: '看跌持续。三者强弱：待入线 < 切入线 < 插入线 < 刺透形态（后者才是反转）。' });

  add({ id: 'thrusting', zh: '插入线', en: 'Thrusting Line', al: 'charu', type: 'cont', dir: 'bear', tier: 'C', rel: 2, freq: 2, book: 1,
    s: '下跌中的反弹收进了阴线实体，但没超过一半。',
    c: [[12, 12.2, 6, 6.3], [4.5, 8.6, 4.2, 8.4]],
    rec: '同切入线，但第二根阳线收盘明显深入阴线实体，却仍低于实体中点。',
    psy: '比切入线强，但没超过中点，多方仍未夺回控制权。',
    use: '在下跌趋势中偏空；若在上涨趋势的回调中出现，Nison 认为可视为偏多。若数日内连续出现两次插入线，也可能偏多。' });

  add({ id: 'bull-kicking', zh: '看涨反冲', en: 'Bullish Kicking', al: 'fanchong 踢腿', type: 'rev', dir: 'bull', tier: 'B', rel: 4, freq: 3, book: 0, ctx: 'side',
    s: '一根光头光脚阴线之后，直接跳空出一根光头光脚阳线。',
    c: [[12, 12, 6, 6], [13, 19, 13, 19]],
    rec: '第一根是光头光脚阴线，第二根向上跳空（开盘高于第一根开盘价）并收出光头光脚阳线，中间留下缺口。',
    psy: '市场情绪在一天之内发生了 180° 转变，通常伴随重大消息。',
    use: '很少见，但出现时力量强劲。缺口是支撑。不依赖前置趋势。' });

  add({ id: 'bear-kicking', zh: '看跌反冲', en: 'Bearish Kicking', al: 'fanchong', type: 'rev', dir: 'bear', tier: 'B', rel: 4, freq: 3, book: 0, ctx: 'side',
    s: '一根光头光脚阳线之后，直接跳空出一根光头光脚阴线。',
    c: [[6, 12, 6, 12], [5, 5, -1, -1]],
    rec: '第一根光头光脚阳线，第二根向下跳空并收出光头光脚阴线。',
    psy: '情绪急剧逆转，多半有利空消息。',
    use: '罕见但强烈。缺口变成阻力。' });

  add({ id: 'bull-doji-star', zh: '看涨十字星', en: 'Bullish Doji Star', al: 'shizixing', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '长阴线之后跳空出现一根十字线——下跌可能要停。',
    c: [[12, 12.2, 6, 6.3], [5, 5.6, 4.4, 5]],
    rec: '①下跌趋势；②长阴线；③第二根向下跳空的十字线（实体与前一根实体之间有缺口）。',
    psy: '空方追跌后失去动力，市场进入犹豫。',
    use: '是“十字启明星”的前两根。次日若收长阳线深入第一根实体，就完成十字启明星。' });

  add({ id: 'bear-doji-star', zh: '看跌十字星', en: 'Bearish Doji Star', al: 'shizixing', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '长阳线之后跳空出现一根十字线——上涨可能见顶。',
    c: [[14, 20.2, 13.8, 20], [21, 21.6, 20.4, 21]],
    rec: '①上涨趋势；②长阳线；③第二根向上跳空的十字线。',
    psy: '跳空高开却没有后续买盘，多空打平。',
    use: '是“十字黄昏星”的前两根。Nison 建议：高位出现十字星时就应该先保护利润。' });

  add({ id: 'homing-pigeon', zh: '家鸽形态', en: 'Homing Pigeon', al: 'jiage 归巢鸽', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '像看涨孕线，但两根都是阴线。',
    c: [[12, 12.2, 5, 5.5], [9, 9.5, 7, 7.5]],
    rec: '①下跌趋势；②长阴线；③第二根是较小的阴线，实体完全在第一根实体之内。',
    psy: '虽然还在下跌，但跌幅明显缩小，卖压在衰减。',
    use: '统计表现一般，单独使用不可靠，需要随后的阳线确认。' });

  add({ id: 'above-stomach', zh: '腹上形态', en: 'Above the Stomach', al: 'fushang', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '下跌中阴线之后，阳线开盘和收盘都在阴线实体中点以上。',
    c: [[12, 12.2, 6, 6.3], [9.6, 13, 9.4, 12.5]],
    rec: '①下跌趋势；②阴线；③第二根阳线开盘和收盘都高于第一根实体的中点。',
    psy: '多方从开盘就占优，空方没有任何机会。',
    use: 'Bulkowski 收录的形态。与刺透形态不同，它不需要低开，第二根从开盘起就站在阴线实体中点之上。' });

  add({ id: 'below-stomach', zh: '腹下形态', en: 'Below the Stomach', al: 'fuxia', type: 'rev', dir: 'bear', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '上涨中阳线之后，阴线开盘和收盘都在阳线实体中点以下。',
    c: [[14, 20.2, 13.8, 20], [16.6, 16.8, 13, 13.5]],
    rec: '①上涨趋势；②阳线；③第二根阴线开盘和收盘都低于第一根实体的中点。',
    psy: '多方的成果第二天开盘就被抹去一半以上。',
    use: 'Bulkowski 收录的形态。与乌云盖顶不同，它不需要高开，第二根从开盘起就处在阳线实体中点之下。' });

  add({ id: 'matching-low', zh: '相同低价', en: 'Matching Low', al: 'xiangtong dijia', type: 'rev', dir: 'bull', tier: 'C', rel: 2, freq: 2, book: 0,
    s: '两根阴线收在同一个价格——那里可能是底。',
    c: [[12, 12.2, 6, 6], [9, 9.3, 5.8, 6]],
    rec: '①下跌趋势；②两根阴线；③收盘价相同或几乎相同。',
    psy: '空方两次把价格压到同一位置收盘，却无法再低，形成短期支撑。',
    use: '类似平头底部（只看收盘价）。Bulkowski 统计发现它更常表现为持续而非反转，需谨慎。' });

  add({ id: 'last-engulfing-top', zh: '最后吞没顶部', en: 'Last Engulfing Top', al: 'zuihou tunmo', type: 'rev', dir: 'bear', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '上涨末端出现一根“看涨吞没”，反而常常是顶。',
    c: [[19, 19.5, 17.3, 17.5], [17.2, 20.6, 17, 20.4]],
    rec: '①上涨趋势；②阴线；③阳线完全吞没前一根阴线（外形是看涨吞没，但出现在高位）。',
    psy: '高位的最后一次追高，买盘耗尽。',
    use: '需要次日收低于吞没阳线的收盘确认。' });

  add({ id: 'last-engulfing-bottom', zh: '最后吞没底部', en: 'Last Engulfing Bottom', al: 'zuihou tunmo', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '下跌末端出现一根“看跌吞没”，反而常常是底。',
    c: [[6, 8, 5.8, 7.6], [7.9, 8.2, 4.5, 4.8]],
    rec: '①下跌趋势；②阳线；③阴线完全吞没前一根阳线（外形是看跌吞没，但出现在低位）。',
    psy: '最后一波恐慌性抛售。',
    use: '需要次日收高于吞没阴线的收盘确认。' });

  add({ id: 'rising-window', zh: '上升窗口', en: 'Rising Window (Gap Up)', al: 'chuangkou 向上跳空 缺口', type: 'cont', dir: 'bull', tier: 'S', rel: 4, freq: 1, book: 1,
    s: '今天的最低价高于昨天的最高价，中间留下一个空白“窗口”。',
    c: [[10, 13.5, 9.8, 13.2], [15, 18, 14.8, 17.5]],
    rec: '上涨中，第二根K线的最低点高于第一根K线的最高点，中间出现价格空白（西方叫缺口 gap）。',
    psy: '买方急不可耐，直接跳过一段价格成交。日本人说“行情会回到窗口”，但窗口应该起到支撑作用。',
    use: 'Nison 最重视的持续信号之一：窗口区域是支撑位。回调到窗口不跌破＝继续看多；收盘跌破整个窗口＝上涨失效。' });

  add({ id: 'falling-window', zh: '下降窗口', en: 'Falling Window (Gap Down)', al: 'chuangkou 向下跳空 缺口', type: 'cont', dir: 'bear', tier: 'S', rel: 4, freq: 1, book: 1,
    s: '今天的最高价低于昨天的最低价，中间留下一个空白“窗口”。',
    c: [[14, 14.2, 10.5, 10.8], [9, 9.2, 5.5, 6]],
    rec: '下跌中，第二根K线的最高点低于第一根K线的最低点。',
    psy: '卖方急于出场，跳过一段价格成交。',
    use: '窗口区域是阻力位。反弹到窗口受阻＝继续看空；收盘站上整个窗口＝下跌失效。' });

  add({ id: 'gap-up-doji', zh: '向上跳空十字线', en: 'Gapping Up Doji', al: 'tiaokong shizi', type: 'ind', dir: 'neu', tier: 'C', rel: 2, freq: 2, book: 0, ctx: 'up',
    s: '上涨中跳空出现一根十字线——涨得急了，开始犹豫。',
    c: [[10, 13.5, 9.8, 13.2], [15, 15.6, 14.5, 15]],
    rec: '上涨中向上跳空，第二根是十字线。',
    psy: '跳空显示乐观，但十字线显示犹豫。',
    use: '单独意义有限，要看后续K线的方向。' });

  add({ id: 'gap-down-doji', zh: '向下跳空十字线', en: 'Gapping Down Doji', al: 'tiaokong shizi', type: 'ind', dir: 'neu', tier: 'C', rel: 2, freq: 2, book: 0, ctx: 'down',
    s: '下跌中跳空出现一根十字线——跌得急了，开始犹豫。',
    c: [[14, 14.2, 10.5, 10.8], [9, 9.6, 8.4, 9]],
    rec: '下跌中向下跳空，第二根是十字线。',
    psy: '恐慌中的犹豫。',
    use: '更多表现为下跌持续；配合下一根阳线可视为止跌。' });

  add({ id: 'bull-hikkake', zh: '看涨陷阱（Hikkake）', en: 'Bullish Hikkake', al: 'xianjing 假突破 inside bar', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 2, book: 0, ctx: 'side',
    s: '先假装向下突破，把空头骗进来，然后反向上涨。',
    c: [[8, 12.5, 6, 9], [9.2, 11, 7, 10], [9.8, 10.2, 6.5, 7], [7.2, 10.6, 7, 10.4], [10.4, 13.2, 10.2, 13]],
    rec: '①一根孕线（内包K线）；②随后一根K线跌破内包线的最低点（看似向下突破）；③几根K线之内价格反向突破内包线的最高点。',
    psy: '假突破把止损和追空的人骗出来，然后真实方向显现。',
    use: '突破内包线高点时入场，止损在假突破的最低点。现代交易者（Dan Chesler）总结的形态，非原书内容。' });

  add({ id: 'bear-hikkake', zh: '看跌陷阱（Hikkake）', en: 'Bearish Hikkake', al: 'xianjing 假突破', type: 'rev', dir: 'bear', tier: 'C', rel: 3, freq: 2, book: 0, ctx: 'side',
    s: '先假装向上突破，把多头骗进来，然后反向下跌。',
    c: [[12, 14, 7.5, 11], [10.8, 13, 9, 10], [10.2, 13.5, 9.8, 13], [12.8, 13, 9.4, 9.6], [9.6, 9.8, 6.8, 7]],
    rec: '①一根内包K线；②随后向上突破内包线高点；③几根之内价格反向跌破内包线低点。',
    psy: '假突破引诱追高者，然后掉头。',
    use: '跌破内包线低点时做空/离场，止损在假突破高点。' });
})();

/* ═════════════ 三根及多根K线 ═════════════ */
(function () {
  const add = window.__candleAdd, rising = window.__candleRising;

  add({ id: 'morning-star', zh: '启明星', en: 'Morning Star', al: 'qimingxing 早晨之星 晨星', type: 'rev', dir: 'bull', tier: 'S', rel: 5, freq: 2, book: 1,
    s: '大阴线 → 小K线（星） → 大阳线。黑夜过去，启明星升起。',
    c: [[12, 12.2, 6, 6.3], [5, 5.7, 4, 5.4], [6.3, 11, 6.1, 10.8]],
    rec: '①下跌趋势；②长阴线；③向下跳空的小实体（星线，阴阳均可）；④长阳线，收盘深入第一根阴线实体（最好超过一半）。',
    psy: '阴线：空方掌控；星线：空方没力气了，多空平衡；阳线：多方接管。一步步看到权力交接。',
    use: '最可靠的底部形态之一。星线与两侧实体之间都有缺口时更强；第三根成交量放大更好。止损放在星线最低点下方。' });

  add({ id: 'evening-star', zh: '黄昏星', en: 'Evening Star', al: 'huanghunxing 暮星', type: 'rev', dir: 'bear', tier: 'S', rel: 5, freq: 2, book: 1,
    s: '大阳线 → 小K线（星） → 大阴线。太阳落山，黄昏星出现。',
    c: [[14, 20.2, 13.8, 20], [21, 22, 20.8, 21.4], [20.5, 20.7, 15.5, 15.8]],
    rec: '①上涨趋势；②长阳线；③向上跳空的小实体星线；④长阴线，收盘深入第一根阳线实体。',
    psy: '阳线：多方强势；星线：涨不动了；阴线：空方接管。',
    use: '最可靠的顶部形态之一。星线最高点是阻力/止损位。第三根越长、深入越多，信号越强。' });

  add({ id: 'morning-doji-star', zh: '十字启明星', en: 'Morning Doji Star', al: 'shizi qimingxing', type: 'rev', dir: 'bull', tier: 'A', rel: 5, freq: 3, book: 1,
    s: '启明星的中间那根是十字线，反转信号更强。',
    c: [[12, 12.2, 6, 6.3], [5, 5.7, 4.3, 5], [6.3, 11, 6.1, 10.8]],
    rec: '同启明星，但中间是十字线。',
    psy: '十字线代表完全的犹豫，比普通星线更能说明空方动能衰竭。',
    use: '比普通启明星更强，但也更少见。' });

  add({ id: 'evening-doji-star', zh: '十字黄昏星', en: 'Evening Doji Star', al: 'shizi huanghunxing', type: 'rev', dir: 'bear', tier: 'A', rel: 5, freq: 3, book: 1,
    s: '黄昏星的中间那根是十字线，见顶信号更强。',
    c: [[14, 20.2, 13.8, 20], [21, 21.8, 20.6, 21], [20.5, 20.7, 15.5, 15.8]],
    rec: '同黄昏星，但中间是十字线。',
    psy: '在高位跳空后完全犹豫，然后被大阴线确认。',
    use: 'Nison 特别强调此形态在高位的重要性：即使第三根还没出现，看到高位十字星也应该先防守。' });

  add({ id: 'bull-abandoned-baby', zh: '看涨弃婴', en: 'Bullish Abandoned Baby', al: 'qiying 弃婴底', type: 'rev', dir: 'bull', tier: 'A', rel: 5, freq: 3, book: 1,
    s: '中间那根十字线被两边的缺口“隔离”，像被抛弃的婴儿。',
    c: [[12, 12.2, 6, 6.3], [4.5, 4.8, 4.2, 4.5], [6, 11, 5.8, 10.8]],
    rec: '十字启明星的极端版：中间十字线的影线与两边K线的影线都不重叠（上下都有缺口）。',
    psy: '空方最后一次跳空，随即被多方跳空反向“抛弃”。',
    use: '非常罕见，但可靠性极高。' });

  add({ id: 'bear-abandoned-baby', zh: '看跌弃婴', en: 'Bearish Abandoned Baby', al: 'qiying 弃婴顶', type: 'rev', dir: 'bear', tier: 'A', rel: 5, freq: 3, book: 1,
    s: '高位十字线左右两边都有缺口，像一座孤岛。',
    c: [[14, 20.2, 13.8, 20], [21.5, 21.8, 21.2, 21.5], [20.5, 20.7, 15.5, 15.8]],
    rec: '十字黄昏星的极端版：中间十字线与两边K线的影线都不重叠。西方称为“岛形反转”的一种。',
    psy: '高位的最后一批买家被“困在孤岛上”。',
    use: '罕见但可靠性极高。' });

  add({ id: 'three-white-soldiers', zh: '白色三兵（红三兵）', en: 'Three White Soldiers', al: 'sanbing hongsanbing 三个白武士 three advancing', type: 'rev', dir: 'bull', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '连续三根稳步上涨的阳线，像三个士兵齐步前进。',
    c: [[5, 7.6, 4.8, 7.3], [6.8, 9.9, 6.6, 9.6], [9.2, 12.3, 9, 12]],
    rec: '①出现在低位或横盘之后；②三根连续阳线，每根收盘都创新高；③每根开盘都在前一根实体之内；④每根都收在最高价附近（上影线短）。',
    psy: '多方连续三天稳步推进，买盘持续而健康。',
    use: '如果第二、三根的实体变小或上影线变长，就变成“前方受阻”或“停顿形态”——警示信号。在大涨后出现时注意超买。' });

  add({ id: 'three-black-crows', zh: '三只乌鸦', en: 'Three Black Crows', al: 'sanzhi wuya 三飞乌鸦', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '高位连续三根下跌的阴线，像三只乌鸦站在枝头——不祥之兆。',
    c: [[20, 20.2, 17.3, 17.5], [17.8, 18, 15, 15.2], [15.5, 15.7, 12.6, 12.8]],
    rec: '①上涨趋势或高位；②三根连续阴线，每根收盘创新低；③每根开盘都在前一根实体之内；④收盘接近最低价。',
    psy: '空方连续三天持续打压，高位持仓者在逃离。',
    use: '可靠的顶部信号。但如果已经跌了很多才出现，可能已经超卖，追空风险大。' });

  add({ id: 'identical-three-crows', zh: '三只相同乌鸦', en: 'Identical Three Crows', al: 'xiangtong wuya', type: 'rev', dir: 'bear', tier: 'C', rel: 4, freq: 3, book: 0,
    s: '三只乌鸦的加强版：每根阴线都从前一根的收盘价开盘。',
    c: [[20, 20.2, 17.3, 17.5], [17.5, 17.6, 15, 15.2], [15.2, 15.3, 12.6, 12.8]],
    rec: '同三只乌鸦，但第二、三根的开盘价恰好等于前一根收盘价。',
    psy: '没有任何反弹空间，抛压毫无喘息。',
    use: '罕见，看跌意义比普通三只乌鸦更强。' });

  add({ id: 'advance-block', zh: '前方受阻', en: 'Advance Block', al: 'qianfang shouzu 大敌当前', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'up',
    s: '三根阳线，但一根比一根小、上影线一根比一根长——涨不动了。',
    c: [[5, 8.2, 4.8, 8], [7.6, 10.6, 7.4, 9.6], [9.4, 12.6, 9.2, 10.2]],
    rec: '类似白色三兵，但第二、三根阳线实体逐渐缩小，上影线逐渐变长。',
    psy: '多方还在推，但每推一步都遇到更强的卖压。',
    use: '不是立即做空的信号，而是“多头应该减仓/保护利润”的信号。' });

  add({ id: 'deliberation', zh: '停顿形态', en: 'Deliberation / Stalled', al: 'tingdun 思考形态', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1, ctx: 'up',
    s: '两根大阳线后，第三根突然变成小阳线——多方开始“思考”了。',
    c: [[5, 8.2, 4.8, 8], [7.8, 11.2, 7.6, 11], [11.3, 12, 11.1, 11.8]],
    rec: '前两根是长阳线，第三根是小阳线（纺锤线），常常向上跳空或位于第二根的顶部。',
    psy: '上涨动力突然衰竭，市场停下来权衡。',
    use: '和前方受阻一样，是多头了结获利的时机，而不是做空的理由。' });

  add({ id: 'upside-gap-two-crows', zh: '向上跳空两只乌鸦', en: 'Upside-Gap Two Crows', al: 'tiaokong liangzhi wuya', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '大阳线后跳空出两根阴线，第二根阴线包住第一根。',
    c: [[14, 19.2, 13.8, 19], [21, 21.5, 20, 20.3], [21.3, 21.6, 19.3, 19.6]],
    rec: '①上涨趋势；②长阳线；③向上跳空的小阴线；④第二根阴线开盘高于前一根阴线开盘、收盘低于前一根阴线收盘（吞没它），但仍在第一根阳线收盘之上。',
    psy: '两次跳空高开都没守住，高位买盘明显乏力。',
    use: '若随后的K线收盘跌破第一根阳线的收盘价，看跌信号得到确认。' });

  add({ id: 'two-crows', zh: '两只乌鸦', en: 'Two Crows', al: 'liangzhi wuya', type: 'rev', dir: 'bear', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '和上一个类似，但第二根阴线一直跌进了大阳线实体里。',
    c: [[14, 19.2, 13.8, 19], [21, 21.5, 20, 20.3], [20.8, 21, 16.5, 16.8]],
    rec: '①上涨趋势；②长阳线；③向上跳空的阴线；④第三根阴线开盘在第二根实体之内，收盘深入第一根阳线实体，填补缺口。',
    psy: '比向上跳空两只乌鸦更偏空。',
    use: '类似黄昏星。' });

  add({ id: 'three-inside-up', zh: '三内部上涨', en: 'Three Inside Up', al: 'san neibu shangzhang 孕线确认', type: 'rev', dir: 'bull', tier: 'A', rel: 4, freq: 2, book: 0,
    s: '看涨孕线 + 第三根阳线确认。',
    c: [[12, 12.3, 5, 5.5], [7.2, 8.8, 6.8, 8.5], [8.5, 13, 8.3, 12.8]],
    rec: '前两根组成看涨孕线，第三根阳线收盘高于第一根阴线的开盘价（或至少高于其中点）。',
    psy: '孕线说明下跌止住，第三根说明多方真正接管。',
    use: '这其实就是“孕线 + 确认”，比单独的孕线可靠得多。' });

  add({ id: 'three-inside-down', zh: '三内部下跌', en: 'Three Inside Down', al: 'san neibu xiadie', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 0,
    s: '看跌孕线 + 第三根阴线确认。',
    c: [[14, 20.2, 13.8, 20], [18.6, 19.2, 17, 17.4], [17.4, 17.6, 12.6, 13]],
    rec: '前两根组成看跌孕线，第三根阴线收盘低于第一根阳线的开盘价。',
    psy: '涨势先刹车，再被空方接管。',
    use: '是看跌孕线的确认版，可靠性明显提高。' });

  add({ id: 'three-outside-up', zh: '三外部上涨', en: 'Three Outside Up', al: 'san waibu 吞没确认', type: 'rev', dir: 'bull', tier: 'A', rel: 4, freq: 2, book: 0,
    s: '看涨吞没 + 第三根阳线继续走高。',
    c: [[8, 8.3, 5.6, 6], [5.5, 9.4, 5.2, 9.2], [9.2, 11.8, 9, 11.5]],
    rec: '前两根组成看涨吞没，第三根阳线收盘更高。',
    psy: '吞没后多方继续推进，确认反转。',
    use: '吞没形态的确认版。' });

  add({ id: 'three-outside-down', zh: '三外部下跌', en: 'Three Outside Down', al: 'san waibu', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 0,
    s: '看跌吞没 + 第三根阴线继续走低。',
    c: [[18, 20.2, 17.8, 20], [20.5, 20.8, 16.8, 17], [17, 17.2, 14.4, 14.6]],
    rec: '前两根组成看跌吞没，第三根阴线收盘更低。',
    psy: '吞没后空方继续推进，确认见顶。',
    use: '看跌吞没的确认版。' });

  add({ id: 'three-stars-south', zh: '南方三星', en: 'Three Stars in the South', al: 'nanfang sanxing', type: 'rev', dir: 'bull', tier: 'D', rel: 3, freq: 3, book: 0,
    s: '三根阴线越来越小、下影线越来越短——卖压在消退。',
    c: [[14, 14.2, 7, 10], [11, 11.2, 8, 9.2], [9, 9, 8.6, 8.6]],
    rec: '①下跌趋势；②长阴线带长下影线；③更小的阴线，最低点高于第一根；④一根很小的光头光脚阴线，在第二根的范围内。',
    psy: '下跌在一步步失去动能。',
    use: '极其罕见，实战中很难遇到。' });

  add({ id: 'unique-three-river', zh: '奇特三河床', en: 'Unique Three River Bottom', al: 'qite sanhechuang', type: 'rev', dir: 'bull', tier: 'D', rel: 3, freq: 3, book: 0,
    s: '长阴线 → 创新低的锤子状阴线 → 一根更低的小阳线。',
    c: [[14, 14.2, 8, 8.3], [10, 10.2, 5, 8.6], [7.5, 8.3, 7.3, 8.1]],
    rec: '①长阴线；②阴线孕线，但创出新低（长下影线）；③小阳线，收盘低于第二根的收盘。',
    psy: '新低被迅速拉回，卖压衰竭。',
    use: '非常罕见，可靠性中等。' });

  add({ id: 'stick-sandwich', zh: '条形三明治', en: 'Stick Sandwich', al: 'sanmingzhi', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '阴—阳—阴，两根阴线收在同一价位，像夹着一片面包。',
    c: [[10, 10.2, 6, 6.2], [7, 9.8, 6.8, 9.5], [10, 10.3, 6, 6.2]],
    rec: '①下跌趋势；②阴线；③阳线，收盘高于第一根收盘；④阴线，收盘与第一根收盘相同。',
    psy: '两次收在同一价位，形成支撑。',
    use: '可看作“相同低价”的变体，需确认。' });

  add({ id: 'ladder-bottom', zh: '梯底', en: 'Ladder Bottom', al: 'tidi', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '连续阴线像下楼梯，最后一根跳空阳线结束下跌。',
    c: [[14, 14.2, 11, 11.2], [11, 11.2, 8.5, 8.7], [8.6, 8.8, 6.2, 6.4], [6.3, 7.8, 5.2, 5.4], [6.5, 10, 6.4, 9.8]],
    rec: '①三根依次走低的阴线；②第四根阴线带明显上影线；③第五根阳线开盘高于第四根实体（跳空），收盘更高。',
    psy: '第四根的上影线是多方首次试探，第五根完成反转。',
    use: '罕见，可靠性中等。' });

  add({ id: 'concealing-baby-swallow', zh: '藏婴吞没', en: 'Concealing Baby Swallow', al: 'cangying tunmo', type: 'rev', dir: 'bull', tier: 'D', rel: 3, freq: 3, book: 0,
    s: '四根阴线，最后一根把前一根（包括影线）完全吞没——卖压耗尽。',
    c: [[14, 14, 10, 10], [9.5, 9.5, 6, 6], [5, 8, 4.6, 4.8], [8.5, 8.6, 3.5, 3.8]],
    rec: '①两根光头光脚阴线；②向下跳空的阴线，带长上影线伸入前一根实体；③第四根阴线完全吞没第三根（含影线）。',
    psy: '空方最后的疯狂抛售。',
    use: '极其罕见，教科书形态，实战意义有限。' });

  add({ id: 'bull-three-line-strike', zh: '看涨三线打击', en: 'Bullish Three-Line Strike', al: 'sanxian daji', type: 'cont', dir: 'bull', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '三根阳线上涨，然后一根大阴线把三天涨幅全部吃掉。',
    c: [[5, 7.6, 4.8, 7.3], [7, 9.9, 6.8, 9.6], [9.3, 12.3, 9.1, 12], [12.5, 12.8, 4.4, 4.6]],
    rec: '①上涨趋势中三根白色三兵；②第四根阴线高开，收盘低于第一根阳线的开盘价。',
    psy: '理论上是获利回吐后的上涨持续。',
    use: '注意：Bulkowski 统计发现它实际上更常作为看跌反转出现，名称和实际表现相反，使用时以价格突破方向为准。' });

  add({ id: 'bear-three-line-strike', zh: '看跌三线打击', en: 'Bearish Three-Line Strike', al: 'sanxian daji', type: 'cont', dir: 'bear', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '三根阴线下跌，然后一根大阳线把三天跌幅全部收回。',
    c: [[20, 20.2, 17.3, 17.5], [17.8, 18, 15, 15.2], [15.5, 15.7, 12.6, 12.8], [12.2, 20.6, 12, 20.4]],
    rec: '①下跌趋势中三只乌鸦；②第四根阳线低开，收盘高于第一根阴线的开盘价。',
    psy: '理论上是空头回补后的下跌持续。',
    use: '与看涨版一样，Bulkowski 发现它更常作为看涨反转出现。' });

  add({ id: 'two-black-gapping', zh: '两根跳空阴线', en: 'Two Black Gapping Candles', al: 'tiaokong yinxian', type: 'cont', dir: 'bear', tier: 'C', rel: 3, freq: 2, book: 0,
    s: '下跌中向下跳空，接着两根阴线继续走低。',
    c: [[12, 12.3, 9, 9.2], [7, 7.3, 5.2, 5.4], [5.2, 5.4, 3, 3.2]],
    rec: '①下跌趋势；②向下跳空；③跳空后连续两根阴线，第二根收盘更低。',
    psy: '跳空后卖压延续，没有回补缺口的力量。',
    use: '下跌持续信号，缺口是阻力。' });

  add({ id: 'bull-tri-star', zh: '看涨三星', en: 'Bullish Tri-Star', al: 'sanxing 三颗星', type: 'rev', dir: 'bull', tier: 'C', rel: 4, freq: 3, book: 1,
    s: '连续三根十字线，中间那根位置最低。',
    c: [[6, 6.6, 5.4, 6], [4.2, 4.8, 3.6, 4.2], [6, 6.6, 5.4, 6]],
    rec: '①下跌趋势；②三根连续十字线；③中间的十字线向下跳空，第三根向上跳空。',
    psy: '连续三天完全犹豫，下跌动能耗尽。',
    use: 'Nison 介绍的罕见但重要形态。出现在日线以上级别更有意义。' });

  add({ id: 'bear-tri-star', zh: '看跌三星', en: 'Bearish Tri-Star', al: 'sanxing', type: 'rev', dir: 'bear', tier: 'C', rel: 4, freq: 3, book: 1,
    s: '连续三根十字线，中间那根位置最高。',
    c: [[20, 20.6, 19.4, 20], [21.8, 22.4, 21.2, 21.8], [20, 20.6, 19.4, 20]],
    rec: '①上涨趋势；②三根连续十字线；③中间的十字线向上跳空，第三根向下跳空。',
    psy: '高位持续犹豫，形成小型“岛形顶”。',
    use: '罕见；出现时应保护多头利润。' });

  add({ id: 'rising-three', zh: '上升三法', en: 'Rising Three Methods', al: 'shangsheng sanfa 上升三部曲', type: 'cont', dir: 'bull', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '大阳线 → 三根小阴线在它范围内休息 → 再一根大阳线创新高。',
    c: [[5, 11.2, 4.8, 11], [10.5, 10.8, 9, 9.2], [9.3, 9.8, 8, 8.4], [8.5, 9, 7.2, 7.6], [7.8, 13.5, 7.6, 13.2]],
    rec: '①上涨趋势；②长阳线；③2–4 根小K线（通常是阴线）小幅回调，都在第一根阳线的高低范围之内；④最后一根长阳线收盘创新高。',
    psy: '上涨中的“休息”。小阴线回调无力，没有跌破第一根阳线低点，多方随后再次发力。',
    use: '经典的上涨中继形态。中间小K线跌破第一根阳线低点则形态失败。' });

  add({ id: 'falling-three', zh: '下降三法', en: 'Falling Three Methods', al: 'xiajiang sanfa 下降三部曲', type: 'cont', dir: 'bear', tier: 'A', rel: 4, freq: 2, book: 1,
    s: '大阴线 → 三根小阳线在它范围内反弹 → 再一根大阴线创新低。',
    c: [[16, 16.2, 9.8, 10], [10.5, 12, 10.2, 11.8], [11.7, 13, 11.2, 12.6], [12.5, 13.8, 12, 13.4], [13.2, 13.4, 7.5, 7.8]],
    rec: '①下跌趋势；②长阴线；③2–4 根小阳线反弹，都在第一根阴线的范围之内；④最后一根长阴线收盘创新低。',
    psy: '下跌中的“喘气”，反弹无力，空方再次发力。',
    use: '经典下跌中继。反弹不能站上第一根阴线高点，就不要抄底。' });

  add({ id: 'mat-hold', zh: '铺垫形态', en: 'Mat Hold', al: 'pudian', type: 'cont', dir: 'bull', tier: 'C', rel: 4, freq: 3, book: 1,
    s: '上升三法的变体：大阳线后先跳空，再小幅回调，然后继续上涨。',
    c: [[5, 11.2, 4.8, 11], [12.5, 13, 11.8, 12], [12, 12.3, 11, 11.3], [11.3, 11.6, 10.4, 10.8], [11, 14.5, 10.8, 14.3]],
    rec: '①长阳线；②向上跳空的小阴线；③再两根小K线回落，但仍在第一根阳线收盘附近之上；④长阳线创新高。',
    psy: '回调幅度比上升三法更浅，多方更强。',
    use: 'Nison 书中有提及，Bulkowski 统计其持续性较好但很少见。' });

  add({ id: 'upside-tasuki', zh: '向上跳空 Tasuki', en: 'Upside Tasuki Gap', al: 'tasuki 向上跳空并列阴阳线 跳空挽袖', type: 'cont', dir: 'bull', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '跳空上涨后，一根阴线回调，但没有填补缺口——继续涨。',
    c: [[8, 11.2, 7.8, 11], [12.5, 15.2, 12.3, 15], [14.2, 14.4, 11.8, 12]],
    rec: '①上涨趋势；②向上跳空的阳线；③阴线开盘在阳线实体内，收盘进入缺口，但没有完全填补缺口。',
    psy: 'tasuki 是绑和服袖子的带子。回调没能关上窗口，说明窗口支撑有效。',
    use: '如果缺口被完全填补，形态失效。' });

  add({ id: 'downside-tasuki', zh: '向下跳空 Tasuki', en: 'Downside Tasuki Gap', al: 'tasuki 向下跳空并列阴阳线', type: 'cont', dir: 'bear', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '跳空下跌后，一根阳线反弹，但没有填补缺口——继续跌。',
    c: [[14, 14.2, 10.8, 11], [9.5, 9.7, 6.8, 7], [7.5, 10.2, 7.3, 10]],
    rec: '①下跌趋势；②向下跳空的阴线；③阳线开盘在阴线实体内，收盘进入缺口但没有完全填补。',
    psy: '反弹没能关上下降窗口，空方仍然控制。',
    use: '缺口被完全回补则形态失效。' });

  add({ id: 'upside-gap-side-by-side', zh: '向上跳空并列阳线', en: 'Upside Gap Side-by-Side White Lines', al: 'bingle yangxian 并排阳线', type: 'cont', dir: 'bull', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '跳空上涨后，两根差不多大小、开盘价也差不多的阳线并排站着。',
    c: [[8, 11.2, 7.8, 11], [12.5, 15, 12.3, 14.8], [12.6, 14.8, 12.4, 14.6]],
    rec: '①上涨中向上跳空；②跳空后两根阳线，大小相近，开盘价也相近（并排）。',
    psy: '窗口之上多方连续两天站稳，缺口支撑有效。',
    use: '上涨持续信号，窗口是支撑。' });

  add({ id: 'downside-gap-side-by-side', zh: '向下跳空并列阳线', en: 'Downside Gap Side-by-Side White Lines', al: 'bingle yangxian', type: 'cont', dir: 'bear', tier: 'C', rel: 2, freq: 3, book: 1,
    s: '跳空下跌后出现两根并排阳线，但反弹没能填补缺口——继续跌。',
    c: [[14, 14.2, 10.8, 11], [7.5, 9.6, 7.3, 9.4], [7.6, 9.5, 7.4, 9.3]],
    rec: '①下跌中向下跳空；②跳空后两根并排阳线，没有回补缺口。',
    psy: '阳线可能只是空头回补，不是真正的买盘。',
    use: 'Nison 指出这个形态罕见，且阳线容易误导。下降窗口仍是阻力。' });

  add({ id: 'upside-gap-three', zh: '向上跳空三法', en: 'Upside Gap Three Methods', al: 'tiaokong sanfa', type: 'cont', dir: 'bull', tier: 'C', rel: 2, freq: 3, book: 1,
    s: '两根跳空阳线后，一根阴线把缺口补上——仍算上涨中继。',
    c: [[8, 11.2, 7.8, 11], [12, 15, 11.8, 14.8], [14.5, 14.6, 10.4, 10.6]],
    rec: '①上涨中两根阳线之间有跳空；②第三根阴线开盘在第二根实体内，收盘在第一根实体内，填补缺口。',
    psy: '回补缺口后多方可能再发力。',
    use: '要谨慎：缺口被回补后，窗口原本的支撑作用已经消失。' });

  add({ id: 'downside-gap-three', zh: '向下跳空三法', en: 'Downside Gap Three Methods', al: 'tiaokong sanfa', type: 'cont', dir: 'bear', tier: 'C', rel: 2, freq: 3, book: 1,
    s: '两根跳空阴线后，一根阳线把缺口补上——仍算下跌中继。',
    c: [[14, 14.2, 10.8, 11], [9.8, 10, 7, 7.2], [7.4, 11.8, 7.2, 11.6]],
    rec: '①下跌中两根阴线之间有跳空；②第三根阳线收盘在第一根实体内，填补缺口。',
    psy: '空头回补，下跌可能继续。',
    use: '可靠性一般。' });

  add({ id: 'bull-breakaway', zh: '看涨脱离形态', en: 'Bullish Breakaway', al: 'tuoli', type: 'rev', dir: 'bull', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '跳空下跌后又磨了几天，然后一根大阳线涨回到缺口里。',
    c: [[14, 14.2, 10.5, 10.7], [9.5, 9.7, 8.3, 8.5], [8.6, 8.9, 7.6, 7.8], [7.7, 8, 6.6, 6.8], [6.9, 10.3, 6.7, 10.1]],
    rec: '①长阴线；②向下跳空的阴线；③再两根小K线继续走低；④长阳线收盘进入第一、二根之间的缺口。',
    psy: '加速下跌后突然反转，空方后继乏力。',
    use: '较罕见。' });

  add({ id: 'bear-breakaway', zh: '看跌脱离形态', en: 'Bearish Breakaway', al: 'tuoli', type: 'rev', dir: 'bear', tier: 'C', rel: 3, freq: 3, book: 0,
    s: '跳空上涨后又磨了几天，然后一根大阴线跌回到缺口里。',
    c: [[10, 13.5, 9.8, 13.3], [14.5, 15.7, 14.3, 15.5], [15.4, 16.4, 15.1, 16.2], [16.3, 17.4, 16, 17.2], [17.1, 17.3, 13.7, 13.9]],
    rec: '①长阳线；②向上跳空的阳线；③再两根小K线继续走高；④长阴线收盘进入缺口。',
    psy: '加速上涨后突然反转。',
    use: '较罕见。' });

  add({ id: 'tower-top', zh: '塔形顶部', en: 'Tower Top', al: 'taxing dingbu', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '一根大阳线（塔的左边）→ 几根小K线 → 一根大阴线（塔的右边）。',
    c: [[8, 14.2, 7.8, 14], [14, 15, 13.5, 14.6], [14.5, 15.2, 14, 14.3], [14.4, 15, 13.8, 14.5], [14.3, 14.5, 8.2, 8.5]],
    rec: '①上涨中一根长阳线；②之后几根小K线在高位横盘；③一根长阴线下跌。两侧的长K线像两座塔。',
    psy: '多方的猛攻转为犹豫，最后被空方的猛攻取代。',
    use: '和黄昏星相似但时间更长。中间小K线横盘越久，后续反转越可能持久。' });

  add({ id: 'tower-bottom', zh: '塔形底部', en: 'Tower Bottom', al: 'taxing dibu', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '一根大阴线 → 几根小K线 → 一根大阳线，像两座倒立的塔。',
    c: [[14, 14.2, 8, 8.3], [8.3, 9, 7.5, 8.6], [8.6, 9.1, 7.7, 8], [8, 8.8, 7.6, 8.4], [8.4, 14.2, 8.2, 14]],
    rec: '①下跌中长阴线；②几根小K线低位横盘；③长阳线上涨。',
    psy: '空方猛攻转为犹豫，最后多方猛攻。',
    use: '和启明星相似但耗时更长。' });

  add({ id: 'dumpling-top', zh: '圆形顶部（饺子顶）', en: 'Dumpling Top', al: 'yuanding jiaozi 圆顶', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '一串小K线画出一个圆弧顶，最后跳空下跌确认。',
    c: [[10, 10.8, 9.8, 10.6], [10.6, 11.5, 10.4, 11.2], [11.2, 11.8, 11, 11.6], [11.6, 12, 11.3, 11.5], [11.5, 11.7, 11, 11.1], [11, 11.2, 10.4, 10.5], [9.2, 9.4, 7, 7.2]],
    rec: '①上涨后小实体K线构成凸起的圆弧；②随后出现下降窗口（向下跳空）作为确认。',
    psy: '上涨在不知不觉中失去动能，最后一个跳空宣告结束。',
    use: '与西方的“圆形顶”相同。等待下降窗口出现再确认。' });

  add({ id: 'fry-pan-bottom', zh: '平底锅底部', en: 'Fry Pan Bottom', al: 'pingdiguo 煎锅底 圆底', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '一串小K线画出一个圆弧底（像锅底），最后跳空上涨确认。',
    c: [[10, 10.2, 9.2, 9.4], [9.4, 9.6, 8.6, 8.8], [8.8, 9, 8.4, 8.5], [8.5, 8.9, 8.3, 8.7], [8.7, 9.3, 8.6, 9.2], [9.2, 9.8, 9.1, 9.7], [11, 13.2, 10.8, 13]],
    rec: '①下跌后小实体K线构成下凹的圆弧；②随后出现上升窗口（向上跳空）。',
    psy: '卖压慢慢消失，买盘悄悄进场，最后一个跳空确认。',
    use: '与西方的“圆形底”相同。上升窗口是支撑。' });

  add({ id: 'high-price-gapping', zh: '高价位跳空突破', en: 'High-Price Gapping Play', al: 'gaojiawei tiaokong', type: 'cont', dir: 'bull', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '大涨后在高位横盘几天，然后跳空向上突破。',
    c: [[5, 11, 4.8, 10.8], [10.6, 11.2, 10, 10.4], [10.4, 11, 9.9, 10.7], [10.6, 11.1, 10.1, 10.3], [12, 15, 11.8, 14.8]],
    rec: '①快速上涨后；②一组小K线在高位附近整理（不回落）；③向上跳空突破整理区。',
    psy: '高位整理却不回落，说明多方很强；跳空突破宣告新一轮上涨。',
    use: '窗口是支撑。' });

  add({ id: 'low-price-gapping', zh: '低价位跳空突破', en: 'Low-Price Gapping Play', al: 'dijiawei tiaokong', type: 'cont', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '大跌后在低位横盘几天，然后跳空向下跌破。',
    c: [[15, 15.2, 9.2, 9.5], [9.5, 10, 9, 9.7], [9.7, 10.1, 9.2, 9.4], [9.4, 9.9, 9, 9.6], [8, 8.2, 5, 5.3]],
    rec: '①快速下跌后；②一组小K线在低位整理；③向下跳空跌破整理区。',
    psy: '整理是“假企稳”，跳空跌破说明空方仍控制局面。',
    use: '下降窗口是阻力。' });

  add({ id: 'three-gaps-up', zh: '三空（向上）', en: 'Three Gaps Up (Sanku)', al: 'sankong 三空 衰竭缺口', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '连续三次向上跳空——涨得太急，多半要回落。',
    c: [[5, 7, 4.8, 6.8], [7.5, 9.5, 7.3, 9.3], [10, 12, 9.8, 11.8], [12.5, 14.5, 12.3, 14.3]],
    rec: '上涨中连续出现三个上升窗口。',
    psy: '日本谚语：“三空之后要卖出”。买盘已经透支，属于西方的“衰竭缺口”。',
    use: '第三个窗口出现后减仓/了结，不要追高。' });

  add({ id: 'three-gaps-down', zh: '三空（向下）', en: 'Three Gaps Down', al: 'sankong 三空', type: 'rev', dir: 'bull', tier: 'B', rel: 3, freq: 3, book: 1,
    s: '连续三次向下跳空——跌得太急，可能超卖反弹。',
    c: [[14, 14.2, 12, 12.2], [11.5, 11.7, 9.6, 9.8], [9.1, 9.3, 7.2, 7.4], [6.7, 6.9, 4.8, 5]],
    rec: '下跌中连续出现三个下降窗口。',
    psy: '恐慌抛售已经过度，空头应该回补。',
    use: '空头了结的信号，不一定是做多信号。' });

  add({ id: 'new-price-lines', zh: '八新价线 / 十新价线', en: 'Eight to Ten New Price Lines', al: 'xinjiaxian 新高 新价', type: 'rev', dir: 'bear', tier: 'B', rel: 3, freq: 2, book: 1,
    s: '连续创出八到十个新高——涨得太多了，该获利了结。',
    c: rising(9, 5, 1.2),
    rec: '连续 8–10 根K线收盘创出新高（不一定都是阳线）。',
    psy: '日本交易者认为连续 8–10 个新高后市场已经超买，“新价线”数满就该落袋为安。',
    use: '相当于K线版的超买指标。数到 10 个新高时，应该减仓或收紧止损；下跌时连续 8–10 个新低同理，可考虑回补空单。' });
})();

/* ═════════════ 三尊/三山/三川（长期形态，用路径绘制） ═════════════ */
(function () {
  const add = window.__candleAdd;

  add({ id: 'three-buddha-top', zh: '三尊顶部（头肩顶）', en: 'Three Buddha Top (Head & Shoulders)', al: 'sanzun toujianding 头肩顶', type: 'rev', dir: 'bear', tier: 'S', rel: 5, freq: 2, book: 1,
    s: '三个高点，中间最高——像佛殿里中间大、两边小的三尊佛像。',
    path: [2, 11, 7.5, 15, 8, 11.5, 3.5], k: 3,
    lines: [[2, 7.5, 6, 8.5, 'n', '颈线']], labs: [[1, 11, '左肩'], [3, 15, '头'], [5, 11.5, '右肩']],
    rec: '①上涨后形成三个高点，中间（头）最高，两侧（肩）较低；②两个低点连成“颈线”；③收盘跌破颈线确认。',
    psy: '第三个高点（右肩）没能再创新高，说明多方力量枯竭。',
    use: '日本的“三尊”与西方“头肩顶”完全对应，是最可靠的顶部形态之一。跌破颈线后常有回抽，颈线由支撑变阻力。目标价约为头部到颈线的距离。' });

  add({ id: 'inverse-three-buddha', zh: '倒三尊底部（头肩底）', en: 'Inverted Three Buddha (Inverse H&S)', al: 'daosanzun toujiandi 头肩底', type: 'rev', dir: 'bull', tier: 'S', rel: 5, freq: 2, book: 1,
    s: '三个低点，中间最低——三尊顶倒过来。',
    path: [18, 9, 12.5, 5, 12, 8.5, 16.5], k: 3,
    lines: [[2, 12.5, 6, 11.5, 'n', '颈线']], labs: [[1, 9, '左肩'], [3, 5, '头'], [5, 8.5, '右肩']],
    rec: '①下跌后形成三个低点，中间最低；②两个高点连成颈线；③收盘突破颈线确认。',
    psy: '右肩低点没有再创新低，说明空方力量枯竭。',
    use: '对应西方“头肩底”。突破颈线后，颈线变支撑。' });

  add({ id: 'three-mountains', zh: '三山顶部', en: 'Three Mountain Top', al: 'sanshan 三重顶', type: 'rev', dir: 'bear', tier: 'A', rel: 4, freq: 3, book: 1,
    s: '三次冲到同一个高度都失败——像三座一样高的山。',
    path: [2, 14, 9, 14.3, 9.5, 14.1, 4], k: 4,
    hl: [[14.6, 'r', '阻力'], [9, 'n', '支撑']],
    rec: '①价格三次上冲到大致相同的高点；②每次都回落；③最后跌破中间的低点确认。',
    psy: '三次都无法突破，说明该价位卖压沉重。',
    use: '对应西方“三重顶”。如果第三座山上同时出现看跌K线形态（如流星线、黄昏星），信号更强。' });

  add({ id: 'three-rivers', zh: '三川底部', en: 'Three River Bottom', al: 'sanchuan 三重底', type: 'rev', dir: 'bull', tier: 'A', rel: 4, freq: 3, book: 1,
    s: '三次跌到同一个低点都被托住——像三条一样深的河。',
    path: [18, 6, 11, 5.8, 10.5, 6, 16], k: 4,
    hl: [[5.4, 's', '支撑'], [11, 'n', '阻力']],
    rec: '①价格三次下探到大致相同的低点；②每次都反弹；③最后突破中间的高点确认。',
    psy: '三次都跌不下去，该价位买盘坚实。',
    use: '对应西方“三重底”。' });
})();

/* ═════════════ 趋势与西方技术配合 ═════════════ */
(function () {
  const add = window.__candleAdd;
  const T = (o) => add(Object.assign({ type: 'trend', book: 1, freq: 1 }, o));

  T({ id: 'uptrend', zh: '上升趋势', en: 'Uptrend', al: 'shangsheng qushi 上涨趋势 多头', dir: 'bull', tier: 'S', rel: 5,
    s: '高点越来越高，低点也越来越高。',
    path: [2, 8, 5, 12, 9, 16, 13, 20], k: 3,
    lines: [[0, 1, 7, 15, 's', '上升趋势线']],
    rec: '一连串“更高的高点 + 更高的低点”。把两个以上的低点连成线就是上升趋势线。',
    psy: '每次回调都有人愿意以更高的价格买入，需求持续大于供给。',
    use: '判断K线形态的第一步就是看趋势：看涨反转形态需要出现在下跌之后，看跌反转形态需要出现在上涨之后。在上升趋势中，看涨形态（如回调到趋势线的锤子线）成功率更高。' });

  T({ id: 'downtrend', zh: '下降趋势', en: 'Downtrend', al: 'xiajiang qushi 下跌趋势 空头', dir: 'bear', tier: 'S', rel: 5,
    s: '高点越来越低，低点也越来越低。',
    path: [20, 14, 17, 10, 13, 6, 9, 2], k: 3,
    lines: [[0, 21, 7, 7, 'r', '下降趋势线']],
    rec: '一连串“更低的高点 + 更低的低点”。把两个以上的高点连成线就是下降趋势线。',
    psy: '每次反弹都有人愿意以更低的价格卖出。',
    use: '下降趋势中不轻易抄底；反弹到下降趋势线附近出现看跌形态（如流星线、乌云盖顶），是顺势做空/减仓的位置。' });

  T({ id: 'sideways', zh: '横盘震荡（箱体）', en: 'Sideways / Trading Range', al: 'hengpan zhendang xiangti 区间 盘整', dir: 'neu', tier: 'S', rel: 4,
    s: '价格在一个上沿和下沿之间来回走，没有方向。',
    path: [10, 16, 10.5, 15.8, 10, 16.2, 10.4, 15.6, 13], k: 4,
    hl: [[16.6, 'r', '阻力（上沿）'], [9.6, 's', '支撑（下沿）']],
    rec: '高点大致相同、低点大致相同，价格在一个水平通道内反复波动。',
    psy: '多空力量平衡，市场在等待新的信息。',
    use: '箱体中间出现的K线形态没有意义（如中间的十字线）；只有在上沿出现看跌形态、或在下沿出现看涨形态时才值得重视。有效突破箱体后，原上沿/下沿会转换角色。' });

  T({ id: 'support-resistance', zh: '支撑线与阻力线', en: 'Support & Resistance', al: 'zhicheng zuli', dir: 'neu', tier: 'S', rel: 5,
    s: '支撑＝跌到这里容易止跌；阻力＝涨到这里容易受阻。',
    path: [6, 13, 8, 13.2, 8.2, 12.8, 8, 11], k: 3,
    hl: [[13.6, 'r', '阻力'], [7.6, 's', '支撑']],
    rec: '支撑是价格多次止跌的位置（需求集中）；阻力是价格多次受阻回落的位置（供给集中）。',
    psy: '人们会记住过去的价格：在支撑位买过的人愿意再买，在阻力位被套的人想解套卖出。',
    use: 'Nison 的核心观点：K线形态 + 支撑/阻力 = 高胜率。在阻力位出现的流星线，远比在半山腰出现的流星线重要。' });

  T({ id: 'trendline-break', zh: '趋势线突破', en: 'Trendline Break', al: 'qushixian tupo 跌破趋势线', dir: 'bear', tier: 'A', rel: 4,
    s: '价格收盘跌破上升趋势线，上涨趋势可能结束。',
    path: [2, 8, 5, 12, 9, 15, 12, 13.5, 8, 9.5, 5], k: 3,
    lines: [[0, 1, 9, 19, 's', '上升趋势线']],
    rec: '上升趋势中，收盘价明确跌破由低点连成的趋势线（下降趋势中则是收盘突破下降趋势线）。',
    psy: '买方不再愿意在“更高的低点”接盘，趋势结构被破坏。',
    use: '跌破趋势线不一定立即反转为下跌，可能先转为横盘。突破时若同时出现看跌吞没、乌云盖顶等形态，信号更强。' });

  T({ id: 'polarity', zh: '极性转换原则', en: 'Change of Polarity', al: 'jixing zhuanhuan 支撑阻力互换 角色互换', dir: 'bull', tier: 'S', rel: 4,
    s: '旧的阻力被突破后变成新的支撑（反之亦然）。',
    path: [6, 12.8, 8.5, 13.2, 9, 16.5, 13.4, 19, 15, 21], k: 3,
    hl: [[13.2, 'n', '阻力 → 支撑']],
    rec: '一个价位被有效突破后，它的角色互换：阻力变支撑，支撑变阻力。',
    psy: '之前在阻力位卖出的人看到价格突破后会后悔，回调到原价位时愿意买回。',
    use: 'Nison 书中专门讲解的原则。回调到旧阻力（新支撑）出现锤子线、看涨吞没等形态，是很好的买点。' });

  T({ id: 'retracement', zh: '百分比回撤（50%）', en: 'Percentage Retracements', al: 'huiche 黄金分割 斐波那契 38.2 61.8', dir: 'neu', tier: 'A', rel: 3,
    s: '涨了一大段后回调，经常回到涨幅的 38%、50% 或 62% 附近。',
    path: [2, 18, 10, 20], k: 4,
    hl: [[11.88, 'n', '38.2%'], [10, 'n', '50%'], [8.12, 'n', '61.8%']],
    rec: '量出一段行情的起点和终点，计算 38.2%、50%、61.8% 的回撤位置。',
    psy: '50% 回撤是最常见的“回吐一半”心理位置，东西方交易者都很重视。',
    use: '在回撤位出现看涨K线形态（锤子线、启明星等）是加仓或入场点。' });

  T({ id: 'golden-cross', zh: '移动平均线 · 金叉', en: 'Moving Average Golden Cross', al: 'junxian jincha MA 均线', dir: 'bull', tier: 'A', rel: 3,
    s: '短期均线从下方向上穿过长期均线。',
    path: [16, 10, 12, 7, 9, 11, 10, 15, 13, 18], k: 3, ma: [5, 10],
    rec: '短期移动平均线（如 5 日）向上穿越长期移动平均线（如 10 日 / 20 日）。',
    psy: '近期平均成本高于远期平均成本，买方开始占优。',
    use: '均线是滞后指标，适合确认趋势而非抓顶底。Nison 建议：K线形态出现在均线附近（如回踩均线的锤子线）更可靠。' });

  T({ id: 'death-cross', zh: '移动平均线 · 死叉', en: 'Moving Average Dead Cross', al: 'junxian sicha MA', dir: 'bear', tier: 'A', rel: 3,
    s: '短期均线从上方向下穿过长期均线。',
    path: [4, 10, 8, 13, 11, 9, 10, 5, 7, 2], k: 3, ma: [5, 10],
    rec: '短期移动平均线向下穿越长期移动平均线。',
    psy: '近期平均成本低于远期，卖方开始占优。',
    use: '确认下跌趋势；反弹到均线下方出现看跌K线形态是减仓点。横盘市中均线交叉会频繁失效。' });

  T({ id: 'rsi', zh: 'RSI 相对强弱指数 · 背离', en: 'RSI Divergence', al: 'xiangdui qiangruo beili 超买 超卖', dir: 'bear', tier: 'A', rel: 3,
    s: '价格创新高，但 RSI 没有创新高——上涨力气在变小。',
    path: [3, 6, 4.5, 15, 11.5, 16, 10], k: 4, panel: 'rsi', div: [3, 5],
    rec: 'RSI 在 0–100 之间波动，70 以上为超买、30 以下为超卖。价格创新高而 RSI 走低，叫“顶背离”；价格创新低而 RSI 走高，叫“底背离”。',
    psy: '价格还在涨，但上涨的“力度”在减弱。',
    use: '背离本身不是卖出信号，但如果同时出现黄昏星、看跌吞没等K线形态，可靠性大幅提高。' });

  T({ id: 'stochastic', zh: '随机指标（KD）', en: 'Stochastic Oscillator', al: 'suiji zhibiao KD KDJ', dir: 'neu', tier: 'B', rel: 3,
    s: '看收盘价在最近一段时间高低区间里的位置，>80 偏热，<20 偏冷。',
    path: [8, 16, 9, 15, 8.5, 16, 10], k: 3, panel: 'stoch',
    hl: [[16.4, 'r', ''], [8.2, 's', '']],
    rec: '%K = (收盘 − N日最低) / (N日最高 − N日最低) × 100；%D 是 %K 的均线。80 以上超买、20 以下超卖。',
    psy: '上涨时收盘倾向于靠近区间高位，下跌时靠近低位。',
    use: '在横盘震荡市中效果最好；在强趋势中会长期停留在超买/超卖区。配合K线形态使用。' });

  T({ id: 'macd', zh: 'MACD', en: 'MACD', al: 'pingyi yitong 平滑异同移动平均', dir: 'neu', tier: 'A', rel: 3,
    s: '快均线减慢均线，看两条线的交叉和柱子的变化。',
    path: [5, 15, 11, 6, 9, 17], k: 4, panel: 'macd',
    rec: 'MACD 线 = 12 日 EMA − 26 日 EMA；信号线 = MACD 的 9 日 EMA；柱状图 = 两者之差。（图中为演示缩短了参数）',
    psy: '衡量趋势的动能：柱子变长＝动能增强，柱子缩短＝动能减弱。',
    use: 'MACD 上穿信号线偏多、下穿偏空。与K线形态相互确认，例如黄昏星 + MACD 死叉。' });

  T({ id: 'volume', zh: '成交量确认', en: 'Volume Confirmation', al: 'chengjiaoliang 放量 缩量', dir: 'bull', tier: 'A', rel: 4,
    s: '价格突破时放量 = 真突破；缩量 = 可能是假突破。',
    path: [8, 10, 8.5, 9.8, 8.3, 14, 13, 17], k: 3, panel: 'vol',
    hl: [[10.2, 'r', '突破位']],
    rec: '观察关键K线（突破、反转）当天的成交量是否明显大于平均水平。',
    psy: '成交量代表参与的资金。大量资金参与的价格变化更可信。',
    use: 'Nison 建议：看涨吞没、锤子线等形态出现时成交量放大，可靠性更高；创新高但成交量萎缩，要小心。' });

  T({ book: 0, id: 'double-top', zh: '双重顶（M 头）', en: 'Double Top', al: 'shuangchongding Mtou', dir: 'bear', tier: 'A', rel: 4,
    s: '两次冲到同一高点都失败，形状像字母 M。',
    path: [2, 14.5, 9, 14.6, 4], k: 4,
    hl: [[15, 'r', '阻力'], [8.6, 'n', '颈线']],
    rec: '两个大致相同的高点，中间一个低点（颈线）。收盘跌破颈线确认。',
    psy: '第二次上攻未能突破，卖方占优。',
    use: '如果第二个顶上出现看跌K线形态（平头顶部、流星线等），提前预警。' });

  T({ book: 0, id: 'double-bottom', zh: '双重底（W 底）', en: 'Double Bottom', al: 'shuangchongdi Wdi', dir: 'bull', tier: 'A', rel: 4,
    s: '两次跌到同一低点都被托住，形状像字母 W。',
    path: [18, 5.5, 11, 5.4, 16], k: 4,
    hl: [[5, 's', '支撑'], [11.4, 'n', '颈线']],
    rec: '两个大致相同的低点，中间一个高点（颈线）。收盘突破颈线确认。',
    psy: '第二次下探没有新低，买方占优。',
    use: '第二个底上出现锤子线、看涨吞没等，是提前入场的机会。' });

  T({ book: 0, id: 'channel', zh: '上升通道', en: 'Rising Channel', al: 'tongdao 平行通道', dir: 'bull', tier: 'B', rel: 3,
    s: '在上升趋势线的上方再画一条平行线，价格在两条线之间运行。',
    path: [2, 9, 5, 12, 8, 15, 11, 18], k: 3,
    lines: [[0, 1.5, 7, 12, 's', '支撑线'], [1, 9.5, 7, 18.5, 'r', '通道上轨']],
    rec: '上升趋势线（连接低点）+ 与之平行、穿过高点的通道线。',
    psy: '趋势有节奏地推进，通道上轨是短期获利了结区。',
    use: '在通道上轨出现看跌K线形态可以短线减仓；在下轨出现看涨形态是加仓点。' });

  T({ id: 'box-breakout', zh: '箱体突破与测量目标', en: 'Box Breakout & Measured Move', al: 'xiangti tupo celiang mubiao', dir: 'bull', tier: 'A', rel: 4,
    s: '突破箱体后，常常再涨一个“箱体高度”。',
    path: [8, 14, 8.5, 13.8, 8.3, 14, 18, 16, 20], k: 3,
    hl: [[14.3, 'r', '箱顶'], [8, 's', '箱底'], [20.5, 'n', '目标 ≈ 箱顶 + 箱高']],
    rec: '价格在箱体中整理后，收盘突破箱顶。目标价 ≈ 突破点 + 箱体高度。',
    psy: '整理越久，突破后的动能越大。',
    use: 'Nison 在测量目标一章中讲解了箱体突破。突破后回踩箱顶不破（极性转换）是二次入场机会。' });

  T({ id: 'window-support', zh: '窗口的支撑作用', en: 'Windows as Support', al: 'chuangkou zhicheng 缺口支撑', dir: 'bull', tier: 'S', rel: 4,
    c: [[5, 8, 4.8, 7.8], [9.5, 12, 9.3, 11.8], [11.8, 12.5, 10.5, 10.8], [10.8, 11, 9.6, 10], [10, 12.8, 9.7, 12.5], [12.5, 14.5, 12.3, 14.2]], ctx: 'up',
    hl: [[9.3, 's', '窗口'], [8, 's', '']],
    s: '跳空后回调，只要不收盘跌破窗口，上涨就还在。',
    rec: '上升窗口出现后，价格回调到窗口区域时获得支撑。',
    psy: '日本谚语：“行情会回到窗口”。窗口是多方的防线。',
    use: 'Nison：以收盘价跌破整个窗口（下沿）为准，才算支撑失败。' });

  T({ book: 0, id: 'elliott', zh: '艾略特波浪', en: 'Elliott Wave', al: 'boliang lilun 五浪 三浪', dir: 'neu', tier: 'C', rel: 2,
    s: '上涨分 5 浪（1-3-5 涨，2-4 跌），之后有 3 浪调整（A-B-C）。',
    path: [0, 8, 4, 16, 11, 20, 14, 18, 10], k: 3,
    labs: [[1, 8, '1'], [2, 4, '2'], [3, 16, '3'], [4, 11, '4'], [5, 20, '5'], [6, 14, 'A'], [7, 18, 'B'], [8, 10, 'C']],
    rec: '推动浪 5 浪：1、3、5 浪上涨，2、4 浪回调；第 3 浪通常最长；随后 A-B-C 三浪调整。',
    psy: '群体情绪在乐观与悲观之间有节奏地交替。',
    use: '数浪主观性很强。可在第 5 浪末端寻找看跌K线形态作为辅助确认。' });

  T({ id: 'convergence', zh: '信号汇合', en: 'Convergence', al: 'huihe 共振 多重确认', dir: 'bull', tier: 'S', rel: 5,
    s: '多个信号出现在同一个位置时，可靠性最高。',
    c: [[12, 12.2, 6, 6.3], [5, 5.7, 4, 5.4], [6.3, 11, 6.1, 10.8]], ctx: 'down',
    hl: [[4.2, 's', '支撑 + 50%回撤']],
    rec: '例如：在前期支撑 + 50% 回撤位 + RSI 超卖处出现启明星。',
    psy: '越多不同方法指向同一结论，偶然性越小。',
    use: 'Nison 全书的核心思想：K线形态本身只是工具，要与趋势、支撑阻力、指标结合使用，而不是孤立地看一根K线。' });
})();

/* 单根K线的一句话说明（第一部分补充） */
(function () {
  const S = {
    'hammer': '下跌中，K线下面拖着一根长“尾巴”，像一把锤子——在“敲打”底部。',
    'hanging-man': '和锤子线长得一样，但出现在上涨的高位——像吊着的人，是危险信号。',
    'inverted-hammer': '下跌中，K线上面有一根长“天线”，实体很小在下端。',
    'shooting-star': '上涨中，K线上面一根长“天线”，冲高后被打回来——像划过天空的流星。',
    'gravestone-doji': '开盘、收盘、最低价都在同一位置，只有一根长上影线——像墓碑。',
    'dragonfly-doji': '开盘、收盘、最高价都在同一位置，只有一根长下影线——像蜻蜓。',
    'long-legged-doji': '开盘≈收盘，上下影线都很长——多空激烈争夺，打成平手。',
    'rickshaw-man': '长腿十字线，十字刚好在正中间。',
    'doji': '开盘价≈收盘价，实体只是一条横线——市场犹豫不决。',
    'northern-doji': '上涨途中的十字线——涨势可能要停了。',
    'southern-doji': '下跌途中的十字线——跌势可能放缓，但意义较弱。',
    'spinning-top': '实体很小、上下有影线——多空力量差不多。',
    'high-wave': '实体很小、上下影线特别长——市场情绪很乱。',
    'takuri': '锤子线的加强版，下影线是实体的 3 倍以上。',
    'bull-belt-hold': '下跌中，开盘就是最低价，然后一路涨到收盘。',
    'bear-belt-hold': '上涨中，开盘就是最高价，然后一路跌到收盘。',
    'white-marubozu': '一根没有影线的大阳线——多方全天完全掌控。',
    'black-marubozu': '一根没有影线的大阴线——空方全天完全掌控。',
    'closing-marubozu-w': '收盘在最高价的大阳线，只有下影线。',
    'closing-marubozu-b': '收盘在最低价的大阴线，只有上影线。',
    'opening-marubozu-w': '开盘在最低价的大阳线，只有上影线。',
    'opening-marubozu-b': '开盘在最高价的大阴线，只有下影线。',
    'long-white': '实体特别长的阳线——多方力量强。',
    'long-black': '实体特别长的阴线——空方力量强。',
    'short-line': '实体和影线都很短的K线——没人想动。',
    'long-upper-shadow': '上影线特别长——上面有人在卖。',
    'long-lower-shadow': '下影线特别长——下面有人在买。',
  };
  window.CANDLE_PATTERNS.forEach((p) => { if (!p.s && S[p.id]) p.s = S[p.id]; });
})();

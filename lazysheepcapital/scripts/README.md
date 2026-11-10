# 13F 数据更新脚本使用说明

`update_data.py` 从 SEC EDGAR 拉取各机构最近两期 13F-HR 持仓报告，自动对比算出
新建仓 / 增仓 / 减仓 / 清仓，生成与主数据 `data/smart_money_positions.csv` 同格式的增量文件。

纯 Python 标准库，无需安装任何依赖。

---

## 快速开始

在 `lazysheepcapital` 目录下运行：

```bash
# 跑全部机构（约 2-3 分钟，SEC 有限速）
python3 scripts/update_data.py

# 只跑某一家机构（名称要和脚本里 INSTITUTIONS 的 key 完全一致）
python3 scripts/update_data.py --inst "Berkshire Hathaway"

# 控制每家机构最多输出多少条变化（默认 30，按变动金额从大到小取）
python3 scripts/update_data.py --top 50
```

正常输出长这样：

```
▶ Berkshire Hathaway  [EDGAR: BERKSHIRE HATHAWAY INC]  2025-12-31 → 2026-03-31
   29 持仓 vs 42 持仓 → 15 条变化

✅ 共 15 条 → data/smart_money_positions_new.csv（人工复核后合并进主 CSV）

⚠️  7 个未知 CUSIP（已用发行人名称占位，可补充进 data/cusip_tickers.json）:
    247361702  DELTA AIR LINES INC
    ...
```

`[EDGAR: xxx]` 显示的是该 CIK 在 EDGAR 的注册名，**核对一下是不是你想要的机构**，
防止 CIK 配错拉到别人家的持仓。

---

## 完整工作流：跑 → 复核 → 合并

### 第 1 步：跑脚本

13F 在每季度结束后 45 天内披露，所以每年跑 4 次即可：

| 季度 | 披露截止 | 建议运行时间 |
|------|---------|-------------|
| Q4（12-31 截止） | 2 月 14 日 | 2 月中下旬 |
| Q1（3-31 截止）  | 5 月 15 日 | 5 月中下旬 |
| Q2（6-30 截止）  | 8 月 14 日 | 8 月中下旬 |
| Q3（9-30 截止）  | 11 月 14 日 | 11 月中下旬 |

### 第 2 步：复核 `data/smart_money_positions_new.csv`

脚本**永远不会**直接改主数据，结果单独放在 `_new.csv` 里。打开检查：

1. **大写长名的股票**（如 `DELTA AIR LINES INC`）= CUSIP 映射缺失，见下文「补充 CUSIP 映射」
2. **notes 列**默认是「EDGAR 13F 自动生成，待人工复核」，建议改成自己的点评再合并
3. 金额单位是百万美元（`value_change_usd_mn`），`pct_change` 是持股数量变化百分比

### 第 3 步：合并进主数据

```bash
tail -n +2 data/smart_money_positions_new.csv >> data/smart_money_positions.csv
```

合并后**网站自动更新**，不用改任何代码：聪明钱追踪页、全市场热力图、
首页统计数字（机构数 / 季度数 / 持仓变化数）都从主 CSV 实时计算。

---

## 维护

### 补充 CUSIP 映射

13F 原始数据里只有 CUSIP 没有股票代码。脚本内置了几十个常见大票的映射，
其余的缓存在 `data/cusip_tickers.json`。遇到未知 CUSIP 时脚本会在结尾列出来，
照已有格式补一行即可：

```json
"247361702": ["DAL", "Delta Air Lines"]
```

补完之后这只票永久生效。查 CUSIP 对应的代码可以直接搜索
「`<发行人名称> cusip`」或到 [quantumonline.com](https://www.quantumonline.com) 查询。

### 添加 / 修正机构

机构清单在脚本顶部的 `INSTITUTIONS` 字典里，格式：

```python
"机构名": (CIK数字, "分类"),
```

- 查 CIK：到 [EDGAR 全文检索](https://efts.sec.gov/LATEST/search-index?q=&forms=13F-HR)
  搜机构名，或直接访问 `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=机构名&type=13F`
- CIK 填 `None` 的机构会被跳过并提示（目前 **Apollo Global Management 待补**）
- 分类需与主 CSV 已有分类一致：`Core Smart Money` / `13F Hedge Funds` /
  `Alternative Assets` / `Long Only Asset Managers` / `AI Core Holdings`

### 常见问题

| 现象 | 原因与处理 |
|------|-----------|
| `13F-HR 不足两期，跳过` | 该机构是新 CIK 或刚开始披露，等下一季 |
| `HTTP Error 403/429` | SEC 限速，脚本已带重试；还不行就等几分钟再跑 |
| 某机构变化数是 0 | 两期持仓完全相同（指数型机构常见），正常 |
| EDGAR 注册名和机构对不上 | CIK 配错了，按上面方法重查 |

---

## 设计说明（改脚本前读）

- 数据源：`data.sec.gov/submissions/`（找最近两期 13F-HR 的 accession）→
  `sec.gov/Archives/`（下载 information table XML）
- 对比逻辑：按 CUSIP 聚合（同一票多行合并），以**持股数量**变化判定动作，
  以**市值**变化排序取 top N
- 动作判定：新出现 = `New Position`，消失 = `Exited`（pct -100），
  数量增 = `Added`，数量减 = `Reduced`
- SEC 要求 User-Agent 带联系方式（脚本里已配置），请求间隔 0.2s

---

# 板块涨跌日更（`fetch_sectors.py`）

页面：`sectors/`（导航「板块涨跌」）。首页顶部的市场快讯条也读同一份数据。

## 它做什么

从 Yahoo Finance 拉取约 75 个代码的**当日涨跌、5 分钟分时、近一月日线**，写两个文件：

| 文件 | 内容 | 用途 |
|---|---|---|
| `data/sectors.json` | 最新一个交易日的完整快照（指数、11 大板块、科技 ETF、科技 10 个细分及成分股，含曲线） | `sectors/` 页面和首页快讯条直接读取 |
| `data/sectors_history.csv` | 每天一行：日期 + 11 个板块 ETF 涨跌 + 10 个科技细分等权涨跌 | 长期积累，方便以后做统计 / 回看 |

纯标准库，不需要装依赖。

## 自动日更（GitHub Actions）

`.github/workflows/sectors-daily.yml`：

- **时间**：周一到周五 21:30 UTC，即美东 16:30（冬令时）/ 17:30（夏令时），都在收盘之后。
- **流程**：跑脚本 → 如果 `sectors.json` / `sectors_history.csv` 有变化就 commit 并 push 到 `main` → GitHub Pages 自动重新部署。
- **节假日**：休市日 Yahoo 返回的是上一个交易日数据，脚本会覆盖同一天那行，不会产生重复。
- **手动触发**：GitHub 仓库 → Actions → `sectors-daily` → Run workflow。
- 需要仓库 Settings → Actions → General → Workflow permissions 设为 **Read and write**（workflow 里已声明 `contents: write`，一般默认可用）。

## 手动跑

```bash
cd lazysheepcapital
python3 scripts/fetch_sectors.py
```

输出示例：

```
✅ data/sectors.json  截至 2026-11-10 16:00 ET  (73/74 只)
   缺失: PSTG
```

盘中跑得到的是实时快照，页面左上角会显示黄色「盘中快照」；收盘后跑显示绿色「收盘数据」。

## 改分组 / 加股票

只改 `fetch_sectors.py` 顶部的 `TECH_GROUPS`（科技细分）、`SECTORS`、`TECH_ETFS`、`INDICES` 列表，页面会自动适配，不需要改 HTML。
`sectors_history.csv` 的列由 `SECTORS` + `TECH_GROUPS` 的 key 决定，**改了分组之后旧行的列会对不上**，建议改分组时把旧 CSV 另存一份。

## 口径说明

- 涨跌幅 = 最新价 ÷ 前一交易日收盘价 − 1。
- 科技细分 = 成分股**等权平均**；XLK / SMH 是市值加权，所以英伟达、微软这类大权重股大跌时，两者可能相差很多。
- 「近一月」曲线以窗口第一天为 0% 的累计涨跌。
- 某只股票拉取失败（退市、改代码等）会列在 `missing` 里并显示在页面底部，不影响其他数据。

## 常见问题

- **页面显示「数据加载失败」**：本地直接双击打开 HTML 时浏览器会拦截 `fetch`，用 `python3 -m http.server` 在仓库根目录起一个服务再访问。
- **Actions 跑了但没更新**：看 Actions 日志里是否有 `⚠️` 行；Yahoo 偶尔限流，脚本每个代码会重试 3 次。
- **加了新的子页面**：记得把「板块涨跌」放进新页面的 `.sn-link` 导航（顺序见其他页面）。

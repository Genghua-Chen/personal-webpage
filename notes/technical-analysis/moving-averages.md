# Moving Averages

## What is a Moving Average?

A **Moving Average (MA)** smooths price data by calculating the average price over a rolling window of N periods. It filters out noise and helps identify the underlying trend.

## SMA vs EMA

### Simple Moving Average (SMA)

Equal weight to all N periods.

```
SMA(20) = (Sum of last 20 closing prices) / 20
```

### Exponential Moving Average (EMA)

More weight given to recent prices — reacts faster to price changes.

```
EMA = (Close - Previous EMA) × Multiplier + Previous EMA
Multiplier = 2 / (N + 1)
EMA(20) Multiplier = 2/21 ≈ 0.095
```

EMA is more responsive; SMA is more stable. Use EMA for short-term trading, SMA for longer trends.

## Key Moving Average Periods

| MA | Typical Use |
|----|-------------|
| 9 EMA / 21 EMA | Short-term momentum; favored by day traders |
| 50 SMA | Mid-term trend; major S/R level for swing traders |
| 200 SMA | Long-term trend; institutional benchmark, bull/bear dividing line |
| VWAP | Volume-Weighted — intraday benchmark; institutions trade around it |

## How to Use MAs

### Trend Direction

- Price above MA → bullish; price below MA → bearish.
- Rising MA → uptrend; falling MA → downtrend; flat MA → range-bound.

### Dynamic Support & Resistance

The 50 SMA and 200 SMA act as dynamic support in uptrends and resistance in downtrends. Stocks often bounce off these MAs in trending markets.

### MA Crossovers

When a faster MA crosses above a slower MA = bullish signal. When it crosses below = bearish signal.

```
Golden Cross: 50 SMA crosses above 200 SMA → long-term bullish signal
Death Cross:  50 SMA crosses below 200 SMA → long-term bearish signal
```

> [!WARNING]
> **Lagging indicator:** Moving averages are based on past prices, so they lag. They confirm trends rather than predict them. Do not use MAs as a sole entry signal.

## MA Ribbon

Plotting multiple MAs together (e.g., 8, 13, 21, 34, 55 EMA) creates a "ribbon." When the ribbon is fanned out and ordered (fastest on top for uptrend), the trend is strong. When the ribbon compresses and crosses, a trend change may be coming.

## Quick Summary

- SMA = equal-weight average; EMA = recency-weighted average.
- Key levels: 9, 21, 50, 200.
- Price above rising MA → bullish bias.
- **Golden Cross** (50 above 200) → bullish; **Death Cross** → bearish.
- MAs are lagging — use for trend confirmation, not prediction.

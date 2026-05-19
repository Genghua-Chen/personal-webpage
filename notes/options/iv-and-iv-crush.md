# Implied Volatility & IV Crush

## What is Implied Volatility (IV)?

**Implied Volatility** is the market's forward-looking estimate of how much a stock will move over a given period, expressed as an annualized percentage. It is derived from current option prices using an options pricing model (e.g., Black-Scholes).

```
Higher option prices → Higher IV
Lower option prices  → Lower IV
IV is "implied" from the market price — it's not directly observable
```

## IV vs Historical Volatility (HV)

- **HV (Realized Vol):** How much the stock actually moved in the past (backward-looking).
- **IV (Implied Vol):** How much the market expects the stock to move in the future (forward-looking).
- When IV > HV → options are "expensive" relative to actual moves.
- When IV < HV → options are "cheap."

## IV Rank and IV Percentile

To judge whether IV is "high" or "low" you need context:

```
IV Rank = (Current IV - 52w Low IV) / (52w High IV - 52w Low IV) × 100

IV Rank 80 = IV is near the top of its 1-year range → expensive options
IV Rank 20 = IV is near the bottom → cheap options
```

## What is IV Crush?

**IV Crush** is the rapid drop in Implied Volatility that occurs immediately after a highly anticipated event (earnings, FDA approval, FOMC). Before the event, uncertainty drives IV up. Once the event passes and uncertainty resolves, IV collapses.

> [!WARNING]
> **The trap:** You buy calls before earnings expecting the stock to rise. Earnings beat expectations. Stock jumps 3%. But your calls still lose money — because IV dropped 40% and the Vega loss exceeded the Delta gain. This is IV Crush.

## How to Think About Earnings Plays

- IV rises into earnings → options get more expensive (high Vega).
- After earnings → IV collapses, options immediately lose extrinsic value.
- The stock must move more than the **expected move** for a long option to profit.
- Option sellers use this: selling straddles/strangles before earnings to collect the IV premium, then buying them back cheaper after the crush.

```
Expected Move (from options market):
EM ≈ ATM Straddle Price (ATM call + ATM put)

If stock moves MORE than EM → long options win
If stock moves LESS than EM → short options win
```

## VIX — The Market's Fear Gauge

The **VIX** (CBOE Volatility Index) measures the 30-day implied volatility of S&P 500 options. It is the market-wide equivalent of individual stock IV.

| VIX Level | Interpretation |
|-----------|----------------|
| < 15 | Calm market, low fear |
| 15–25 | Normal range |
| > 30 | Elevated fear, often near market bottoms |

VIX spikes during market sell-offs (inverse relationship with SPX).

## Quick Summary

- IV = forward-looking market estimate of price movement.
- High IV = expensive options; Low IV = cheap options.
- **IV Crush** = sharp drop in IV after a major event resolves.
- Option buyers before events fight IV Crush; option sellers benefit from it.
- Use IV Rank to judge whether IV is relatively high or low.

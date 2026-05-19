# Order Types

## Market Order

Executes immediately at the best available price. **Guarantees execution but not price.**

- Use when speed matters more than exact price (e.g., getting out of a losing trade fast).
- Avoid in illiquid stocks — you may get a terrible fill due to wide bid-ask spreads.
- Avoid in pre/after market hours when spreads are very wide.

> [!WARNING]
> **For options: never use market orders.** The bid-ask spread on options can be very wide and a market order can cost you significantly. Always use limit orders for options.

## Limit Order

Executes only at your specified price or better. **Guarantees price but not execution.**

- Buy limit: order fills at the limit price or lower.
- Sell limit: order fills at the limit price or higher.
- Best for options and less-liquid stocks.

## Stop Order (Stop-Loss)

Becomes a market order once price touches your stop level. Used to exit a losing position automatically.

```
Long position stop-loss:  set below entry price
Short position stop-loss: set above entry price
When stop level is hit → market order fires to close position
```

> [!WARNING]
> **Gap risk:** If a stock gaps past your stop level overnight, your order may fill significantly worse than your stop price (e.g., stop at $50, fills at $45 on a gap down).

## Stop-Limit Order

When the stop level is triggered, it becomes a *limit* order (not a market order). Prevents bad gap fills but risks non-execution if price moves through the limit fast.

- **Stop price:** triggers the order.
- **Limit price:** the worst price you'll accept.
- Risk: if price gaps past both levels, the order may not fill at all — leaving you in a losing position.

## Trailing Stop

Stop that automatically moves with price as it moves in your favor, locking in profits.

```
Example: Buy at $100, trailing stop = $5
Price rises to $110 → stop moves to $105
Price rises to $120 → stop moves to $115
Price falls to $115 → stop triggered, sell at ~$115
```

## Time-in-Force Options

| Code | Meaning |
|------|---------|
| **DAY** | Order expires at end of trading day if not filled |
| **GTC** | Good Till Cancelled — stays open until filled or manually cancelled |
| **IOC** | Immediate or Cancel — fill immediately or cancel any unfilled portion |
| **FOK** | Fill or Kill — fill completely or cancel entirely |
| **MOC** | Market on Close — executes at the closing price |

## Quick Summary

- **Market** = instant execution, uncertain price. Use sparingly.
- **Limit** = certain price, uncertain execution. Use for options — always.
- **Stop** = auto exit when price hits level (market fill).
- **Stop-Limit** = stop that becomes a limit; may not fill on gaps.
- **Trailing Stop** = follows price, locks in profits.

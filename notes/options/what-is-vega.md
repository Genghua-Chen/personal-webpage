# What is Vega? (ν)

## Definition

**Vega** measures how much an option's price changes for a **1% change in Implied Volatility (IV)**. It is always positive for both calls and puts (higher volatility = more expensive options).

```
Vega = ΔOption Price / Δ(1% IV)
Example: Vega = 0.10 → option gains $0.10 for every 1% rise in IV
```

## Implied Volatility (IV) Recap

IV is the market's expectation of how much the stock will move over the option's lifetime. High IV = expensive options. Low IV = cheap options. Vega tells you your sensitivity to changes in this expectation.

## Long vs Short Vega

### Long Vega (buying options)

- You benefit when IV rises (options become more valuable).
- You are hurt when IV falls (options become cheaper).
- Best strategy: buy options when IV is low, sell when IV is high.

### Short Vega (selling options)

- You benefit when IV falls (options you sold become cheaper, you buy back at a profit).
- You are hurt when IV spikes (options become more expensive against you).

> [!WARNING]
> **Selling options before a volatility spike:** If IV is already high before earnings and something unexpected happens causing IV to spike further, short Vega positions can suffer large losses.

## Where is Vega Highest?

- **ATM options** have the highest Vega.
- Longer-dated options (more DTE) have higher Vega than short-dated ones.
- OTM and ITM options have lower Vega than ATM.

## Vega and Events (Earnings, FDA, etc.)

Before earnings or major events, IV typically rises sharply as the market prices in uncertainty. After the event, IV collapses — this is **IV Crush** (see the IV & IV Crush note).

> [!INFO]
> **Example:** Stock is at $100. You buy a call for $5 before earnings. Earnings come out — stock rises to $103, but IV drops from 80% to 40%. Your call might now be worth $3 despite being directionally correct. The loss from IV crush outweighed the gain from the stock move.

## Quick Summary

- Vega = sensitivity of option price to 1% change in IV.
- Always positive for long options; negative for short options.
- Highest for ATM, long-dated options.
- Buy options when IV is low; sell options when IV is high.
- IV Crush is the enemy of option buyers around events.

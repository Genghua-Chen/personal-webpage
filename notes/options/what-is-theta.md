# What is Theta? (Θ)

## Definition

**Theta** measures the rate at which an option loses value as time passes, all else being equal. It is commonly called **time decay**.

```
Theta = Change in Option Price / Change in Time (1 day)
Usually expressed as a negative number for long options.
Example: Theta = -0.05 → option loses $0.05 per day
```

## Why Options Have Time Value

An option's price = **Intrinsic Value** + **Extrinsic (Time) Value**. The longer the time to expiration, the more chance the stock has to move in your favor, so the option is worth more. As expiration approaches, that time value erodes to zero.

## Theta Decay is Non-Linear

Theta decay accelerates as expiration approaches. An option does not lose value evenly each day — it loses much more in the final weeks.

```
Theta decay curve (approximate):
90 DTE → slow decay
30 DTE → moderate decay
7 DTE  → rapid decay
1 DTE  → extreme decay (ATM options)
```

This is why selling options with 30–45 DTE is a common "sweet spot" — enough premium to collect, with accelerating decay working in the seller's favor.

## Long vs Short Theta

### Long Theta (selling options) — "Theta positive"

- You collect premium upfront; time decay works *for* you.
- Every day that passes without a big move is a win.
- Risk: large moves hurt you (you are short Gamma).
- Strategies: covered calls, cash-secured puts, credit spreads, iron condors.

### Short Theta (buying options) — "Theta negative"

- You pay premium; time decay works *against* you.
- You need the stock to move enough to overcome Theta erosion.
- Strategies: buying calls/puts, debit spreads.

> [!WARNING]
> **Buying options into a slow market:** If you buy an option expecting a move that doesn't happen, Theta will eat away your premium even if the stock eventually moves. Time is your enemy when long options.

## Where is Theta Highest?

- ATM options have the highest Theta (most time value to decay).
- Deep ITM and deep OTM options have less Theta.
- Theta increases as DTE decreases (especially under 30 days).

## Theta and Gamma Relationship

Theta and Gamma are opposites: positions that earn Theta tend to lose on Gamma (short options), and positions that gain from Gamma movement pay Theta (long options). This is the fundamental **Theta-Gamma trade-off**.

> [!TIP]
> Long Gamma + Short Theta. Short Gamma + Long Theta. You're always trading one for the other.

## Quick Summary

- Theta = daily time decay of an option's value.
- Always negative for long options; positive for short options.
- Accelerates dramatically in the last 30 days before expiration.
- Highest for ATM options.
- Theta favors option sellers; hurts option buyers.

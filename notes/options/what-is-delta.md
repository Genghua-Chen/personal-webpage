# What is Delta? (Δ)

## Definition

**Delta** measures how much an option's price is expected to change for a **$1 move** in the underlying asset.

```
Delta = ΔOption Price / ΔUnderlying Price
Range: 0 to +1 for calls, -1 to 0 for puts
```

## Reading Delta Values

- **Call Delta 0.50** → option gains $0.50 for every $1 the stock rises.
- **Put Delta -0.40** → option gains $0.40 for every $1 the stock falls.
- **Delta 1.0 or -1.0** → deep ITM option moves 1:1 with the stock.
- **Delta ~0.50** → at-the-money option.

## Delta as Probability Proxy

Delta is often used as a rough approximation of the probability that an option expires in-the-money. A 0.30 delta call ≈ 30% chance of expiring ITM.

> [!INFO]
> This is an approximation, not a precise probability. The actual probability depends on the model assumptions (e.g., Black-Scholes uses log-normal price distribution).

## Moneyness and Delta

```
Deep OTM call:  Δ ≈ 0.05–0.15
OTM call:       Δ ≈ 0.25–0.40
ATM call:       Δ ≈ 0.50
ITM call:       Δ ≈ 0.60–0.85
Deep ITM call:  Δ ≈ 0.90–1.00
```

## Delta and Directional Exposure

One option contract controls 100 shares. So a call with Delta 0.40 has the equivalent directional exposure of **40 shares**.

```
Equivalent Share Exposure = Delta × 100 (per contract)
Example: 3 contracts × Δ0.40 = 120 share exposure
```

## Delta Hedging

Market makers keep a **delta-neutral** portfolio by offsetting their option Delta with shares. As the underlying moves, they rebalance — this is called *dynamic delta hedging*.

## How Delta Changes

- As stock rises → call Delta increases toward 1, put Delta moves toward 0.
- As stock falls → call Delta decreases toward 0, put Delta increases toward -1.
- As expiration approaches → ATM Delta stays ~0.50; OTM Delta → 0; ITM Delta → 1.
- The rate at which Delta changes = **Gamma**.

## Quick Summary

- Delta = sensitivity of option price to $1 move in underlying.
- Calls: 0 to +1. Puts: -1 to 0.
- ATM ≈ 0.50, deep ITM ≈ 1, deep OTM ≈ 0.
- Often used as a probability-of-expiring-ITM estimate.

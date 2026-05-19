# What is Gamma? (Γ)

## Definition

**Gamma** is the rate of change of **Delta** with respect to a $1 move in the underlying asset. In other words, Gamma tells you how much your Delta will shift if the stock moves by one dollar.

```
Gamma = ΔDelta / ΔUnderlying Price
(second derivative of option price with respect to underlying price)
```

## Intuition

Delta is the "speed" of an option — how fast its price moves relative to the stock.
Gamma is the "acceleration" — how fast that speed is changing.

- **High Gamma** → Delta changes rapidly as stock moves → option is very sensitive to price swings.
- **Low Gamma** → Delta barely changes → option is less reactive.

## Where is Gamma Highest?

- **At-the-money (ATM)** options have the highest Gamma.
- Gamma spikes dramatically as expiration approaches (especially for ATM options).
- Deep ITM and deep OTM options have near-zero Gamma.

```
Gamma profile (rough sketch):
OTM ──── ATM ──── ITM
 low     HIGH      low
```

## Long Gamma vs Short Gamma

### Long Gamma (buying options)

- You *benefit* from large moves in either direction.
- Your Delta grows in your favor as the stock moves toward you.
- Cost: you pay Theta (time decay) every day you hold.

### Short Gamma (selling options)

- You *benefit* from the stock staying still (collecting Theta).
- Risk: large moves hurt you because Delta accelerates against you.
- Selling naked options near expiration = extreme short Gamma risk.

> [!WARNING]
> **Gamma Risk near expiration:** In the last few days before expiry, ATM options can swing from near-zero Delta to near-1 Delta very rapidly. Selling very short-dated ATM options is extremely dangerous — a small move can cause massive P&L swings.

## Gamma and Market Makers

Market makers who sell options are typically *short Gamma*. To stay delta-neutral they must constantly buy or sell the underlying as it moves. This hedging activity can amplify price moves — known as a **Gamma squeeze**.

> [!INFO]
> **Gamma Squeeze:** When a stock rises and market makers are short Gamma, they must buy more shares to hedge, which pushes the stock higher, forcing more buying — a feedback loop. This was famously seen in the GameStop (GME) 2021 rally.

## Quick Summary

- Gamma = rate of change of Delta.
- Highest ATM, spikes near expiration.
- **Long Gamma:** profits from big moves, costs Theta.
- **Short Gamma:** profits from stability, hurt by big moves.

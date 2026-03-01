# How Options Work

## What is an Option?

An **option** is a contract that gives the buyer the *right, but not the obligation*, to buy or sell 100 shares of an underlying asset at a specified price (the **strike price**) before a specified date (the **expiration date**).

## Two Types of Options

### Call Option

Gives the buyer the right to **buy** 100 shares at the strike price.

- You buy a call when you expect the stock to go **UP**.
- Maximum loss for buyer: the premium paid.
- Maximum gain: unlimited (stock can rise indefinitely).

### Put Option

Gives the buyer the right to **sell** 100 shares at the strike price.

- You buy a put when you expect the stock to go **DOWN**.
- Maximum loss for buyer: the premium paid.
- Maximum gain: strike price × 100 (stock can only go to zero).

## Key Option Terms

```
Strike Price  = the agreed buy/sell price in the contract
Premium       = the price you pay/receive for the option
Expiration    = date after which the option is worthless if not exercised
Contract Size = 1 contract = 100 shares
ITM/ATM/OTM   = In/At/Out of the money (relative to strike vs current price)
```

## Moneyness

| Status | Call | Put |
|--------|------|-----|
| ITM (In the Money) | Stock > Strike | Stock < Strike |
| ATM (At the Money) | Stock ≈ Strike | Stock ≈ Strike |
| OTM (Out of the Money) | Stock < Strike | Stock > Strike |

ITM options have intrinsic value. OTM options have only extrinsic (time) value.

## Option Price Components

```
Option Price (Premium) = Intrinsic Value + Extrinsic (Time) Value

Intrinsic Value = how far ITM the option is (floor = 0)
Extrinsic Value = time remaining + implied volatility premium
```

## Buyer vs Seller

- **Buyer (long):** Pays premium. Right but not obligation. Limited loss, larger potential gain.
- **Seller (short/writer):** Receives premium. Obligation to fulfill contract if exercised. Limited gain, larger potential loss.

> [!INFO]
> Most options are never exercised — they are bought and sold in the market before expiration. Only ~10% of options are actually exercised.

## Simple P&L at Expiration

```
Long Call P&L = MAX(Stock Price - Strike, 0) - Premium Paid
Long Put P&L  = MAX(Strike - Stock Price, 0) - Premium Paid
Breakeven (call) = Strike + Premium
Breakeven (put)  = Strike - Premium
```

## Quick Summary

- **Call** = right to buy; profitable when stock goes up.
- **Put** = right to sell; profitable when stock goes down.
- 1 contract = 100 shares.
- Buyer pays premium, has limited loss.
- Seller collects premium, has larger potential loss.

import React, { useState } from 'react';
import { Layers, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const OrderBookSimulator: React.FC = () => {
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [limitPrice, setLimitPrice] = useState<number>(500);
  const [shares, setShares] = useState<number>(5);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Simulated live depth
  const asks = [
    { price: 504.50, qty: 80, orders: 4 },
    { price: 503.00, qty: 45, orders: 3 },
    { price: 502.00, qty: 15, orders: 2 },
    { price: 501.00, qty: 10, orders: 1 }, // Best ask
  ];

  const bids = [
    { price: 500.00, qty: 25, orders: 3 }, // Best bid
    { price: 499.00, qty: 60, orders: 5 },
    { price: 497.50, qty: 95, orders: 8 },
    { price: 495.00, qty: 140, orders: 12 },
  ];

  const spread = (asks[asks.length - 1].price - bids[0].price).toFixed(2);

  const handleSimulateBuy = () => {
    if (orderType === 'MARKET') {
      const bestAsk = asks[asks.length - 1].price;
      const total = (bestAsk * shares).toFixed(2);
      setLastMessage(`✅ Market Buy Filled! Bought ${shares} shares at the lowest Ask of ₹${bestAsk} (Total: ₹${total}). Speed priority, paid the spread.`);
    } else {
      if (limitPrice >= asks[asks.length - 1].price) {
        setLastMessage(`✅ Limit Buy Executed Immediately! Your limit of ₹${limitPrice} was equal to or higher than the best Ask (₹${asks[asks.length - 1].price}). Filled at ₹${asks[asks.length - 1].price}.`);
      } else {
        setLastMessage(`⏳ Limit Buy Placed on the Order Book at ₹${limitPrice.toFixed(2)}! It will wait patiently until a seller agrees to sell down to ₹${limitPrice.toFixed(2)}.`);
      }
    }
  };

  return (
    <div className="theme-card border theme-border rounded-2xl p-6 theme-main-text my-6 shadow-sm">
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 theme-soft-accent-bg border theme-border rounded-xl theme-primary-text">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold theme-main-text">Live Order Book Depth Simulator</h4>
            <p className="text-xs theme-secondary-text">See how real buyers and sellers match in a continuous double auction.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] theme-muted-text block">Bid-Ask Spread</span>
          <span className="text-sm font-mono font-bold text-amber-500">₹{spread}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Depth Table */}
        <div className="theme-surface-subtle rounded-xl border theme-border p-4 font-mono text-xs">
          <div className="text-rose-500 font-bold mb-2 flex items-center justify-between border-b theme-border pb-1">
            <span className="flex items-center gap-1"><ArrowDownRight className="w-4 h-4" /> ASKS (Sellers waiting to sell)</span>
            <span className="text-[10px] theme-muted-text">Qty / Price</span>
          </div>
          <div className="space-y-1 mb-4">
            {asks.map((a, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20">
                <span className="theme-secondary-text">{a.qty} qty ({a.orders} orders)</span>
                <span className="text-rose-500 font-semibold">₹{a.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="py-2 px-3 my-2 theme-card rounded-lg flex items-center justify-between border theme-border text-xs shadow-2xs">
            <span className="theme-secondary-text">Last Traded Price:</span>
            <span className="font-bold theme-main-text text-sm">₹500.50</span>
          </div>

          <div className="text-emerald-500 font-bold mb-2 flex items-center justify-between border-b theme-border pb-1 mt-3">
            <span className="flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> BIDS (Buyers waiting to buy)</span>
            <span className="text-[10px] theme-muted-text">Price / Qty</span>
          </div>
          <div className="space-y-1">
            {bids.map((b, i) => (
              <div key={i} className="flex justify-between items-center py-0.5 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20">
                <span className="text-emerald-500 font-semibold">₹{b.price.toFixed(2)}</span>
                <span className="theme-secondary-text">{b.qty} qty ({b.orders} orders)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Order Execution Form */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold theme-main-text block mb-1.5">Choose Order Type:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    orderType === 'LIMIT'
                      ? 'theme-btn-primary shadow-xs'
                      : 'theme-surface-subtle theme-secondary-text border theme-border hover:theme-surface-elevated'
                  }`}
                >
                  Limit Order (Safe Price)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    orderType === 'MARKET'
                      ? 'theme-btn-primary shadow-xs'
                      : 'theme-surface-subtle theme-secondary-text border theme-border hover:theme-surface-elevated'
                  }`}
                >
                  Market Order (Instant Fill)
                </button>
              </div>
            </div>

            {orderType === 'LIMIT' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold theme-main-text">Your Limit Price (₹):</label>
                  <span className="text-xs font-mono font-bold theme-primary-text">₹{limitPrice.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="490"
                  max="510"
                  step="0.5"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] theme-muted-text mt-1">
                  <span>₹490 (Below bids)</span>
                  <span>₹500 (At best bid)</span>
                  <span>₹501+ (Crosses spread)</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold theme-main-text block mb-1">Shares to Buy:</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={shares}
                  onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
                  className="w-24 theme-surface-subtle border theme-border rounded-xl px-3 py-1.5 text-sm font-mono theme-main-text focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs theme-secondary-text">
                  Approx total: <strong className="theme-main-text">₹{(shares * (orderType === 'MARKET' ? 501 : limitPrice)).toFixed(2)}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateBuy}
            className="w-full py-3 theme-btn-primary text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Simulate Buy Order
          </button>

          {lastMessage && (
            <div className="p-3 theme-soft-accent-bg border theme-border rounded-xl text-xs theme-primary-text leading-relaxed animate-in fade-in duration-200 font-medium">
              {lastMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

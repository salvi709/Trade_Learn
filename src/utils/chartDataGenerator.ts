import { FictionalStock } from '../types';

export type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
export type ChartVolatility = 'normal' | 'high';

export interface ChartDataPoint {
  label: string;
  fullDate: string;
  price: number;
  volume: number;
}

export interface GeneratedChartSeries {
  points: ChartDataPoint[];
  periodOpen: number;
  periodClose: number;
  periodHigh: number;
  periodLow: number;
  supportPrice: number;
  resistancePrice: number;
  periodChange: number;
  periodChangePercent: number;
  timeframe: ChartTimeframe;
}

// Pseudo-random deterministic generator using a seed string
function seedRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateStockChartData(
  stock: FictionalStock,
  timeframe: ChartTimeframe = '1D',
  volatility: ChartVolatility = 'normal'
): GeneratedChartSeries {
  const current = stock.currentPrice;
  const high52 = stock.high52w || current * 1.15;
  const low52 = stock.low52w || current * 0.85;
  const volMult = volatility === 'high' ? 1.85 : 1.0;

  const rand = seedRandom(`${stock.symbol}_${timeframe}_${volatility}`);

  let points: ChartDataPoint[] = [];

  if (timeframe === '1D') {
    // 16 intraday intervals: 09:15 AM to 03:30 PM
    const times = [
      '09:15', '09:30', '09:45', '10:00', '10:30', '11:00', 
      '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', 
      '14:30', '15:00', '15:15', '15:30'
    ];
    // Start at price - change
    const openPrice = Math.max(5, current - stock.change);
    const totalDelta = current - openPrice;

    points = times.map((t, idx) => {
      const progress = idx / (times.length - 1);
      // Realistic intraday path: morning volatility, midday lull, afternoon push
      const intradayWave = Math.sin(progress * Math.PI * 2.2) * (current * 0.008 * volMult);
      const noise = (rand() - 0.48) * (current * 0.006 * volMult);
      
      let p = openPrice + totalDelta * progress + intradayWave + noise;
      if (idx === times.length - 1) p = current;
      if (idx === 0) p = openPrice;

      return {
        label: t,
        fullDate: `Today, ${t} IST`,
        price: Math.round(p * 100) / 100,
        volume: Math.round(8000 + rand() * 35000),
      };
    });
  } else if (timeframe === '1W') {
    // 5 trading days, 4 sessions per day = 20 points
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const subTimes = ['09:30', '11:30', '13:30', '15:30'];
    const openPrice = Math.max(5, current * (1 - (stock.changePercent * 0.015 * (rand() > 0.5 ? 1 : -1))));
    const totalDelta = current - openPrice;
    let idx = 0;
    const totalCount = days.length * subTimes.length;

    for (let d = 0; d < days.length; d++) {
      for (let s = 0; s < subTimes.length; s++) {
        const progress = idx / (totalCount - 1);
        const wave = Math.sin(progress * Math.PI * 3) * (current * 0.014 * volMult);
        const noise = (rand() - 0.5) * (current * 0.009 * volMult);
        let p = openPrice + totalDelta * progress + wave + noise;
        if (idx === totalCount - 1) p = current;
        if (idx === 0) p = openPrice;

        points.push({
          label: s === 0 || s === 3 ? `${days[d]} ${subTimes[s]}` : subTimes[s],
          fullDate: `${days[d]} Session, ${subTimes[s]} IST`,
          price: Math.round(p * 100) / 100,
          volume: Math.round(15000 + rand() * 45000),
        });
        idx++;
      }
    }
  } else if (timeframe === '1M') {
    // 20 trading sessions across 4 calendar weeks
    const totalSessions = 20;
    const startOffsetPercent = ((rand() * 10) - 4) * 0.01;
    const openPrice = Math.max(5, current * (1 - startOffsetPercent));
    const totalDelta = current - openPrice;

    for (let i = 0; i < totalSessions; i++) {
      const progress = i / (totalSessions - 1);
      const weekNum = Math.floor(i / 5) + 1;
      const dayNum = (i % 5) + 1;
      const wave = Math.sin(progress * Math.PI * 2.5) * (current * 0.025 * volMult);
      const pullback = Math.cos(progress * Math.PI * 4.5) * (current * 0.012 * volMult);
      const noise = (rand() - 0.5) * (current * 0.01 * volMult);

      let p = openPrice + totalDelta * progress + wave + pullback + noise;
      if (i === totalSessions - 1) p = current;
      if (i === 0) p = openPrice;

      points.push({
        label: i % 4 === 0 ? `Wk ${weekNum}` : `D${dayNum}`,
        fullDate: `1M Window · Week ${weekNum}, Day ${dayNum}`,
        price: Math.round(p * 100) / 100,
        volume: Math.round(25000 + rand() * 65000),
      });
    }
  } else if (timeframe === '3M') {
    // 24 quarterly progression points (approx 2 per week over 12 weeks)
    const totalPoints = 24;
    const openPrice = Math.max(5, current * (0.92 + (rand() * 0.12)));
    const totalDelta = current - openPrice;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / (totalPoints - 1);
      const monthNum = Math.floor(i / 8) + 1;
      const weekNum = Math.floor((i % 8) / 2) + 1;
      const cycle = Math.sin(progress * Math.PI * 3.5) * (current * 0.038 * volMult);
      const trend = Math.cos(progress * Math.PI * 2) * (current * 0.02 * volMult);
      const noise = (rand() - 0.49) * (current * 0.015 * volMult);

      let p = openPrice + totalDelta * progress + cycle + trend + noise;
      if (i === totalPoints - 1) p = current;
      if (i === 0) p = openPrice;

      points.push({
        label: i % 6 === 0 ? `M-${4 - monthNum}` : `W${weekNum}`,
        fullDate: `3M Horizon · Month ${monthNum}, Week ${weekNum}`,
        price: Math.round(p * 100) / 100,
        volume: Math.round(35000 + rand() * 85000),
      });
    }
  } else if (timeframe === '6M') {
    // 24 points over 6 calendar months
    const totalPoints = 24;
    const baseSwing = (high52 - low52) * 0.45;
    const openPrice = Math.max(5, current - baseSwing * (rand() > 0.4 ? 0.6 : -0.4));
    const totalDelta = current - openPrice;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / (totalPoints - 1);
      const monthIdx = Math.floor(i / 4) + 1;
      const halfMonth = (i % 4) < 2 ? 'Early' : 'Late';
      const macroWave = Math.sin(progress * Math.PI * 2.8) * (current * 0.055 * volMult);
      const subCycle = Math.cos(progress * Math.PI * 5) * (current * 0.025 * volMult);
      const noise = (rand() - 0.5) * (current * 0.018 * volMult);

      let p = openPrice + totalDelta * progress + macroWave + subCycle + noise;
      if (i === totalPoints - 1) p = current;
      if (i === 0) p = openPrice;

      points.push({
        label: i % 4 === 0 ? `M${monthIdx}` : `${halfMonth[0]}`,
        fullDate: `6M Cycle · Month ${monthIdx} (${halfMonth})`,
        price: Math.round(p * 100) / 100,
        volume: Math.round(45000 + rand() * 110000),
      });
    }
  } else {
    // 1Y Macro View: 24 points across 4 fiscal quarters
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const totalPoints = 24;
    const openPrice = Math.max(5, low52 + (high52 - low52) * (0.2 + rand() * 0.3));
    const totalDelta = current - openPrice;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / (totalPoints - 1);
      const qIdx = Math.floor(i / 6);
      const qPart = Math.floor(i % 6) + 1;
      const cycle1 = Math.sin(progress * Math.PI * 2.2) * (current * 0.08 * volMult);
      const cycle2 = Math.cos(progress * Math.PI * 4) * (current * 0.04 * volMult);
      const noise = (rand() - 0.5) * (current * 0.02 * volMult);

      let p = openPrice + totalDelta * progress + cycle1 + cycle2 + noise;
      if (i === totalPoints - 1) p = current;
      if (i === 0) p = openPrice;

      points.push({
        label: i % 6 === 0 ? quarters[qIdx] : `P${qPart}`,
        fullDate: `1Y Macro · ${quarters[qIdx]} (Phase ${qPart})`,
        price: Math.round(p * 100) / 100,
        volume: Math.round(60000 + rand() * 150000),
      });
    }
  }

  // Calculate high, low, open, close, and technical boundaries
  const prices = points.map((pt) => pt.price);
  const periodOpen = points[0]?.price || current;
  const periodClose = points[points.length - 1]?.price || current;
  const periodHigh = Math.max(...prices);
  const periodLow = Math.min(...prices);
  const periodChange = Math.round((periodClose - periodOpen) * 100) / 100;
  const periodChangePercent = Math.round(((periodChange / (periodOpen || 1)) * 100) * 100) / 100;

  // Technical Support & Resistance levels tailored to this timeframe range
  const supportPrice = Math.round((periodLow * 0.994) * 100) / 100;
  const resistancePrice = Math.round((periodHigh * 1.006) * 100) / 100;

  return {
    points,
    periodOpen,
    periodClose,
    periodHigh,
    periodLow,
    supportPrice,
    resistancePrice,
    periodChange,
    periodChangePercent,
    timeframe,
  };
}

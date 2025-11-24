import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const REFRESH_INTERVAL = 1000 * 60 * 5;
const ROWS_PER_PAGE = 10;

const FALLBACK_NAV_LINKS = [
  { label: 'Overview', icon: 'fa-solid fa-house', active: true },
  { label: 'Account settings', icon: 'fa-regular fa-user' },
  { label: 'Wallet', icon: 'fa-solid fa-wallet' },
  { label: 'Payments', icon: 'fa-regular fa-credit-card' },
  { label: 'Transactions', icon: 'fa-solid fa-arrow-right-arrow-left' },
  { label: 'Support Ticket', icon: 'fa-regular fa-life-ring' },
  { label: 'Swap Crypto', icon: 'fa-solid fa-shuffle' },
  { label: 'Stake', icon: 'fa-solid fa-thumbtack' },
];

const FALLBACK_OVERVIEW = {
  name: 'Bitcoin',
  symbol: 'BTC',
  rank: 1,
  price: 84070.66,
  percent_change_24h: -0.53,
  fully_diluted_market_cap: 1_760_000_000_000,
};

const FALLBACK_GLOBAL = {
  total_market_cap: 1_660_000_000_000,
  total_market_cap_change: -0.68,
  total_volume_24h: 37_230_000_000,
  total_volume_change: 45.81,
  btc_dominance: 52.63,
  eth_dominance: 17.21,
  active_cryptocurrencies: 12_089,
  total_exchanges: 619,
  last_updated: '2024-01-01T00:00:00Z',
};

const FALLBACK_MARKET_ROWS = [
  {
    id: 'binance',
    exchange: 'Binance',
    exchange_slug: 'binance',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 16_388_289,
    volume_percent: 6.96,
    confidence_score: 'high',
  },
  {
    id: 'bybit',
    exchange: 'Bybit',
    exchange_slug: 'bybit',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 909_388_289,
    volume_percent: 6.96,
    confidence_score: 'low',
  },
  {
    id: 'bitget',
    exchange: 'Bitget',
    exchange_slug: 'bitget',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 67_388_289,
    volume_percent: 6.96,
    confidence_score: 'high',
  },
  {
    id: 'coinbit',
    exchange: 'COinBIT',
    exchange_slug: 'coinbit',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 80_388_289,
    volume_percent: 6.96,
    confidence_score: 'low',
  },
  {
    id: 'okx',
    exchange: 'OKX',
    exchange_slug: 'okx',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 17_388_289,
    volume_percent: 6.96,
    confidence_score: 'high',
  },
  {
    id: 'mbxe',
    exchange: 'MBXE',
    exchange_slug: 'mbxe',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 78_388_289,
    volume_percent: 6.96,
    confidence_score: 'low',
  },
  {
    id: 'kucoin',
    exchange: 'Kucoin',
    exchange_slug: 'kucoin',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 56_388_289,
    volume_percent: 6.96,
    confidence_score: 'low',
  },
  {
    id: 'gate',
    exchange: 'Gate.in',
    exchange_slug: 'gate',
    pair: 'USDT/BIT',
    price: 40_000,
    depth_plus: 16_388_289,
    depth_minus: 16_388_289,
    volume: 34_388_289,
    volume_percent: 6.96,
    confidence_score: 'high',
  },
];

const BADGE_STYLE_MAP = {
  binance: { bg: 'bg-yellow-500', textColor: 'text-black' },
  bybit: { bg: 'bg-black', textColor: 'text-white', extra: 'border border-white' },
  bitget: { bg: 'bg-blue-500', textColor: 'text-white' },
  coinbit: { bg: 'bg-blue-700', textColor: 'text-white' },
  okx: { bg: 'bg-black', textColor: 'text-white', extra: 'border border-white' },
  mbxe: { bg: 'bg-sky-500', textColor: 'text-white' },
  kucoin: { bg: 'bg-green-500', textColor: 'text-white' },
  gate: { bg: 'bg-slate-800', textColor: 'text-white' },
};

const FALLBACK_BADGE_STYLES = [
  { bg: 'bg-brand-green', textColor: 'text-dark-900' },
  { bg: 'bg-brand-blue', textColor: 'text-white' },
  { bg: 'bg-brand-red', textColor: 'text-white' },
  { bg: 'bg-indigo-500', textColor: 'text-white' },
  { bg: 'bg-purple-500', textColor: 'text-white' },
  { bg: 'bg-amber-500', textColor: 'text-dark-900' },
];

const hashString = (value = '') => {
  let hash = 0;
  const text = value.toLowerCase();

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const badgeForExchange = (slug, name) => {
  if (slug && BADGE_STYLE_MAP[slug]) {
    return {
      text: (name ?? slug ?? '?').slice(0, 1).toUpperCase(),
      ...BADGE_STYLE_MAP[slug],
    };
  }

  const letter = (name ?? slug ?? '?').slice(0, 1).toUpperCase();
  const styles = FALLBACK_BADGE_STYLES[hashString(slug ?? name) % FALLBACK_BADGE_STYLES.length];

  return {
    text: letter,
    ...styles,
  };
};

const confidenceDescriptor = (grade) => {
  if (!grade) {
    return { label: 'N/A', color: 'text-brand-muted' };
  }

  if (typeof grade === 'number') {
    if (grade >= 0.7) {
      return { label: 'High', color: 'text-brand-green' };
    }

    if (grade >= 0.4) {
      return { label: 'Medium', color: 'text-brand-yellow' };
    }

    return { label: 'Low', color: 'text-brand-red' };
  }

  const normalized = grade.toString().toLowerCase();

  if (['a', 'high', 'strong'].some((value) => normalized.includes(value))) {
    return { label: 'High', color: 'text-brand-green' };
  }

  if (['b', 'medium', 'average'].some((value) => normalized.includes(value))) {
    return { label: 'Medium', color: 'text-brand-yellow' };
  }

  if (['c', 'low', 'weak'].some((value) => normalized.includes(value))) {
    return { label: 'Low', color: 'text-brand-red' };
  }

  return { label: grade, color: 'text-brand-muted' };
};

const isNil = (value) => value === null || value === undefined || value === '';

const toNumber = (value) => {
  if (isNil(value)) {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numeric) ? numeric : null;
};

const formatCurrency = (value, options = {}) => {
  const numeric = toNumber(value);

  if (numeric === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
    ...options,
  }).format(numeric);
};

const formatNumber = (value, options = {}) => {
  const numeric = toNumber(value);

  if (numeric === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    ...options,
  }).format(numeric);
};

const formatPercent = (value, digits = 2, { includeSign = true } = {}) => {
  const numeric = toNumber(value);

  if (numeric === null) {
    return '—';
  }

  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : '';
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  const formatted = formatter.format(Math.abs(numeric));

  return includeSign ? `${sign}${formatted}%` : `${formatted}%`;
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
};

const buildDeltaDescriptor = (value) => {
  const numeric = toNumber(value);

  if (numeric === null) {
    return null;
  }

  const tone = numeric >= 0 ? 'up' : 'down';
  const arrow = tone === 'up' ? '▲' : '▼';
  const formatted = formatPercent(Math.abs(numeric), 2, { includeSign: false });

  return {
    text: `${arrow} ${formatted}`,
    tone,
  };
};

const volumePercentValue = (raw) => {
  const numeric = toNumber(typeof raw === 'string' ? raw.replace(/[^0-9+-.]/g, '') : raw);

  if (numeric === null) {
    return null;
  }

  return numeric > 1 ? numeric : numeric * 100;
};

const toMarketRowDisplay = (market) => {
  const badge = badgeForExchange(market.exchange_slug, market.exchange);
  const percentValue = volumePercentValue(market.volume_percent);
  const confidence = confidenceDescriptor(market.confidence_score);

  return {
    ...market,
    badge,
    confidence,
    price: formatCurrency(market.price, {
      notation: 'standard',
      maximumFractionDigits: market.price && market.price < 1 ? 6 : 2,
    }),
    depthPlus: formatCurrency(market.depth_plus, { notation: 'standard', maximumFractionDigits: 0 }),
    depthMinus: formatCurrency(market.depth_minus, { notation: 'standard', maximumFractionDigits: 0 }),
    volume: formatCurrency(market.volume, { notation: 'standard', maximumFractionDigits: 0 }),
    volumePercent: percentValue !== null ? formatPercent(percentValue, 2, { includeSign: false }) : '—',
  };
};

const buildStatCards = (global, overview) => {
  const mergedGlobal = { ...FALLBACK_GLOBAL, ...(global ?? {}) };
  const cards = [
    {
      label: 'Market cap',
      value: formatCurrency(mergedGlobal.total_market_cap),
      delta: buildDeltaDescriptor(mergedGlobal.total_market_cap_change),
    },
    {
      label: 'Volume (24h)',
      value: formatCurrency(mergedGlobal.total_volume_24h),
      delta: buildDeltaDescriptor(mergedGlobal.total_volume_change),
    },
    {
      label: 'FDV',
      value: formatCurrency(overview.fully_diluted_market_cap),
    },
    {
      label: 'Vol/Mkt Cap (24h)',
      value:
        mergedGlobal.total_volume_24h && mergedGlobal.total_market_cap
          ? formatPercent(
              (mergedGlobal.total_volume_24h / mergedGlobal.total_market_cap) * 100,
              2,
              { includeSign: false },
            )
          : '—',
    },
    {
      label: 'BTC Dominance',
      value: formatPercent(mergedGlobal.btc_dominance, 2, { includeSign: false }),
    },
    {
      label: 'ETH Dominance',
      value: formatPercent(mergedGlobal.eth_dominance, 2, { includeSign: false }),
    },
    {
      label: 'Active Cryptos',
      value: formatNumber(mergedGlobal.active_cryptocurrencies, { maximumFractionDigits: 0 }),
    },
    {
      label: 'Total Exchanges',
      value: formatNumber(mergedGlobal.total_exchanges, { maximumFractionDigits: 0 }),
    },
  ];

  return cards;
};

const buildChartPoints = (series = []) =>
  series
    .map((point) => {
      const price = toNumber(point.price);

      if (price === null) {
        return null;
      }

      return {
        timestamp: point.timestamp,
        price,
      };
    })
    .filter(Boolean);

const chartTickFormatter = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return '';
  }
};

const PriceChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-xs text-brand-text">
      <div className="font-semibold">
        {formatCurrency(point.price, { notation: 'standard', maximumFractionDigits: 2 })}
      </div>
      <div className="text-brand-muted">{formatDateTime(point.timestamp)}</div>
    </div>
  );
};

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (mounted) {
          setLoading(true);
        }

        const response = await fetch(`${API_BASE_URL}/api/market-overview`);

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'API responded with an error.');
        }

        const payload = await response.json();

        if (mounted) {
          setData(payload);
          setError('');
        }
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(requestError.message ?? 'Unable to load market data right now.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [data?.markets]);

  const navLinks = useMemo(() => {
    if (Array.isArray(data?.nav_links) && data.nav_links.length > 0) {
      return data.nav_links.map((link, index) => ({
        ...link,
        active: index === 0 ? true : Boolean(link.active),
      }));
    }

    return FALLBACK_NAV_LINKS;
  }, [data]);

  const overview = useMemo(
    () => ({
      ...FALLBACK_OVERVIEW,
      ...(data?.overview ?? {}),
    }),
    [data],
  );

  const global = useMemo(
    () => ({
      ...FALLBACK_GLOBAL,
      ...(data?.global ?? {}),
    }),
    [data],
  );

  const headerPrice = formatCurrency(overview.price, {
    notation: 'standard',
    maximumFractionDigits: overview.price && overview.price < 1 ? 6 : 2,
  });

  const dayChangeNumeric = toNumber(overview.percent_change_24h);
  const dayChangeDescriptor = dayChangeNumeric === null
    ? null
    : {
        icon: dayChangeNumeric >= 0 ? 'fa-caret-up' : 'fa-caret-down',
        tone: dayChangeNumeric >= 0 ? 'text-brand-green' : 'text-brand-red',
        text: formatPercent(Math.abs(dayChangeNumeric), 2, { includeSign: false }),
      };

  const statCards = useMemo(() => buildStatCards(global, overview), [global, overview]);

  const chartPoints = useMemo(() => buildChartPoints(data?.chart ?? []), [data]);
  const chartHasData = chartPoints.length > 0;
  const chartPriceRange = useMemo(() => {
    if (!chartHasData) {
      return null;
    }

    const prices = chartPoints.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return { min, max };
  }, [chartHasData, chartPoints]);

  const marketRows = useMemo(() => {
    const hasMarketData = Array.isArray(data?.markets) && data.markets.length > 0;
    const sourceRows = hasMarketData ? data.markets : FALLBACK_MARKET_ROWS;

    return sourceRows.map((market) => toMarketRowDisplay(market));
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(marketRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return marketRows.slice(start, end);
  }, [marketRows, page]);

  useEffect(() => {
    setPage((prev) => {
      if (prev > totalPages) {
        return totalPages;
      }

      if (prev < 1) {
        return 1;
      }

      return prev;
    });
  }, [totalPages]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const buffer = new Set([1, totalPages, page - 1, page, page + 1]);

    if (page <= 3) {
      buffer.add(2);
      buffer.add(3);
      buffer.add(4);
    }

    if (page >= totalPages - 2) {
      buffer.add(totalPages - 1);
      buffer.add(totalPages - 2);
      buffer.add(totalPages - 3);
    }

    const ordered = Array.from(buffer)
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);

    return ordered.reduce((acc, value) => {
      if (acc.length === 0) {
        acc.push(value);
        return acc;
      }

      const last = acc[acc.length - 1];

      if (typeof last === 'number' && value - last > 1) {
        acc.push('ellipsis');
      }

      acc.push(value);
      return acc;
    }, []);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-40 h-16 border-b border-dark-700 flex items-center justify-between bg-dark-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-brand-text font-semibold text-lg">
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-dark-900">
              <i className="fa-brands fa-bitcoin text-xl" aria-hidden="true"></i>
            </div>
            <span>Crypto currency</span>
          </div>
          <div className="bg-dark-700 rounded-full p-1 flex items-center w-14 h-7 relative cursor-pointer">
            <div className="w-5 h-5 bg-brand-green rounded-full shadow-md absolute left-1"></div>
            <i className="fa-solid fa-sun text-xs text-brand-muted absolute right-2" aria-hidden="true"></i>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-brand-muted hover:text-brand-text relative" aria-label="Notifications">
            <i className="fa-regular fa-bell text-xl" aria-hidden="true"></i>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full"></span>
          </button>
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/150?img=32"
              alt="Haylie Kenter"
              className="w-8 h-8 rounded-full border border-dark-700"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-brand-text">Haylie Kenter</span>
              <span className="text-xs text-brand-green cursor-pointer">Logout</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="px-40 h-14 border-b border-dark-700 flex items-center bg-dark-900 overflow-x-auto">
        <div className="flex items-center gap-8 text-sm font-medium text-brand-muted">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className={`flex items-center gap-2 h-12 transition-colors ${
                link.active ? 'text-brand-text border-b-2 border-brand-green' : 'hover:text-brand-text'
              }`}
            >
              <i className={`${link.icon}`} aria-hidden="true"></i>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="px-40 flex-1 py-6 max-w-[1600px] mx-auto w-full">
        {error ? (
          <div className="mb-6 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {error}
          </div>
        ) : null}

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <i className="fa-brands fa-bitcoin text-[#F7931A] text-2xl" aria-hidden="true"></i>
            <h1 className="text-2xl font-bold text-brand-text">{overview.name}</h1>
            <span className="text-xs font-mono text-brand-muted bg-dark-700 px-1.5 py-0.5 rounded">{overview.symbol}</span>
            <span className="text-xs font-mono text-dark-900 bg-brand-green px-1.5 py-0.5 rounded">#{overview.rank}</span>
            <span className="text-xs text-brand-muted">Updated {formatDateTime(global.last_updated)}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-text">{headerPrice}</span>
            {dayChangeDescriptor ? (
              <span className={`text-sm font-medium flex items-center gap-1 ${dayChangeDescriptor.tone}`}>
                <i className={`fa-solid ${dayChangeDescriptor.icon}`} aria-hidden="true"></i>
                {dayChangeDescriptor.text} (1d)
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            {loading && !data
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`stat-skeleton-${index}`}
                    className="h-24 rounded-lg border border-dark-700 bg-dark-800 animate-pulse"
                  ></div>
                ))
              : statCards.map((card) => (
                  <div
                    key={`${card.label}-${card.value}`}
                    className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col justify-center"
                  >
                    <div className="flex items-center gap-1 text-xs text-brand-muted mb-1">
                      {card.label}
                      <i className="fa-regular fa-circle-question" aria-hidden="true"></i>
                    </div>
                    <div className="text-sm font-semibold text-brand-text">{card.value}</div>
                    {card.delta ? (
                      <div
                        className={`text-xs mt-1 ${
                          card.delta.tone === 'down' ? 'text-brand-red' : 'text-brand-green'
                        }`}
                      >
                        {card.delta.text}
                      </div>
                    ) : null}
                  </div>
                ))}
          </div>

          <div className="lg:col-span-9 bg-dark-800 border border-dark-700 rounded-lg min-h-[400px]">
            {chartHasData ? (
              <div className="h-[420px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#0ECB81" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E2329" strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={chartTickFormatter}
                      tick={{ fill: '#8B949E', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={chartPriceRange ? [chartPriceRange.min * 0.98, chartPriceRange.max * 1.02] : ['auto', 'auto']}
                      tickFormatter={(value) => formatCurrency(value, { notation: 'compact', maximumFractionDigits: 1 })}
                      tick={{ fill: '#8B949E', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <RechartsTooltip content={<PriceChartTooltip />} cursor={{ stroke: '#0ECB81', strokeWidth: 1, opacity: 0.2 }} />
                    <Area type="monotone" dataKey="price" stroke="#0ECB81" strokeWidth={2} fill="url(#priceGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[420px] flex items-center justify-center text-brand-muted">
                No chart data available.
              </div>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-xl font-bold text-brand-text mb-6">Alphabitco Market</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-brand-muted text-xs border-b border-dark-700">
                  <th className="py-4 font-medium">Exchange</th>
                  <th className="py-4 font-medium">Pair</th>
                  <th className="py-4 font-medium">Price</th>
                  <th className="py-4 font-medium">+2% Depth</th>
                  <th className="py-4 font-medium">-2% Depth</th>
                  <th className="py-4 font-medium">Volume (24h)</th>
                  <th className="py-4 font-medium">Volume %</th>
                  <th className="py-4 font-medium text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-brand-text">
                {loading && !data ? (
                  <tr>
                    <td className="py-8 text-center text-brand-muted" colSpan={8}>
                      Loading live market data...
                    </td>
                  </tr>
                ) : marketRows.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-brand-muted" colSpan={8}>
                      No market pairs available for this asset.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id ?? row.exchange}
                      className="border-b border-dark-700 hover:bg-dark-800 transition-colors"
                    >
                      <td className="py-4 flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${row.badge.bg} ${row.badge.textColor} ${row.badge.extra ?? ''}`}
                        >
                          {row.badge.text}
                        </div>
                        {row.exchange}
                      </td>
                      <td className="py-4 text-brand-muted">{row.pair}</td>
                      <td className="py-4">{row.price}</td>
                      <td className="py-4">{row.depthPlus}</td>
                      <td className="py-4">{row.depthMinus}</td>
                      <td className="py-4">{row.volume}</td>
                      <td className="py-4">{row.volumePercent}</td>
                      <td className="py-4 text-right">
                        <span className={`bg-dark-700 px-2 py-1 rounded text-xs ${row.confidence.color}`}>
                          {row.confidence.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-8 gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded bg-dark-800 text-brand-muted hover:bg-dark-700 text-xs disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>

            {pageNumbers.map((value, index) =>
              value === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-brand-muted text-xs">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${value}`}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs ${
                    page === value
                      ? 'bg-brand-green text-dark-900 font-bold'
                      : 'bg-dark-800 text-brand-muted hover:bg-dark-700'
                  }`}
                  onClick={() => setPage(value)}
                  aria-label={`Go to page ${value}`}
                >
                  {value}
                </button>
              ),
            )}

            <button
              className="w-8 h-8 flex items-center justify-center rounded bg-dark-800 text-brand-muted hover:bg-dark-700 text-xs disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-dark-900 border-t border-dark-700 py-12 mt-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="flex items-center justify-center gap-2 text-brand-text font-semibold text-xl mb-6">
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-dark-900">
              <i className="fa-brands fa-bitcoin text-xl" aria-hidden="true"></i>
            </div>
            <span>Crypto currency</span>
          </div>

          <p className="text-brand-muted text-sm mb-8 max-w-2xl mx-auto leading-relaxed">
            Lorem ipsum dolor sit amet consectetur. Euismod curabitur dictum sit ac odio. Tincidunt diam iaculis suscipit
            sem a parturient. Eget in pellentesque id sodales convallis. Ipsum orci vulputate in massa in quis ac. Nisi ac
            elementum placerat enim donec neque. Accumsan massa maecenas posuere convallis in viverra sed donec quisque. Sed
            accumsan et arcu maecenas amet dolor sem quis id. Nam mauris.
          </p>

          <div className="flex justify-center gap-4 mb-12">
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-brand-muted hover:text-brand-green hover:border-brand-green transition-colors"
              aria-label="Facebook"
            >
              <i className="fa-brands fa-facebook-f" aria-hidden="true"></i>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-brand-muted hover:text-brand-green hover:border-brand-green transition-colors"
              aria-label="Instagram"
            >
              <i className="fa-brands fa-instagram" aria-hidden="true"></i>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-brand-muted hover:text-brand-green hover:border-brand-green transition-colors"
              aria-label="X"
            >
              <i className="fa-brands fa-x-twitter" aria-hidden="true"></i>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-brand-muted hover:text-brand-green hover:border-brand-green transition-colors"
              aria-label="LinkedIn"
            >
              <i className="fa-brands fa-linkedin-in" aria-hidden="true"></i>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-brand-muted hover:text-brand-green hover:border-brand-green transition-colors"
              aria-label="YouTube"
            >
              <i className="fa-brands fa-youtube" aria-hidden="true"></i>
            </a>
          </div>

          <div className="text-brand-muted text-xs">&copy; 2024 Cryptobit Theme. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default App;

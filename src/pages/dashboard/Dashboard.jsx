import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/apiService';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SUPPLIER_COLORS_HEX = [
  '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4',
  '#f97316', '#6366f1', '#ec4899', '#14b8a6',
];

const materialColor = (mat) => {
  const u = (mat || '').toUpperCase();
  if (u === 'ARAMIDA') return { bar: 'bg-amber-500', hex: '#f59e0b', badge: 'bg-amber-100 text-amber-800' };
  if (u.startsWith('TENSYLON')) return { bar: 'bg-blue-500', hex: '#3b82f6', badge: 'bg-blue-100 text-blue-800' };
  return { bar: 'bg-slate-400', hex: '#94a3b8', badge: 'bg-slate-100 text-slate-700' };
};

const OPERA_COLOR   = '#3b82f6';
const COMTEC_COLOR  = '#f59e0b';
const OUTROS_COLOR  = '#94a3b8';
const TENSYLON_COLOR = '#8b5cf6';

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <p className="text-slate-500 text-xs font-medium leading-tight">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function HorizontalBar({ label, value, max, colorClass, badge }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-28 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center ${badge}`}>{value}</span>
    </div>
  );
}

function SkeletonBars({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full animate-pulse" />
          <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Daily bar chart for Aramida stacked Opera / Comtec / Outros
function AramidaDailyChart({ dailyData, avg, isCurrentMonth }) {
  const [tooltip, setTooltip] = useState(null);
  const maxVal = Math.max(...dailyData.map((d) => d.total), 1);
  const todayDay = new Date().getDate();
  const avgPct = Math.min((parseFloat(avg) / maxVal) * 100, 100);
  const n = dailyData.length;

  return (
    <div>
      {/* Live hover info */}
      <div className="h-8 flex items-center gap-4 mb-1">
        {tooltip ? (
          <>
            <span className="text-xs font-semibold text-slate-700">Dia {tooltip.day}</span>
            <span className="text-xs" style={{ color: OPERA_COLOR }}>Opera: <b>{tooltip.opera}</b></span>
            <span className="text-xs" style={{ color: COMTEC_COLOR }}>Comtec: <b>{tooltip.comtec}</b></span>
            {tooltip.outros > 0 && (
              <span className="text-xs text-slate-400">Outros: <b>{tooltip.outros}</b></span>
            )}
            <span className="text-xs text-slate-500">Total: <b>{tooltip.total}</b></span>
          </>
        ) : (
          <span className="text-xs text-slate-300">Passe o cursor sobre as barras</span>
        )}
      </div>

      <div className="flex gap-2 mb-8" style={{ height: 160 }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-right pr-1" style={{ minWidth: 24 }}>
          <span className="text-slate-300 text-xs leading-none">{maxVal}</span>
          <span className="text-slate-300 text-xs leading-none">0</span>
        </div>

        {/* Plot area */}
        <div className="flex-1 relative">
          {/* Avg dashed line */}
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ bottom: `${avgPct}%` }}
          >
            <div className="border-t border-dashed border-amber-400 relative">
              <span
                className="absolute right-0 text-xs text-amber-500 bg-white leading-none px-1"
                style={{ transform: 'translateY(-100%)' }}
              >
                ø {avg}/dia
              </span>
            </div>
          </div>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <div
              key={f}
              className="absolute left-0 right-0 border-t border-slate-50"
              style={{ bottom: `${f * 100}%` }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-px">
            {dailyData.map(({ day, total, opera, comtec, outros }, idx) => {
              const isFuture = isCurrentMonth && day > todayDay;
              const isToday  = isCurrentMonth && day === todayDay;
              const barH = (total / maxVal) * 100;
              const isHov = tooltip?.idx === idx;

              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col justify-end h-full cursor-crosshair"
                  onMouseEnter={() => setTooltip({ idx, day, total, opera, comtec, outros })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className={`w-full flex flex-col-reverse rounded-t-sm overflow-hidden transition-opacity ${isToday ? 'ring-1 ring-amber-400' : ''} ${isHov ? 'opacity-75' : ''}`}
                    style={{ height: `${barH}%`, minHeight: total > 0 ? 2 : 0 }}
                  >
                    {isFuture ? (
                      <div className="flex-1 bg-slate-100" />
                    ) : (
                      <>
                        {opera  > 0 && <div style={{ height: `${(opera  / total) * 100}%`, backgroundColor: OPERA_COLOR  }} />}
                        {comtec > 0 && <div style={{ height: `${(comtec / total) * 100}%`, backgroundColor: COMTEC_COLOR }} />}
                        {outros > 0 && <div style={{ height: `${(outros / total) * 100}%`, backgroundColor: OUTROS_COLOR }} />}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className="absolute left-0 right-0 flex" style={{ bottom: -20 }}>
            {dailyData.map(({ day }) =>
              day % 5 === 0 || day === 1 ? (
                <div key={day} className="flex-1 text-center">
                  <span className="text-slate-400 text-xs">{day}</span>
                </div>
              ) : (
                <div key={day} className="flex-1" />
              )
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {[
          { label: 'Opera',  color: OPERA_COLOR  },
          { label: 'Comtec', color: COMTEC_COLOR },
          { label: 'Outros', color: OUTROS_COLOR },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Daily bar chart for Tensylon
function TensylonDailyChart({ dailyData, avg, isCurrentMonth }) {
  const [tooltip, setTooltip] = useState(null);
  const maxVal = Math.max(...dailyData.map((d) => d.total), 1);
  const todayDay = new Date().getDate();
  const avgPct = Math.min((parseFloat(avg) / maxVal) * 100, 100);

  return (
    <div>
      {/* Live hover info */}
      <div className="h-8 flex items-center gap-4 mb-1">
        {tooltip ? (
          <>
            <span className="text-xs font-semibold text-slate-700">Dia {tooltip.day}</span>
            <span className="text-xs" style={{ color: TENSYLON_COLOR }}>Kits: <b>{tooltip.total}</b></span>
          </>
        ) : (
          <span className="text-xs text-slate-300">Passe o cursor sobre as barras</span>
        )}
      </div>

      <div className="flex gap-2 mb-8" style={{ height: 160 }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-right pr-1" style={{ minWidth: 24 }}>
          <span className="text-slate-300 text-xs leading-none">{maxVal}</span>
          <span className="text-slate-300 text-xs leading-none">0</span>
        </div>

        {/* Plot area */}
        <div className="flex-1 relative">
          {/* Avg dashed line */}
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ bottom: `${avgPct}%` }}
          >
            <div className="border-t border-dashed border-violet-400 relative">
              <span
                className="absolute right-0 text-xs text-violet-500 bg-white leading-none px-1"
                style={{ transform: 'translateY(-100%)' }}
              >
                ø {avg}/dia
              </span>
            </div>
          </div>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <div
              key={f}
              className="absolute left-0 right-0 border-t border-slate-50"
              style={{ bottom: `${f * 100}%` }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-px">
            {dailyData.map(({ day, total }, idx) => {
              const isFuture = isCurrentMonth && day > todayDay;
              const isToday  = isCurrentMonth && day === todayDay;
              const barH = (total / maxVal) * 100;
              const isHov = tooltip?.idx === idx;

              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col justify-end h-full cursor-crosshair"
                  onMouseEnter={() => setTooltip({ idx, day, total })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className={`w-full rounded-t-sm transition-opacity ${isToday ? 'ring-1 ring-violet-400' : ''} ${isHov ? 'opacity-75' : ''}`}
                    style={{
                      height: `${barH}%`,
                      minHeight: total > 0 ? 2 : 0,
                      backgroundColor: isFuture ? '#f1f5f9' : TENSYLON_COLOR,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className="absolute left-0 right-0 flex" style={{ bottom: -20 }}>
            {dailyData.map(({ day }) =>
              day % 5 === 0 || day === 1 ? (
                <div key={day} className="flex-1 text-center">
                  <span className="text-slate-400 text-xs">{day}</span>
                </div>
              ) : (
                <div key={day} className="flex-1" />
              )
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TENSYLON_COLOR }} />
          <span className="text-xs text-slate-500">Tensylon</span>
        </div>
      </div>
    </div>
  );
}

// Supplier kits bar (no layers)
function SupplierKitsBar({ data }) {
  const maxKits = data[0]?.kits || 1;
  return (
    <div className="space-y-3">
      {data.map(({ supplier, kits }, idx) => (
        <div key={supplier} className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: SUPPLIER_COLORS_HEX[idx % SUPPLIER_COLORS_HEX.length] }}
          />
          <span className="text-sm text-slate-600 w-28 shrink-0 truncate" title={supplier}>{supplier}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(kits / maxKits) * 100}%`,
                backgroundColor: SUPPLIER_COLORS_HEX[idx % SUPPLIER_COLORS_HEX.length],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 min-w-[2rem] text-right">{kits}</span>
        </div>
      ))}
    </div>
  );
}

// Supplier evolution line chart (cumulative kits per supplier)
function SupplierEvolutionChart({ evolutionData, isCurrentMonth }) {
  const { suppliers, days } = evolutionData;
  const [tooltip, setTooltip] = useState(null);
  const todayDay = new Date().getDate();
  const H = 120;

  const cumulative = useMemo(() => {
    return suppliers.map((sup) => {
      let cum = 0;
      return days.map((d) => { cum += d[sup] || 0; return cum; });
    });
  }, [suppliers, days]);

  const maxY = Math.max(...cumulative.flat(), 1);
  const n = days.length;

  const getX = (i) => n <= 1 ? 50 : (i / (n - 1)) * 100;
  const getY = (v) => H - (v / maxY) * H;

  const pathFor = (si) =>
    cumulative[si].map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');

  if (suppliers.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">Nenhum dado disponível.</p>;
  }

  return (
    <div>
      {/* Live hover info */}
      <div className="h-8 flex items-center gap-4 mb-2">
        {tooltip ? (
          <>
            <span className="text-xs font-semibold text-slate-700">Dia {tooltip.day}</span>
            {tooltip.values.map(({ supplier, cum, daily }, i) => (
              <span
                key={supplier}
                className="text-xs"
                style={{ color: SUPPLIER_COLORS_HEX[i % SUPPLIER_COLORS_HEX.length] }}
              >
                {supplier}: <b>{cum}</b>
                {daily > 0 && <span className="opacity-60"> (+{daily})</span>}
              </span>
            ))}
          </>
        ) : (
          <span className="text-xs text-slate-300">Passe o cursor sobre o gráfico</span>
        )}
      </div>

      <div className="flex gap-2" style={{ height: H + 24 }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-right pr-1" style={{ minWidth: 28, height: H }}>
          <span className="text-slate-300 text-xs leading-none">{maxY}</span>
          <span className="text-slate-300 text-xs leading-none">0</span>
        </div>

        {/* SVG + day labels */}
        <div className="flex-1 relative" style={{ height: H + 24 }}>
          <svg
            viewBox={`0 0 100 ${H}`}
            preserveAspectRatio="none"
            className="absolute top-0 left-0 w-full overflow-visible"
            style={{ height: H }}
          >
            {/* Grid */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" y1={H * f} x2="100" y2={H * f} stroke="#f1f5f9" strokeWidth="0.5" />
            ))}

            {/* Today vertical */}
            {isCurrentMonth && (
              <line
                x1={getX(todayDay - 1)} y1={0}
                x2={getX(todayDay - 1)} y2={H}
                stroke="#93c5fd" strokeWidth="0.5" strokeDasharray="2,2"
              />
            )}

            {/* Lines */}
            {suppliers.map((sup, si) => (
              <path
                key={sup}
                d={pathFor(si)}
                fill="none"
                stroke={SUPPLIER_COLORS_HEX[si % SUPPLIER_COLORS_HEX.length]}
                strokeWidth="1.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Cursor line */}
            {tooltip && (
              <line
                x1={getX(tooltip.idx)} y1={0}
                x2={getX(tooltip.idx)} y2={H}
                stroke="#475569" strokeWidth="0.5" strokeDasharray="2,1"
                pointerEvents="none"
              />
            )}

            {/* Dots at cursor */}
            {tooltip && suppliers.map((sup, si) => (
              <circle
                key={sup}
                cx={getX(tooltip.idx)}
                cy={getY(cumulative[si][tooltip.idx])}
                r="2"
                fill={SUPPLIER_COLORS_HEX[si % SUPPLIER_COLORS_HEX.length]}
                stroke="white"
                strokeWidth="0.7"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            ))}

            {/* Invisible hover rects per day */}
            {days.map((d, i) => {
              const xCenter = getX(i);
              const halfStep = n <= 1 ? 50 : 50 / (n - 1);
              return (
                <rect
                  key={i}
                  x={Math.max(0, xCenter - halfStep)}
                  y={0}
                  width={halfStep * 2}
                  height={H}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() =>
                    setTooltip({
                      idx: i,
                      day: d.day,
                      values: suppliers.map((s, si) => ({
                        supplier: s,
                        cum: cumulative[si][i],
                        daily: d[s] || 0,
                      })),
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </svg>

          {/* Day labels */}
          <div className="absolute left-0 right-0 flex" style={{ top: H + 4 }}>
            {days.map(({ day }) =>
              day % 5 === 0 || day === 1 ? (
                <div key={day} className="flex-1 text-center">
                  <span className="text-slate-400 text-xs">{day}</span>
                </div>
              ) : (
                <div key={day} className="flex-1" />
              )
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {suppliers.map((sup, si) => (
          <div key={sup} className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: SUPPLIER_COLORS_HEX[si % SUPPLIER_COLORS_HEX.length] }} />
            <span className="text-xs text-slate-500">{sup}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser } = useAuth();
  const nowRef = useRef(new Date());
  const now = nowRef.current;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  useEffect(() => {
    const update = () =>
      setDateTime(
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).format(new Date())
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/cutting')
      .then((res) => setRecords(res.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const monthRecords = useMemo(() =>
    records.filter((r) => {
      const d = new Date(r.productionDate);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
    [records, year, month]
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── stat computations ────────────────────────────────────────────────────

  const totalMonth = monthRecords.length;

  const avgPerDay = useMemo(() => {
    const elapsed = isCurrentMonth ? now.getDate() : daysInMonth;
    return elapsed > 0 ? (monthRecords.length / elapsed).toFixed(1) : '0.0';
  }, [monthRecords.length, isCurrentMonth, daysInMonth, now]);

  const carsWithOperaMonth = useMemo(() =>
    monthRecords.filter((r) =>
      (r.consumptions || []).some((c) => /opera/i.test(c.supplier || ''))
    ).length,
    [monthRecords]
  );

  const carsWithOperaAll = useMemo(() =>
    records.filter((r) =>
      (r.consumptions || []).some((c) => /opera/i.test(c.supplier || ''))
    ).length,
    [records]
  );

  const tensylonKitsMonth = useMemo(() =>
    monthRecords.filter((r) => /tensylon/i.test(r.material || '')).length,
    [monthRecords]
  );

  // ── daily charts data ────────────────────────────────────────────────────

  const aramidaDailyData = useMemo(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1, total: 0, opera: 0, comtec: 0, outros: 0,
    }));
    monthRecords
      .filter((r) => (r.material || '').toUpperCase() === 'ARAMIDA')
      .forEach((r) => {
        const d = new Date(r.productionDate).getDate() - 1;
        if (d < 0 || d >= daysInMonth) return;
        days[d].total += 1;
        const sups = (r.consumptions || []).map((c) => (c.supplier || '').toLowerCase());
        if (sups.some((s) => s.includes('opera')))        days[d].opera  += 1;
        else if (sups.some((s) => s.includes('comtec'))) days[d].comtec += 1;
        else                                              days[d].outros += 1;
      });
    return days;
  }, [monthRecords, daysInMonth]);

  const tensylonDailyData = useMemo(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0 }));
    monthRecords
      .filter((r) => /tensylon/i.test(r.material || ''))
      .forEach((r) => {
        const d = new Date(r.productionDate).getDate() - 1;
        if (d < 0 || d >= daysInMonth) return;
        days[d].total += 1;
      });
    return days;
  }, [monthRecords, daysInMonth]);

  const aramidaAvg = useMemo(() => {
    const total = aramidaDailyData.reduce((s, d) => s + d.total, 0);
    const elapsed = isCurrentMonth ? now.getDate() : daysInMonth;
    return elapsed > 0 ? (total / elapsed).toFixed(1) : '0.0';
  }, [aramidaDailyData, isCurrentMonth, daysInMonth, now]);

  const tensylonAvg = useMemo(() => {
    const total = tensylonDailyData.reduce((s, d) => s + d.total, 0);
    const elapsed = isCurrentMonth ? now.getDate() : daysInMonth;
    return elapsed > 0 ? (total / elapsed).toFixed(1) : '0.0';
  }, [tensylonDailyData, isCurrentMonth, daysInMonth, now]);

  // ── by material ──────────────────────────────────────────────────────────

  const byMaterial = useMemo(() => {
    const map = {};
    monthRecords.forEach((r) => {
      const key = (r.material || 'Outros').toUpperCase();
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthRecords]);

  // ── by supplier kits ─────────────────────────────────────────────────────

  const bySupplierKits = useMemo(() => {
    const map = {};
    monthRecords.forEach((r) => {
      (r.consumptions || []).forEach((c) => {
        if (!c.supplier) return;
        if (!map[c.supplier]) map[c.supplier] = new Set();
        map[c.supplier].add(r.id || r.orderNumber);
      });
    });
    return Object.entries(map)
      .map(([supplier, ids]) => ({ supplier, kits: ids.size }))
      .sort((a, b) => b.kits - a.kits);
  }, [monthRecords]);

  // ── supplier evolution (cumulative per day) ──────────────────────────────

  const supplierEvolutionData = useMemo(() => {
    const supplierNames = bySupplierKits.map((s) => s.supplier);
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      ...Object.fromEntries(supplierNames.map((s) => [s, 0])),
    }));
    monthRecords.forEach((r) => {
      const d = new Date(r.productionDate).getDate() - 1;
      if (d < 0 || d >= daysInMonth) return;
      const seen = new Set();
      (r.consumptions || []).forEach((c) => {
        if (!c.supplier || seen.has(c.supplier) || !supplierNames.includes(c.supplier)) return;
        seen.add(c.supplier);
        days[d][c.supplier] = (days[d][c.supplier] || 0) + 1;
      });
    });
    return { suppliers: supplierNames, days };
  }, [monthRecords, daysInMonth, bySupplierKits]);

  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Início</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bem-vindo, <span className="text-slate-700 font-medium">{currentUser?.name}</span>
          </p>
        </div>
        <p className="text-slate-400 text-xs tabular-nums">{dateTime}</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-700 min-w-[9rem] text-center">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            className="text-xs text-blue-600 hover:underline"
          >
            Mês atual
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label={`Kits cortados — ${MONTH_NAMES[month]}`}
          value={loading ? '—' : totalMonth}
          sub="registros no mês"
          color="bg-blue-50"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243 4.243" />
            </svg>
          }
        />
        <StatCard
          label="Média por dia"
          value={loading ? '—' : avgPerDay}
          sub="kits/dia (dias decorridos)"
          color="bg-sky-50"
          icon={
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label={`Carros c/ Opera — ${MONTH_NAMES[month]}`}
          value={loading ? '—' : carsWithOperaMonth}
          sub="kits com fornecedor Opera"
          color="bg-violet-50"
          icon={
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="Carros c/ Opera — histórico"
          value={loading ? '—' : carsWithOperaAll}
          sub="acumulado geral"
          color="bg-amber-50"
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label={`Kits Tensylon — ${MONTH_NAMES[month]}`}
          value={loading ? '—' : tensylonKitsMonth}
          sub="kits de Tensylon no mês"
          color="bg-emerald-50"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
      </div>

      {/* Daily charts — Aramida | Tensylon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Aramida */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Aramida por dia</h2>
              <p className="text-xs text-slate-400">{MONTH_NAMES[month]} {year} · Opera vs Comtec</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Média</p>
              <p className="text-sm font-bold text-amber-600">{loading ? '—' : aramidaAvg} kit/dia</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <AramidaDailyChart
              dailyData={aramidaDailyData}
              avg={aramidaAvg}
              isCurrentMonth={isCurrentMonth}
            />
          )}
        </div>

        {/* Tensylon */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Tensylon por dia</h2>
              <p className="text-xs text-slate-400">{MONTH_NAMES[month]} {year}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Média</p>
              <p className="text-sm font-bold text-violet-600">{loading ? '—' : tensylonAvg} kit/dia</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <TensylonDailyChart
              dailyData={tensylonDailyData}
              avg={tensylonAvg}
              isCurrentMonth={isCurrentMonth}
            />
          )}
        </div>
      </div>

      {/* Bottom row — by material | by supplier kits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* By material */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Kits por material</h2>
          <p className="text-xs text-slate-400 mb-4">{MONTH_NAMES[month]} {year}</p>
          {loading ? (
            <SkeletonBars rows={3} />
          ) : byMaterial.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nenhum registro neste período.</p>
          ) : (
            <div className="space-y-3">
              {byMaterial.map(([mat, count]) => {
                const cfg = materialColor(mat);
                return (
                  <HorizontalBar
                    key={mat}
                    label={mat}
                    value={count}
                    max={byMaterial[0][1]}
                    colorClass={cfg.bar}
                    badge={cfg.badge}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* By supplier kits */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Kits por fornecedor</h2>
          <p className="text-xs text-slate-400 mb-4">{MONTH_NAMES[month]} {year}</p>
          {loading ? (
            <SkeletonBars rows={4} />
          ) : bySupplierKits.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nenhum registro neste período.</p>
          ) : (
            <SupplierKitsBar data={bySupplierKits} />
          )}
        </div>
      </div>

      {/* Supplier evolution chart — full width */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Evolução por fornecedor</h2>
            <p className="text-xs text-slate-400">{MONTH_NAMES[month]} {year} · kits acumulados ao longo do mês</p>
          </div>
        </div>
        {loading ? (
          <div className="h-40 bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <SupplierEvolutionChart
            evolutionData={supplierEvolutionData}
            isCurrentMonth={isCurrentMonth}
          />
        )}
      </div>
    </div>
  );
}

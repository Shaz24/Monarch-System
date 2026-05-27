interface HeatmapProps {
  /** Array of { date: string (YYYY-MM-DD), value: number } */
  data: Array<{ date: string; value: number }>;
  /** Number of weeks to show (columns) */
  weeks?: number;
  /** Color stops from low to high */
  colors?: string[];
  /** Max value for colour scaling (auto if not set) */
  maxValue?: number;
  className?: string;
  cellSize?: number;
  gap?: number;
}

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

export const Heatmap = ({
  data,
  weeks = 20,
  colors = [
    'var(--heatmap-empty)',
    'rgba(124,58,237,0.2)',
    'rgba(124,58,237,0.4)',
    'rgba(124,58,237,0.65)',
    'rgba(167,139,250,0.85)',
    '#F59E0B',
  ],
  maxValue,
  className = '',
  cellSize = 14,
  gap = 3,
}: HeatmapProps) => {
  // Build date→value lookup
  const lookup = new Map<string, number>();
  data.forEach((d) => lookup.set(d.date, d.value));

  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  // Generate grid: weeks × 7 days, ending today
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);
  // Align to start of week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const grid: Array<Array<{ date: string; value: number }>> = [];
  const d = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: Array<{ date: string; value: number }> = [];
    for (let day = 0; day < 7; day++) {
      const key = d.toISOString().split('T')[0];
      const isFuture = d > today;
      week.push({ date: key, value: isFuture ? -1 : (lookup.get(key) ?? 0) });
      d.setDate(d.getDate() + 1);
    }
    grid.push(week);
  }

  const getColor = (value: number) => {
    if (value < 0) return 'transparent';
    if (value === 0) return colors[0];
    const ratio = Math.min(value / max, 1);
    const idx = Math.round(ratio * (colors.length - 1));
    return colors[Math.min(idx, colors.length - 1)];
  };

  // Month labels
  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  const mStart = new Date(startDate);
  for (let w = 0; w < weeks; w++) {
    const month = mStart.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        label: mStart.toLocaleString('default', { month: 'short' }),
        col: w,
      });
      lastMonth = month;
    }
    mStart.setDate(mStart.getDate() + 7);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Month labels */}
      <div className="relative h-3.5 w-full">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute font-mono text-[9px] text-text-muted uppercase tracking-wider"
            style={{ left: 22 + m.col * (cellSize + gap) }}
          >
            {m.label}
          </span>
        ))}
      </div>
      {/* Grid */}
      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col mr-1" style={{ gap }}>
          {DAY_LABELS.map((lbl, i) => (
            <div key={i} className="font-mono text-[8px] text-text-muted/65 flex items-center justify-end" style={{ width: 18, height: cellSize }}>
              {lbl}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="flex" style={{ gap }}>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="rounded-[3px] transition-colors duration-200 hover:ring-1 hover:ring-border-bright"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: getColor(cell.value),
                    opacity: cell.value < 0 ? 0 : 1,
                  }}
                  title={cell.value >= 0 ? `${cell.date}: ${cell.value}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

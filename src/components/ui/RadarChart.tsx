import { motion } from 'framer-motion';

interface RadarChartProps {
  /** Array of { label: string, value: number (0-100) } */
  stats: Array<{ label: string; value: number }>;
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  gridColor?: string;
  labelColor?: string;
  className?: string;
}

export const RadarChart = ({
  stats,
  size = 260,
  fillColor = 'rgba(124, 58, 237, 0.2)',
  strokeColor = '#A78BFA',
  gridColor = 'rgba(255,255,255,0.06)',
  labelColor = 'rgba(255,255,255,0.5)',
  className = '',
}: RadarChartProps) => {
  const n = stats.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 36; // padding for labels

  const angleSlice = (2 * Math.PI) / n;

  // Generate polygon points for a given radius ratio (0-1)
  const polygonPoints = (ratios: number[]) =>
    ratios
      .map((ratio, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const r = maxR * Math.max(0, Math.min(1, ratio));
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(' ');

  // Grid levels
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Axis lines
  const axes = stats.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
      x2: cx + maxR * Math.cos(angle),
      y2: cy + maxR * Math.sin(angle),
    };
  });

  // Label positions
  const labels = stats.map((s, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelR = maxR + 20;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      label: s.label,
    };
  });

  // Data polygon
  const dataRatios = stats.map((s) => s.value / 100);
  const dataPoints = polygonPoints(dataRatios);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Grid polygons */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(Array(n).fill(level))}
            fill="none"
            stroke={gridColor}
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axes.map((axis, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={axis.x2} y2={axis.y2}
            stroke={gridColor} strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <motion.polygon
          points={dataPoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data points */}
        {stats.map((s, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          const r = maxR * Math.max(0, Math.min(1, s.value / 100));
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          return (
            <motion.circle
              key={i}
              cx={px} cy={py} r={3.5}
              fill={strokeColor}
              stroke="rgba(0,0,0,0.5)" strokeWidth="1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
            />
          );
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x} y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono"
            style={{
              fontSize: '9px',
              fill: labelColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

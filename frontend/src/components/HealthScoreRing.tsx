interface HealthScoreRingProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): { stroke: string; fill: string } {
  if (score >= 80) return { stroke: "#22c55e", fill: "#22c55e" };
  if (score >= 50) return { stroke: "#eab308", fill: "#eab308" };
  return { stroke: "#ef4444", fill: "#ef4444" };
}

export function HealthScoreRing({ score, size = 80 }: HealthScoreRingProps) {
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const { stroke, fill } = getScoreColor(clamped);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Health Score: ${Math.round(clamped)}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={fill}
          fontSize={14}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {Math.round(clamped)}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground">Health Score</span>
    </div>
  );
}

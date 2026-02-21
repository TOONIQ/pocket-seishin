"use client";

interface IncomeRingProps {
  earned: number;
  target: number;
  size?: number;
}

export function IncomeRing({ earned, target, size = 140 }: IncomeRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(earned / target, 1) : 0;
  const offset = circumference - progress * circumference;

  const formatYen = (amount: number) => {
    if (amount >= 10000) {
      return `¥${Math.floor(amount / 10000)}万${amount % 10000 > 0 ? Math.floor((amount % 10000) / 1000) + "千" : ""}`;
    }
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={progress >= 1 ? "text-green-400" : "text-cyan-400"}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">
            ¥{earned.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            / ¥{target.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

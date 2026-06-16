import React from 'react';
import type { FastingStatus } from '../types';

/** 格式化秒数为 HH:MM:SS */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 格式化 ISO 时间为 HH:MM */
function formatClockTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface TimerDisplayProps {
  startTimeISO: string | null;
  endTimeISO: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  status: FastingStatus;
}

/** 单个时间行 */
const TimeRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight = false,
}) => (
  <div className="flex justify-between items-center py-2 px-4 rounded-lg bg-white/60">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`font-mono font-semibold ${highlight ? 'text-fast-green-dark text-lg' : 'text-gray-700'}`}>
      {value}
    </span>
  </div>
);

/**
 * 时间显示面板
 * 展示开始时间、预计结束时间、已过时间、剩余时间
 */
const TimerDisplay: React.FC<TimerDisplayProps> = ({
  startTimeISO,
  endTimeISO,
  elapsedSeconds,
  remainingSeconds,
  status,
}) => {
  if (status === 'IDLE') {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center text-gray-400 text-sm py-4">
          点击下方按钮开始您的 24 小时轻断食之旅
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-1.5">
      <TimeRow label="开始时间" value={formatClockTime(startTimeISO)} />
      <TimeRow label="预计结束" value={formatClockTime(endTimeISO)} />
      <TimeRow label="已过时间" value={formatTime(elapsedSeconds)} />
      <TimeRow label="剩余时间" value={formatTime(remainingSeconds)} highlight />
    </div>
  );
};

export default TimerDisplay;

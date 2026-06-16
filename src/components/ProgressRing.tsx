import React from 'react';
import type { FastingStatus } from '../types';

/** 格式化秒数为 HH:MM:SS */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface ProgressRingProps {
  /** 进度百分比 0-100 */
  progressPercent: number;
  /** 当前阶段颜色 */
  phaseColor: string;
  /** 剩余秒数 */
  remainingSeconds: number;
  /** 当前状态 */
  status: FastingStatus;
}

// SVG 常量
const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 130;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * 圆形进度环组件
 * 使用 SVG 实现，中央显示剩余时间
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  progressPercent,
  phaseColor,
  remainingSeconds,
  status,
}) => {
  // 计算 dashOffset：从顶部 (12 点钟方向) 开始顺时针填充
  const dashOffset = CIRCUMFERENCE * (1 - progressPercent / 100);

  // 根据状态决定中央文字
  const centerLabel: string = (() => {
    switch (status) {
      case 'IDLE':
        return formatTime(remainingSeconds);
      case 'FASTING':
        return formatTime(remainingSeconds);
      case 'COMPLETED':
        return '🎉 完成!';
      default:
        return formatTime(remainingSeconds);
    }
  })();

  const isSmallText: boolean = status === 'COMPLETED' || (status === 'FASTING' && remainingSeconds > 36000);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90 drop-shadow-lg"
        aria-label={`断食进度：${Math.round(progressPercent)}%`}
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* 背景圆环 */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE_WIDTH}
        />
        {/* 进度圆环 */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={phaseColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="progress-ring-transition"
        />
      </svg>
      {/* 中央文字覆盖层 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold text-gray-800 leading-tight ${
            isSmallText ? 'text-2xl' : 'text-4xl'
          }`}
        >
          {centerLabel}
        </span>
        {status === 'FASTING' && (
          <span className="text-sm text-gray-500 mt-1">
            {Math.round(progressPercent)}%
          </span>
        )}
        {status === 'COMPLETED' && (
          <span className="text-sm text-gray-500 mt-1">24小时达成</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;

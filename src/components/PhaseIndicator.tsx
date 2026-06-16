import React from 'react';
import type { PhaseInfo, FastingStatus } from '../types';
import { PHASES } from '../constants';

interface PhaseIndicatorProps {
  phase: PhaseInfo;
  status: FastingStatus;
}

/**
 * 获取阶段进度条中各阶段的宽度百分比
 */
function getPhaseBarPhases(): Array<PhaseInfo & { widthPercent: number }> {
  return PHASES.map((p) => ({
    ...p,
    widthPercent: ((p.endHour - p.startHour) / 24) * 100,
  }));
}

/**
 * 阶段指示器组件
 * 显示当前断食阶段（图标 + 名称 + 描述）以及阶段进度条
 */
const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase, status }) => {
  const barPhases = getPhaseBarPhases();

  if (status === 'IDLE') {
    return (
      <div className="w-full max-w-sm text-center py-2">
        <div className="text-3xl mb-1">⏳</div>
        <div className="text-gray-500 text-sm">准备开始轻断食</div>
        {/* IDLE 状态下仍显示阶段条供参考 */}
        <div className="flex w-full h-2 rounded-full overflow-hidden mt-2 bg-gray-100">
          {barPhases.map((p) => (
            <div
              key={p.key}
              style={{ width: `${p.widthPercent}%`, backgroundColor: p.color }}
              title={`${p.name}: ${p.description}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
          <span>0h</span>
          <span>4h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      {/* 当前阶段大号显示 */}
      <div className="flex items-center justify-center gap-3 mb-1">
        <span className="text-4xl leading-none">{phase.icon}</span>
        <div className="text-left">
          <h2
            className="text-xl font-bold leading-tight"
            style={{ color: phase.color }}
          >
            {phase.name}
          </h2>
          <p className="text-sm text-gray-500">{phase.description}</p>
        </div>
      </div>

      {/* 阶段进度条 */}
      <div className="flex w-full h-2.5 rounded-full overflow-hidden mt-2 bg-gray-100">
        {barPhases.map((p) => {
          const isActive = p.key === phase.key;
          const isPassed =
            PHASES.findIndex((ph) => ph.key === p.key) <
            PHASES.findIndex((ph) => ph.key === phase.key);
          return (
            <div
              key={p.key}
              style={{
                width: `${p.widthPercent}%`,
                backgroundColor: isActive || isPassed ? p.color : '#E5E7EB',
                opacity: isActive ? 1 : isPassed ? 0.6 : 0.3,
              }}
              title={`${p.name}: ${p.description}`}
              className="transition-all duration-700"
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
        <span>0h</span>
        <span>4h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>
    </div>
  );
};

export default PhaseIndicator;

import React from 'react';
import { useFastingTimer } from './hooks/useFastingTimer';
import ProgressRing from './components/ProgressRing';
import TimerDisplay from './components/TimerDisplay';
import PhaseIndicator from './components/PhaseIndicator';
import ControlButtons from './components/ControlButtons';
import HistoryList from './components/HistoryList';

/**
 * 轻断食计时器 - 主应用组件
 * 单页面布局，移动端优先的响应式设计
 */
const App: React.FC = () => {
  const timer = useFastingTimer();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
        {/* 标题 */}
        <header className="text-center pt-2">
          <h1 className="text-2xl font-bold text-fast-green-dark tracking-wide">
            轻断食计时器
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            24 小时科学断食计划
          </p>
        </header>

        {/* 阶段指示器 */}
        <PhaseIndicator phase={timer.phase} status={timer.status} />

        {/* 圆形进度环 */}
        <ProgressRing
          progressPercent={timer.progressPercent}
          phaseColor={timer.phase.color}
          remainingSeconds={timer.remainingSeconds}
          status={timer.status}
        />

        {/* 时间详情面板 */}
        <TimerDisplay
          startTimeISO={timer.startTimeISO}
          endTimeISO={timer.endTimeISO}
          elapsedSeconds={timer.elapsedSeconds}
          remainingSeconds={timer.remainingSeconds}
          status={timer.status}
        />

        {/* 操作按钮 */}
        <ControlButtons
          status={timer.status}
          onStart={timer.startFasting}
          onEnd={timer.endFasting}
          onReset={timer.resetFasting}
        />

        {/* 历史记录 */}
        <HistoryList history={timer.history} />
      </div>
    </div>
  );
};

export default App;

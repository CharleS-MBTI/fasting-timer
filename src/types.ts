/** 断食阶段标识 */
export type FastingPhase = 'digesting' | 'glycogen' | 'fat-burning' | 'deep-fat-burning';

/** 断食状态机状态 */
export type FastingStatus = 'IDLE' | 'FASTING' | 'COMPLETED';

/** 阶段信息定义 */
export interface PhaseInfo {
  key: FastingPhase;
  name: string;
  icon: string;
  description: string;
  color: string;
  startHour: number;
  endHour: number;
}

/** 一次断食记录 */
export interface FastingRecord {
  /** 唯一标识 */
  id: string;
  /** 日期字符串 (YYYY-MM-DD) */
  date: string;
  /** 开始时间 ISO 字符串 */
  startTimeISO: string;
  /** 结束时间 ISO 字符串 */
  endTimeISO: string;
  /** 实际断食持续秒数 */
  durationSeconds: number;
  /** 是否完成 24 小时 */
  completed: boolean;
}

/** 持久化的计时器状态 */
export interface TimerState {
  status: FastingStatus;
  startTimeISO: string | null;
  endTimeISO: string | null;
}

/** useFastingTimer Hook 返回值 */
export interface FastingTimerReturn {
  status: FastingStatus;
  startTimeISO: string | null;
  endTimeISO: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  /** 当前阶段信息，IDLE 时为第一阶段 */
  phase: PhaseInfo;
  /** 已完成的百分比 (0-100) */
  progressPercent: number;
  /** 历史记录列表 */
  history: FastingRecord[];
  /** 开始断食 */
  startFasting: () => void;
  /** 手动结束断食（提前结束），会自动保存到历史 */
  endFasting: () => void;
  /** 重置计时器（仅在 COMPLETED 状态可用） */
  resetFasting: () => void;
}

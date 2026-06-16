import type { PhaseInfo } from './types';

/** 轻断食总时长（秒）：24 小时 */
export const FASTING_DURATION_SECONDS: number = 24 * 60 * 60;

/** 四个断食阶段定义 */
export const PHASES: PhaseInfo[] = [
  {
    key: 'digesting',
    name: '消化期',
    icon: '🍽️',
    description: '食物消化中',
    color: '#FF9800',
    startHour: 0,
    endHour: 4,
  },
  {
    key: 'glycogen',
    name: '糖原消耗期',
    icon: '🔋',
    description: '身体开始消耗糖原',
    color: '#FFC107',
    startHour: 4,
    endHour: 12,
  },
  {
    key: 'fat-burning',
    name: '燃脂模式',
    icon: '🔥',
    description: '进入脂肪燃烧状态',
    color: '#FF5722',
    startHour: 12,
    endHour: 18,
  },
  {
    key: 'deep-fat-burning',
    name: '深度燃脂',
    icon: '⚡',
    description: '深度燃脂 & 细胞自噬',
    color: '#D32F2F',
    startHour: 18,
    endHour: 24,
  },
];

/** localStorage 键名常量 */
export const STORAGE_KEYS = {
  TIMER_STATE: 'fasting-timer-state',
  HISTORY: 'fasting-timer-history',
} as const;

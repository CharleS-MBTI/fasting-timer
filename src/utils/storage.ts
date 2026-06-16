import type { TimerState, FastingRecord } from '../types';
import { STORAGE_KEYS } from '../constants';

/**
 * 保存当前计时器状态到 localStorage
 */
export function saveState(state: TimerState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save timer state to localStorage:', e);
  }
}

/**
 * 从 localStorage 恢复计时器状态
 * 返回 null 表示没有保存的状态
 */
export function loadState(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // 基本类型校验
    if (typeof parsed !== 'object' || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.status === 'string' &&
      (obj.status === 'IDLE' || obj.status === 'FASTING' || obj.status === 'COMPLETED')
    ) {
      return {
        status: obj.status as TimerState['status'],
        startTimeISO: typeof obj.startTimeISO === 'string' ? obj.startTimeISO : null,
        endTimeISO: typeof obj.endTimeISO === 'string' ? obj.endTimeISO : null,
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to load timer state from localStorage:', e);
    return null;
  }
}

/**
 * 清除计时器状态
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  } catch (e) {
    console.error('Failed to clear timer state from localStorage:', e);
  }
}

/**
 * 保存历史记录到 localStorage
 */
export function saveHistory(history: FastingRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
}

/**
 * 从 localStorage 加载历史记录
 */
export function loadHistory(): FastingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 简单校验每条记录的结构
    return parsed.filter(
      (item: unknown): item is FastingRecord =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as FastingRecord).id === 'string' &&
        typeof (item as FastingRecord).date === 'string' &&
        typeof (item as FastingRecord).startTimeISO === 'string' &&
        typeof (item as FastingRecord).endTimeISO === 'string' &&
        typeof (item as FastingRecord).durationSeconds === 'number' &&
        typeof (item as FastingRecord).completed === 'boolean'
    );
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
    return [];
  }
}

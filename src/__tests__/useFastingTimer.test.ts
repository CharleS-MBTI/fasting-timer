import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFastingTimer } from '../hooks/useFastingTimer';
import { loadState, loadHistory, saveState, saveHistory } from '../utils/storage';
import { FASTING_DURATION_SECONDS, PHASES } from '../constants';

// Mock 整个 storage 模块
vi.mock('../utils/storage');

const mockLoadState = vi.mocked(loadState);
const mockLoadHistory = vi.mocked(loadHistory);
const mockSaveState = vi.mocked(saveState);
const mockSaveHistory = vi.mocked(saveHistory);

/** 测试基准时间：2024-01-01 00:00:00 UTC */
const BASE_TIME = new Date('2024-01-01T00:00:00Z');

/**
 * 安装测试环境的辅助函数：
 * - 启用 fake timers
 * - 设置系统时间
 * - 重置所有 mock
 */
function setupTestEnvironment() {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME);
  mockLoadState.mockReturnValue(null);
  mockLoadHistory.mockReturnValue([]);
  mockSaveState.mockReset();
  mockSaveHistory.mockReset();
}

describe('useFastingTimer Hook', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== 初始状态 ====================

  describe('初始状态', () => {
    it('初始状态应为 IDLE', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.status).toBe('IDLE');
    });

    it('初始 startTimeISO 应为 null', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.startTimeISO).toBeNull();
    });

    it('初始 endTimeISO 应为 null', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.endTimeISO).toBeNull();
    });

    it('初始 elapsedSeconds 应为 0', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('初始 remainingSeconds 应为 86400 (24h)', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.remainingSeconds).toBe(FASTING_DURATION_SECONDS);
    });

    it('初始 progressPercent 应为 0', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.progressPercent).toBe(0);
    });

    it('初始阶段应为消化期（第一阶段）', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.phase.key).toBe('digesting');
      expect(result.current.phase).toEqual(PHASES[0]);
    });

    it('初始历史记录应为空数组', () => {
      const { result } = renderHook(() => useFastingTimer());
      expect(result.current.history).toEqual([]);
    });
  });

  // ==================== startFasting ====================

  describe('startFasting', () => {
    it('调用后状态变为 FASTING', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.status).toBe('FASTING');
    });

    it('调用后 elapsedSeconds 应为 0', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('调用后 remainingSeconds 应为 86400', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.remainingSeconds).toBe(FASTING_DURATION_SECONDS);
    });

    it('调用后 startTimeISO 应为当前时间 ISO 字符串', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.startTimeISO).toBe(BASE_TIME.toISOString());
    });

    it('调用后 endTimeISO 应为开始时间 + 24h', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      const expectedEnd = new Date(BASE_TIME.getTime() + FASTING_DURATION_SECONDS * 1000);
      expect(result.current.endTimeISO).toBe(expectedEnd.toISOString());
    });

    it('调用后 progressPercent 应为 0', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.progressPercent).toBe(0);
    });
  });

  // ==================== 阶段计算 ====================

  describe('阶段判断（通过推进 fake timers 模拟）', () => {
    /** 辅助函数：开始断食并推进到指定已过秒数 */
    function startAndAdvance(advanceSeconds: number) {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      // 推进时间（每秒触发 interval）
      // 每推进 1000ms 触发一次 interval callback
      act(() => {
        vi.advanceTimersByTime(advanceSeconds * 1000);
      });

      return result;
    }

    it('2小时（7200s）→ 消化期', () => {
      const result = startAndAdvance(7200);
      expect(result.current.phase.key).toBe('digesting');
      expect(result.current.phase.name).toBe('消化期');
    });

    it('6小时（21600s）→ 糖原消耗期', () => {
      const result = startAndAdvance(21600);
      expect(result.current.phase.key).toBe('glycogen');
      expect(result.current.phase.name).toBe('糖原消耗期');
    });

    it('15小时（54000s）→ 燃脂模式', () => {
      const result = startAndAdvance(54000);
      expect(result.current.phase.key).toBe('fat-burning');
      expect(result.current.phase.name).toBe('燃脂模式');
    });

    it('20小时（72000s）→ 深度燃脂', () => {
      const result = startAndAdvance(72000);
      expect(result.current.phase.key).toBe('deep-fat-burning');
      expect(result.current.phase.name).toBe('深度燃脂');
    });

    it('恰好 4小时（14400s）→ 糖原消耗期（边界）', () => {
      const result = startAndAdvance(14400);
      expect(result.current.phase.key).toBe('glycogen');
    });

    it('恰好 12小时（43200s）→ 燃脂模式（边界）', () => {
      const result = startAndAdvance(43200);
      expect(result.current.phase.key).toBe('fat-burning');
    });

    it('恰好 18小时（64800s）→ 深度燃脂（边界）', () => {
      const result = startAndAdvance(64800);
      expect(result.current.phase.key).toBe('deep-fat-burning');
    });
  });

  // ==================== 24h 自动完成 ====================

  describe('自动完成（24小时到达）', () => {
    it('推进 24小时后状态变为 COMPLETED', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.status).toBe('COMPLETED');
    });

    it('完成时 elapsedSeconds 应为 86400', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.elapsedSeconds).toBe(FASTING_DURATION_SECONDS);
    });

    it('完成时 remainingSeconds 应为 0', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.remainingSeconds).toBe(0);
    });

    it('完成时 progressPercent 应为 100', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.progressPercent).toBe(100);
    });

    it('完成时阶段应为深度燃脂（最后阶段）', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.phase.key).toBe('deep-fat-burning');
    });

    it('完成时应自动保存历史记录', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].completed).toBe(true);
      expect(result.current.history[0].durationSeconds).toBe(FASTING_DURATION_SECONDS);
    });
  });

  // ==================== endFasting（手动提前结束） ====================

  describe('endFasting（手动提前结束）', () => {
    it('FASTING 状态下调用 endFasting 后状态变为 IDLE', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      // 推进 3 小时
      act(() => {
        vi.advanceTimersByTime(3 * 3600 * 1000);
      });

      act(() => {
        result.current.endFasting();
      });

      expect(result.current.status).toBe('IDLE');
    });

    it('endFasting 后 startTimeISO 应为 null', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        result.current.endFasting();
      });

      expect(result.current.startTimeISO).toBeNull();
    });

    it('endFasting 后 elapsedSeconds 应重置为 0', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(5 * 3600 * 1000);
      });

      act(() => {
        result.current.endFasting();
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('endFasting 应保存历史记录（未完成标记）', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      // 推进 6 小时后手动结束
      act(() => {
        vi.advanceTimersByTime(6 * 3600 * 1000);
      });

      act(() => {
        result.current.endFasting();
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].completed).toBe(false);
      expect(result.current.history[0].durationSeconds).toBeLessThan(FASTING_DURATION_SECONDS);
    });

    it('IDLE 状态下调用 endFasting 不应崩溃', () => {
      const { result } = renderHook(() => useFastingTimer());

      expect(() => {
        act(() => {
          result.current.endFasting();
        });
      }).not.toThrow();

      expect(result.current.status).toBe('IDLE');
    });
  });

  // ==================== resetFasting ====================

  describe('resetFasting', () => {
    it('COMPLETED 状态下调用 resetFasting 后状态变为 IDLE', () => {
      const { result } = renderHook(() => useFastingTimer());

      // 先完成一次断食
      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(result.current.status).toBe('COMPLETED');

      // 重置
      act(() => {
        result.current.resetFasting();
      });

      expect(result.current.status).toBe('IDLE');
    });

    it('resetFasting 后所有计时值应重置', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      act(() => {
        result.current.resetFasting();
      });

      expect(result.current.startTimeISO).toBeNull();
      expect(result.current.endTimeISO).toBeNull();
      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.remainingSeconds).toBe(FASTING_DURATION_SECONDS);
      expect(result.current.progressPercent).toBe(0);
    });

    it('resetFasting 不应清除历史记录', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      const historyBeforeReset = result.current.history;
      expect(historyBeforeReset).toHaveLength(1);

      act(() => {
        result.current.resetFasting();
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history).toEqual(historyBeforeReset);
    });
  });

  // ==================== 进度百分比 ====================

  describe('progressPercent', () => {
    it('时间过半时 progressPercent 应接近 50', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      // 推进 12 小时（50%）
      act(() => {
        vi.advanceTimersByTime(12 * 3600 * 1000);
      });

      expect(result.current.progressPercent).toBeCloseTo(50, 0);
    });

    it('时间到 75% 时 progressPercent 应接近 75', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(18 * 3600 * 1000);
      });

      expect(result.current.progressPercent).toBeCloseTo(75, 0);
    });

    it('进度不应超过 100', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 5000);
      });

      expect(result.current.progressPercent).toBeLessThanOrEqual(100);
    });
  });

  // ==================== 历史记录去重 ====================

  describe('历史记录去重', () => {
    it('同一 startTimeISO 不应产生多条完成记录', () => {
      // 模拟在 localStorage 中已有该记录的 completed 历史
      const savedRecord = {
        id: 'fast-1704067200000',
        date: '2024-01-01',
        startTimeISO: '2024-01-01T00:00:00.000Z',
        endTimeISO: '2024-01-02T00:00:00.000Z',
        durationSeconds: FASTING_DURATION_SECONDS,
        completed: true,
      };
      mockLoadHistory.mockReturnValue([savedRecord]);

      // 模拟从 localStorage 恢复了正在进行的断食，且 startTime 与历史记录相同
      mockLoadState.mockReturnValue({
        status: 'FASTING',
        startTimeISO: '2024-01-01T00:00:00.000Z',
        endTimeISO: null,
      });

      const { result } = renderHook(() => useFastingTimer());

      // Hook 初始化时应该看到状态为 FASTING（从 localStorage 恢复）
      // 然后推进到完成
      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      // 不应创建重复记录
      expect(result.current.history).toHaveLength(1);
    });
  });

  // ==================== 从 localStorage 恢复状态 ====================

  describe('从 localStorage 恢复状态', () => {
    it('恢复 FASTING 状态：应继续计时', () => {
      // 模拟 2 小时前开始
      const twoHoursAgo = new Date(BASE_TIME.getTime() - 2 * 3600 * 1000);
      mockLoadState.mockReturnValue({
        status: 'FASTING',
        startTimeISO: twoHoursAgo.toISOString(),
        endTimeISO: null,
      });

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.status).toBe('FASTING');
      // 已过约 2 小时
      expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(2 * 3600 - 5);
      expect(result.current.elapsedSeconds).toBeLessThanOrEqual(2 * 3600 + 5);
    });

    it('恢复 FASTING 状态但已过 24h+ → 应自动切换到 COMPLETED', () => {
      // 模拟 25 小时前开始
      const twentyFiveHoursAgo = new Date(BASE_TIME.getTime() - 25 * 3600 * 1000);
      mockLoadState.mockReturnValue({
        status: 'FASTING',
        startTimeISO: twentyFiveHoursAgo.toISOString(),
        endTimeISO: null,
      });

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.status).toBe('COMPLETED');
      expect(result.current.elapsedSeconds).toBe(FASTING_DURATION_SECONDS);
      expect(result.current.remainingSeconds).toBe(0);
    });

    it('恢复 COMPLETED 状态：应保持 COMPLETED', () => {
      mockLoadState.mockReturnValue({
        status: 'COMPLETED',
        startTimeISO: '2024-01-01T00:00:00.000Z',
        endTimeISO: '2024-01-02T00:00:00.000Z',
      });

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.status).toBe('COMPLETED');
    });

    it('恢复 IDLE 状态：应保持 IDLE', () => {
      mockLoadState.mockReturnValue({
        status: 'IDLE',
        startTimeISO: null,
        endTimeISO: null,
      });

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.status).toBe('IDLE');
    });

    it('恢复历史记录', () => {
      const mockHistory = [
        {
          id: 'fast-001',
          date: '2024-01-01',
          startTimeISO: '2024-01-01T00:00:00.000Z',
          endTimeISO: '2024-01-02T00:00:00.000Z',
          durationSeconds: 86400,
          completed: true,
        },
      ];
      mockLoadHistory.mockReturnValue(mockHistory);

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.history).toEqual(mockHistory);
    });

    it('loadState 返回 null 时使用默认 IDLE 状态', () => {
      mockLoadState.mockReturnValue(null);

      const { result } = renderHook(() => useFastingTimer());

      expect(result.current.status).toBe('IDLE');
      expect(result.current.startTimeISO).toBeNull();
    });
  });

  // ==================== 持久化调用 ====================

  describe('持久化', () => {
    it('startFasting 后应调用 saveState', () => {
      const { result } = renderHook(() => useFastingTimer());

      // 清除初始渲染时触发的持久化调用（IDLE 状态）
      mockSaveState.mockClear();

      act(() => {
        result.current.startFasting();
      });

      expect(mockSaveState).toHaveBeenCalledTimes(1);
      const callArg = mockSaveState.mock.calls[0]?.[0];
      expect(callArg).toBeDefined();
      if (callArg) {
        expect(callArg.status).toBe('FASTING');
      }
    });

    it('endFasting 后应调用 saveHistory', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        result.current.endFasting();
      });

      expect(mockSaveHistory).toHaveBeenCalled();
    });

    it('自动完成后应调用 saveHistory', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      expect(mockSaveHistory).toHaveBeenCalled();
    });
  });

  // ==================== 边缘/回归 ====================

  describe('边缘场景', () => {
    it('快速连续操作 startFasting → endFasting → startFasting 不应崩溃', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        result.current.endFasting();
      });

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.status).toBe('FASTING');
    });

    it('在 COMPLETED 后 resetFasting → startFasting 可开始新一轮', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(FASTING_DURATION_SECONDS * 1000 + 1000);
      });

      act(() => {
        result.current.resetFasting();
      });

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.status).toBe('FASTING');
      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('elapsedSeconds 在 FASTING 状态下随 timer 递增', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      expect(result.current.elapsedSeconds).toBe(0);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(5);
    });

    it('remainingSeconds 随 elapsed 递减', () => {
      const { result } = renderHook(() => useFastingTimer());

      act(() => {
        result.current.startFasting();
      });

      act(() => {
        vi.advanceTimersByTime(10 * 1000);
      });

      expect(result.current.remainingSeconds).toBe(FASTING_DURATION_SECONDS - 10);
    });
  });
});

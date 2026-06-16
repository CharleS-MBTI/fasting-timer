import { describe, it, expect, beforeEach } from 'vitest';
import { saveState, loadState, clearState, saveHistory, loadHistory } from '../utils/storage';
import type { TimerState, FastingRecord } from '../types';

/** 构造一个有效的 TimerState 对象 */
function makeState(
  status: TimerState['status'] = 'IDLE',
  startTimeISO: string | null = null,
  endTimeISO: string | null = null,
): TimerState {
  return { status, startTimeISO, endTimeISO };
}

/** 构造一个有效的 FastingRecord 对象 */
function makeRecord(overrides: Partial<FastingRecord> = {}): FastingRecord {
  return {
    id: 'fast-1700000000000',
    date: '2024-01-01',
    startTimeISO: '2024-01-01T00:00:00.000Z',
    endTimeISO: '2024-01-02T00:00:00.000Z',
    durationSeconds: 86400,
    completed: true,
    ...overrides,
  };
}

describe('storage 模块', () => {
  // 每个测试前清空 localStorage
  beforeEach(() => {
    localStorage.clear();
  });

  // ==================== saveState / loadState ====================

  describe('saveState / loadState', () => {
    it('基本读写：saveState 后 loadState 应返回相同数据', () => {
      const state = makeState('FASTING', '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z');
      saveState(state);
      const loaded = loadState();
      expect(loaded).toEqual(state);
    });

    it('loadState 在无保存数据时返回 null', () => {
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('loadState 在 JSON 格式错误时返回 null（不抛异常）', () => {
      localStorage.setItem('fasting-timer-state', '这不是合法的 JSON');
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('loadState 在 status 字段非法时返回 null', () => {
      localStorage.setItem(
        'fasting-timer-state',
        JSON.stringify({ status: 'INVALID_STATUS', startTimeISO: null, endTimeISO: null }),
      );
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('loadState 在存储数据不是 object 时返回 null', () => {
      localStorage.setItem('fasting-timer-state', JSON.stringify('只是一个字符串'));
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('loadState 在存储数据是 array 时返回 null', () => {
      localStorage.setItem('fasting-timer-state', JSON.stringify([{ status: 'IDLE' }]));
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('loadState 在存储数据是 null JSON 时返回 null', () => {
      localStorage.setItem('fasting-timer-state', 'null');
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it('IDLE 状态读写正确', () => {
      const state = makeState('IDLE', null, null);
      saveState(state);
      const loaded = loadState();
      expect(loaded).toEqual(state);
    });

    it('COMPLETED 状态读写正确', () => {
      const state = makeState('COMPLETED', '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z');
      saveState(state);
      const loaded = loadState();
      expect(loaded).toEqual(state);
    });

    it('startTimeISO 不是 string 类型时应 normalize 为 null', () => {
      localStorage.setItem(
        'fasting-timer-state',
        JSON.stringify({ status: 'IDLE', startTimeISO: 12345, endTimeISO: null }),
      );
      const loaded = loadState();
      expect(loaded).not.toBeNull();
      expect(loaded!.startTimeISO).toBeNull();
    });
  });

  // ==================== clearState ====================

  describe('clearState', () => {
    it('clearState 后 loadState 应返回 null', () => {
      saveState(makeState('FASTING', '2024-01-01T00:00:00.000Z', null));
      clearState();
      expect(loadState()).toBeNull();
    });

    it('clearState 在无数据时不抛异常', () => {
      expect(() => clearState()).not.toThrow();
    });
  });

  // ==================== saveHistory / loadHistory ====================

  describe('saveHistory / loadHistory', () => {
    const record = makeRecord();

    it('基本读写：saveHistory 后 loadHistory 应返回相同数据', () => {
      saveHistory([record]);
      const loaded = loadHistory();
      expect(loaded).toEqual([record]);
    });

    it('loadHistory 在无保存数据时返回空数组', () => {
      const loaded = loadHistory();
      expect(loaded).toEqual([]);
    });

    it('loadHistory 在 JSON 格式错误时返回空数组（不抛异常）', () => {
      localStorage.setItem('fasting-timer-history', '这不是合法的 JSON');
      const loaded = loadHistory();
      expect(loaded).toEqual([]);
    });

    it('loadHistory 在存储数据不是 array 时返回空数组', () => {
      localStorage.setItem('fasting-timer-history', JSON.stringify({ a: 1, b: 2 }));
      const loaded = loadHistory();
      expect(loaded).toEqual([]);
    });

    it('loadHistory 应过滤掉字段不全的非法记录', () => {
      localStorage.setItem(
        'fasting-timer-history',
        JSON.stringify([
          record,
          { invalid: true, extra: 'fields' },
          { id: 'partial', date: '2024-01-01' }, // 缺少必要字段
        ]),
      );
      const loaded = loadHistory();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toEqual(record);
    });

    it('loadHistory 应将 id 不是 string 的记录过滤掉', () => {
      const badRecord = { ...record, id: 999 };
      localStorage.setItem('fasting-timer-history', JSON.stringify([record, badRecord]));
      const loaded = loadHistory();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(record.id);
    });

    it('loadHistory 应将 completed 不是 boolean 的记录过滤掉', () => {
      const badRecord = { ...record, completed: 'yes' };
      localStorage.setItem('fasting-timer-history', JSON.stringify([record, badRecord]));
      const loaded = loadHistory();
      expect(loaded).toHaveLength(1);
    });

    it('多次保存后应保持最后一次保存的顺序', () => {
      const r1 = makeRecord({ id: 'fast-001', date: '2024-01-01' });
      const r2 = makeRecord({ id: 'fast-002', date: '2024-01-02' });
      const r3 = makeRecord({ id: 'fast-003', date: '2024-01-03' });

      saveHistory([r1]);
      saveHistory([r2, r1]);
      saveHistory([r3, r2, r1]);

      const loaded = loadHistory();
      expect(loaded).toHaveLength(3);
      expect(loaded[0].id).toBe('fast-003');
      expect(loaded[1].id).toBe('fast-002');
      expect(loaded[2].id).toBe('fast-001');
    });

    it('保存空数组应能正确读回空数组', () => {
      saveHistory([]);
      expect(loadHistory()).toEqual([]);
    });

    it('保存包含不完全完成记录的数据', () => {
      const incompleteRecord = makeRecord({ completed: false, durationSeconds: 7200 });
      saveHistory([incompleteRecord]);
      const loaded = loadHistory();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].completed).toBe(false);
      expect(loaded[0].durationSeconds).toBe(7200);
    });
  });
});

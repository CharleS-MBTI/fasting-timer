import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { FastingStatus, FastingRecord, PhaseInfo, FastingTimerReturn } from '../types';
import { FASTING_DURATION_SECONDS, PHASES } from '../constants';
import { saveState, loadState, loadHistory, saveHistory } from '../utils/storage';

/**
 * 根据已过秒数计算当前阶段
 */
function getPhaseByElapsed(elapsedSeconds: number): PhaseInfo {
  const hours: number = elapsedSeconds / 3600;
  for (const phase of PHASES) {
    if (hours >= phase.startHour && hours < phase.endHour) {
      return phase;
    }
  }
  // 如果恰好等于 24h（elapsedSeconds === FASTING_DURATION_SECONDS）
  return PHASES[PHASES.length - 1];
}

/**
 * 核心计时逻辑 Hook
 * 管理断食状态机：IDLE → FASTING → COMPLETED
 */
export function useFastingTimer(): FastingTimerReturn {
  const [status, setStatus] = useState<FastingStatus>('IDLE');
  const [startTimeISO, setStartTimeISO] = useState<string | null>(null);
  const [endTimeISO, setEndTimeISO] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(FASTING_DURATION_SECONDS);
  const [history, setHistory] = useState<FastingRecord[]>([]);

  // 用于清理 interval 的 ref
  const intervalRef = useRef<number | null>(null);
  // 标记是否首次加载，防止初始化时误触发持久化
  const isInitialMount = useRef<boolean>(true);

  // ---- 初始化：从 localStorage 恢复状态 ----
  useEffect(() => {
    const savedState = loadState();
    const savedHistory = loadHistory();

    setHistory(savedHistory);

    if (savedState && savedState.status === 'FASTING' && savedState.startTimeISO) {
      const startTime = new Date(savedState.startTimeISO).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);

      if (elapsed >= FASTING_DURATION_SECONDS) {
        // 断食已经在离线期间完成
        const endTime = new Date(startTime + FASTING_DURATION_SECONDS * 1000);
        setStatus('COMPLETED');
        setStartTimeISO(savedState.startTimeISO);
        setEndTimeISO(endTime.toISOString());
        setElapsedSeconds(FASTING_DURATION_SECONDS);
        setRemainingSeconds(0);
      } else {
        // 断食仍在进行中
        setStatus('FASTING');
        setStartTimeISO(savedState.startTimeISO);
        setEndTimeISO(savedState.endTimeISO);
        setElapsedSeconds(elapsed);
        setRemainingSeconds(FASTING_DURATION_SECONDS - elapsed);
      }
    } else if (savedState && savedState.status === 'COMPLETED' && savedState.startTimeISO) {
      // 用户之前已完成断食，恢复 COMPLETED 状态
      setStatus('COMPLETED');
      setStartTimeISO(savedState.startTimeISO);
      setEndTimeISO(savedState.endTimeISO);
      setElapsedSeconds(FASTING_DURATION_SECONDS);
      setRemainingSeconds(0);
    }

    isInitialMount.current = false;
  }, []);

  // ---- 计时器：每秒更新 ----
  useEffect(() => {
    if (status !== 'FASTING' || !startTimeISO) return;

    const startTime = new Date(startTimeISO).getTime();

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);

      if (elapsed >= FASTING_DURATION_SECONDS) {
        // 24h 到了，自动完成
        setElapsedSeconds(FASTING_DURATION_SECONDS);
        setRemainingSeconds(0);
        setStatus('COMPLETED');
        setEndTimeISO(new Date(startTime + FASTING_DURATION_SECONDS * 1000).toISOString());

        // 清理 interval
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setElapsedSeconds(elapsed);
        setRemainingSeconds(FASTING_DURATION_SECONDS - elapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, startTimeISO]);

  // ---- 持久化：状态变化时保存到 localStorage ----
  useEffect(() => {
    if (isInitialMount.current) return;
    saveState({ status, startTimeISO, endTimeISO });
  }, [status, startTimeISO, endTimeISO]);

  // ---- 自动保存已完成记录到历史 ----
  useEffect(() => {
    if (isInitialMount.current) return;
    if (status === 'COMPLETED' && startTimeISO) {
      // 使用 functional update 避免 stale closure
      setHistory((prev) => {
        const alreadySaved = prev.some(
          (r) => r.startTimeISO === startTimeISO && r.completed === true
        );
        if (alreadySaved) return prev;
        const startDate = new Date(startTimeISO);
        const record: FastingRecord = {
          id: `fast-${startDate.getTime()}`,
          date: startDate.toISOString().slice(0, 10),
          startTimeISO,
          endTimeISO: endTimeISO || new Date(startDate.getTime() + FASTING_DURATION_SECONDS * 1000).toISOString(),
          durationSeconds: FASTING_DURATION_SECONDS,
          completed: true,
        };
        const updatedHistory = [record, ...prev];
        saveHistory(updatedHistory);
        return updatedHistory;
      });
    }
  }, [status, startTimeISO, endTimeISO]);

  // ---- 计算当前阶段 ----
  const phase: PhaseInfo = useMemo(() => getPhaseByElapsed(elapsedSeconds), [elapsedSeconds]);

  // ---- 计算进度百分比 (0-100) ----
  const progressPercent: number = useMemo(() => {
    if (status === 'IDLE') return 0;
    return Math.min((elapsedSeconds / FASTING_DURATION_SECONDS) * 100, 100);
  }, [elapsedSeconds, status]);

  // ---- 开始断食 ----
  const startFasting = useCallback(() => {
    const now = new Date();
    setStatus('FASTING');
    setStartTimeISO(now.toISOString());
    setEndTimeISO(new Date(now.getTime() + FASTING_DURATION_SECONDS * 1000).toISOString());
    setElapsedSeconds(0);
    setRemainingSeconds(FASTING_DURATION_SECONDS);
  }, []);

  // ---- 手动结束断食（提前结束） ----
  const endFasting = useCallback(() => {
    if (!startTimeISO) return;

    // 清理 interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const now = new Date();
    const startTime = new Date(startTimeISO).getTime();
    const elapsed = Math.floor((now.getTime() - startTime) / 1000);
    const completed = elapsed >= FASTING_DURATION_SECONDS;

    // 保存记录（使用 functional update 避免 stale closure）
    const record: FastingRecord = {
      id: `fast-${startTime}`,
      date: new Date(startTimeISO).toISOString().slice(0, 10),
      startTimeISO,
      endTimeISO: now.toISOString(),
      durationSeconds: Math.min(elapsed, FASTING_DURATION_SECONDS),
      completed,
    };
    setHistory((prev) => {
      const updatedHistory = [record, ...prev];
      saveHistory(updatedHistory);
      return updatedHistory;
    });

    // 重置状态
    setStatus('IDLE');
    setStartTimeISO(null);
    setEndTimeISO(null);
    setElapsedSeconds(0);
    setRemainingSeconds(FASTING_DURATION_SECONDS);
  }, [startTimeISO]);

  // ---- 重置计时器（COMPLETED 后开始新一轮） ----
  const resetFasting = useCallback(() => {
    setStatus('IDLE');
    setStartTimeISO(null);
    setEndTimeISO(null);
    setElapsedSeconds(0);
    setRemainingSeconds(FASTING_DURATION_SECONDS);
  }, []);

  return {
    status,
    startTimeISO,
    endTimeISO,
    elapsedSeconds,
    remainingSeconds,
    phase,
    progressPercent,
    history,
    startFasting,
    endFasting,
    resetFasting,
  };
}

import React from 'react';
import Button from '@mui/material/Button';
import type { FastingStatus } from '../types';

interface ControlButtonsProps {
  status: FastingStatus;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

/**
 * 操作按钮组件
 * - IDLE: 显示"开始断食"按钮
 * - FASTING: 显示"结束断食"按钮
 * - COMPLETED: 显示庆祝信息 + "开始新一轮"按钮
 */
const ControlButtons: React.FC<ControlButtonsProps> = ({
  status,
  onStart,
  onEnd,
  onReset,
}) => {
  if (status === 'IDLE') {
    return (
      <div className="w-full max-w-sm">
        <Button
          variant="contained"
          fullWidth
          onClick={onStart}
          sx={{
            py: 1.8,
            fontSize: '1.125rem',
            fontWeight: 700,
            borderRadius: '9999px',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.5)',
            },
          }}
        >
          🍽️ 开始断食
        </Button>
      </div>
    );
  }

  if (status === 'FASTING') {
    return (
      <div className="w-full max-w-sm">
        <Button
          variant="outlined"
          fullWidth
          color="warning"
          onClick={onEnd}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '9999px',
            textTransform: 'none',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          结束断食
        </Button>
        <p className="text-xs text-gray-400 text-center mt-2">
          提前结束也会保存记录
        </p>
      </div>
    );
  }

  // COMPLETED 状态
  return (
    <div className="w-full max-w-sm text-center space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-pulse-slow">
        <div className="text-2xl mb-1">🎉</div>
        <p className="text-green-800 font-semibold text-lg">恭喜完成！</p>
        <p className="text-green-600 text-sm">
          您已成功完成 24 小时轻断食
        </p>
      </div>
      <Button
        variant="contained"
        fullWidth
        onClick={onReset}
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '9999px',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)',
          },
        }}
      >
        开始新一轮
      </Button>
    </div>
  );
};

export default ControlButtons;

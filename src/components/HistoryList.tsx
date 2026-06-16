import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import type { FastingRecord } from '../types';

/** 格式化秒数为 X小时X分钟 */
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/** 格式化 ISO 为 HH:MM */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface HistoryListProps {
  history: FastingRecord[];
}

/**
 * 断食历史记录列表
 * 使用 MUI List 组件展示，按时间倒序排列
 */
const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="w-full max-w-sm mt-6">
        <div className="flex items-center gap-2 mb-3">
          <HistoryIcon className="text-gray-400" />
          <Typography variant="subtitle1" className="text-gray-500 font-semibold">
            断食记录
          </Typography>
        </div>
        <Paper
          elevation={0}
          className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center"
        >
          <Typography className="text-gray-400 text-sm">
            还没有断食记录
          </Typography>
          <Typography className="text-gray-300 text-xs mt-1">
            完成一次断食后，记录将显示在这里
          </Typography>
        </Paper>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mt-6">
      <div className="flex items-center gap-2 mb-3">
        <HistoryIcon className="text-gray-400" />
        <Typography variant="subtitle1" className="text-gray-500 font-semibold">
          断食记录
        </Typography>
        <Chip
          label={`${history.length} 次`}
          size="small"
          className="text-xs"
          sx={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }}
        />
      </div>
      <Paper elevation={0} className="rounded-xl border border-gray-100 overflow-hidden">
        <List disablePadding>
          {history.map((record, index) => (
            <ListItem
              key={record.id}
              divider={index < history.length - 1}
              className="hover:bg-gray-50 transition-colors"
            >
              <ListItemIcon className="min-w-[40px]">
                {record.completed ? (
                  <CheckCircleIcon className="text-green-500" />
                ) : (
                  <CancelIcon className="text-orange-400" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <span className="text-sm font-medium text-gray-700">
                    {record.date}
                  </span>
                }
                secondary={
                  <span className="text-xs text-gray-400">
                    {formatTime(record.startTimeISO)} · {formatDuration(record.durationSeconds)}
                  </span>
                }
              />
              <Chip
                label={record.completed ? '已完成' : '未完成'}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: record.completed ? '#E8F5E9' : '#FFF3E0',
                  color: record.completed ? '#2E7D32' : '#E65100',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default HistoryList;

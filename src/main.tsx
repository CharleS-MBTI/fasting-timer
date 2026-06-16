import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

/** MUI 主题：绿色系为主，与 Tailwind 配色协调 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
      dark: '#2E7D32',
      light: '#66BB6A',
    },
    secondary: {
      main: '#FF9800',
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 12,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

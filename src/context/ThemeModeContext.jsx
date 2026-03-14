import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import themeBase from '../theme';

const ThemeModeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const theme = useMemo(() => {
    return createTheme({
      ...themeBase,
      palette: {
        ...themeBase.palette,
        mode,
        background: {
          default: mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
          paper: mode === 'dark' ? '#181c24' : '#fff',
        },
        text: {
          primary: mode === 'dark' ? '#fff' : '#1a365d',
          secondary: mode === 'dark' ? 'rgba(255,255,255,0.82)' : '#4b5563',
        },
        divider: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      }
    });
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

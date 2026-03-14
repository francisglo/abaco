import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthContext } from '../context/AuthContext';

const theme = createTheme();

export function customRender(ui, {
  providerProps = {
    value: {
      loginWithGoogle: jest.fn(),
      login: jest.fn(),
      register: jest.fn()
    }
  },
  ...renderOptions
} = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider {...providerProps}>
        {ui}
      </AuthContext.Provider>
    </ThemeProvider>,
    renderOptions
  );
}

export * from '@testing-library/react';

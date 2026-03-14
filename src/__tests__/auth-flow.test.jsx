import React from 'react';
import { customRender as render, screen, fireEvent, waitFor } from './test-utils';
import AuthPage from '../pages/AuthPage.jsx';
import { AuthContext } from '../context/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// Mock assets
jest.mock('../assets/abacoLogoAnimated.png', () => 'abacoLogoAnimated.png');
jest.mock('../assets/abacoLogo.png', () => 'abacoLogo.png');


describe('Flujo de autenticación ÁBACO', () => {
  it('muestra campos y tabs de login', () => {
    render(<AuthPage />);
    expect(screen.getByLabelText(/usuario o correo/i)).toBeInTheDocument();
    expect(screen.getByText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByText(/pin/i)).toBeInTheDocument();
    expect(screen.getByText(/patrón/i)).toBeInTheDocument();
  });

  it('valida registro con contraseña débil', async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText(/crear cuenta/i));
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText(/registrar/i));
    await waitFor(() => {
      expect(screen.getByText(/mayúsculas, minúsculas, número y símbolo/i)).toBeInTheDocument();
    });
  });

  it('valida registro con PIN secuencial', async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText(/crear cuenta/i));
    fireEvent.change(screen.getByLabelText(/pin/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByText(/registrar/i));
    await waitFor(() => {
      expect(screen.getByText(/no puede ser una secuencia simple/i)).toBeInTheDocument();
    });
  });

  it('valida registro con patrón trivial', async () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText(/crear cuenta/i));
    fireEvent.change(screen.getByLabelText(/patrón/i), { target: { value: 'abcd' } });
    fireEvent.click(screen.getByText(/registrar/i));
    await waitFor(() => {
      expect(screen.getByText(/patrón es demasiado simple/i)).toBeInTheDocument();
    });
  });
});

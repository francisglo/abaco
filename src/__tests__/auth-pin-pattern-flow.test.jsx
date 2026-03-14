import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '../pages/AuthPage.jsx';
import { AuthContext } from '../context/AuthContext';
// Mock assets
jest.mock('../assets/abacoLogoAnimated.png', () => 'abacoLogoAnimated.png');
jest.mock('../assets/abacoLogo.png', () => 'abacoLogo.png');

function TestAuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{ loginWithGoogle: jest.fn(), login: jest.fn(), register: jest.fn() }}>
      {children}
    </AuthContext.Provider>
  );
}

describe('Flujo de autenticación avanzada ÁBACO', () => {
  it('permite registro con password, PIN y patrón válidos', async () => {
    render(
      <TestAuthProvider>
        <AuthPage />
      </TestAuthProvider>
    );
    fireEvent.click(screen.getByText(/crear cuenta/i));
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Test Front' } });
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'frontuserpinpat' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'Front1234!' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'Front1234!' } });
    fireEvent.change(screen.getByLabelText(/pin/i), { target: { value: '2580' } });
    fireEvent.change(screen.getByLabelText(/patrón/i), { target: { value: 'xy12!' } });
    fireEvent.click(screen.getByText(/registrar/i));
    await waitFor(() => {
      expect(screen.queryByText(/no se pudo crear la cuenta/i)).not.toBeInTheDocument();
    });
  });

  it('permite login con password, PIN y patrón', async () => {
    render(
      <TestAuthProvider>
        <AuthPage />
      </TestAuthProvider>
    );
    // Login con password
    fireEvent.change(screen.getByLabelText(/usuario o correo/i), { target: { value: 'frontuserpinpat' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Front1234!' } });
    fireEvent.click(screen.getByText(/entrar/i));
    await waitFor(() => {
      expect(screen.queryByText(/no se pudo iniciar sesión/i)).not.toBeInTheDocument();
    });
    // Login con PIN
    fireEvent.change(screen.getByLabelText(/usuario o correo/i), { target: { value: 'frontuserpinpat' } });
    fireEvent.click(screen.getByText(/pin/i));
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '2580' } });
    fireEvent.click(screen.getByText(/entrar/i));
    await waitFor(() => {
      expect(screen.queryByText(/no se pudo iniciar sesión/i)).not.toBeInTheDocument();
    });
    // Login con patrón
    fireEvent.change(screen.getByLabelText(/usuario o correo/i), { target: { value: 'frontuserpinpat' } });
    fireEvent.click(screen.getByText(/patrón/i));
    fireEvent.change(screen.getByLabelText(/patrón/i), { target: { value: 'xy12!' } });
    fireEvent.click(screen.getByText(/entrar/i));
    await waitFor(() => {
      expect(screen.queryByText(/no se pudo iniciar sesión/i)).not.toBeInTheDocument();
    });
  });
});

import React, { createContext, useState } from 'react';
import Modal from '../component/Modal2/Modal2';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTokenError = (message) => {
    if (!hasLoggedOut) {
      setHasLoggedOut(true);
      setErrorMessage(message);
      localStorage.removeItem('authToken');
    }
  };

  const closeModal = () => {
    setErrorMessage('');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ handleTokenError }}>
      {children}
      {errorMessage && (
        <Modal message={errorMessage} onClose={closeModal} />
      )}
    </AuthContext.Provider>
  );
};
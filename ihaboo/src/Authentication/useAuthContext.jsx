import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuthFetch = () => {
  const { handleTokenError } = useContext(AuthContext);

  const customFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        if (data.message === 'Session expired due to login from another device') {
          handleTokenError('Your session has expired because you logged in from another device. Please log in again.');
        } else if (data.message === 'Token is not valid or has expired') {
          handleTokenError('Your session has expired. Please log in again.');
        }
        throw new Error(data.message || 'Unauthorized');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error fetching data');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  return { customFetch };
};

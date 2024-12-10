// src/utils/getUserRole.js
export const getUserRole = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
  
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload)); // Decode the JWT payload
      return decodedPayload.role; // Assuming the role is stored as 'role' in the payload
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };
  
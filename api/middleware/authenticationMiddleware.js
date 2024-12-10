// api/middleware/authenticationMiddleware.js
import jwt from 'jsonwebtoken';
import db from '../db.js'; // Ensure the correct path to your database

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'jwt-secret-key';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted Token:', token);
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, decodedToken) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Token is not valid or has expired' });
    }

    const { userID, tokenVersion } = decodedToken;

    // Include statusID in the query
    const sql = 'SELECT tokenVersion, isFirstLogin, statusID FROM user WHERE userID = ?';
    db.query(sql, [userID], (err, data) => {
      if (err || data.length === 0) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      const { tokenVersion: currentTokenVersion, isFirstLogin, statusID } = data[0];

      if (tokenVersion !== currentTokenVersion) {
        return res.status(401).json({ message: 'Session expired due to login from another device' });
      }

      // Check if the user is logging in for the first time
      if (isFirstLogin && req.path !== '/resetPassword') {
        return res.status(401).json({
          message: 'First login detected, please reset your password',
          redirectUrl: 'http://localhost:5173/resetPassword'
        });
      }

      // Check account status
      if (statusID !== 1 ) { // Assuming 1 is 'Active'
        return res.status(403).json({ message: 'Account is inactive. Access denied.',
          redirectUrl: 'http://localhost:5173/login' });
      }

      req.user = decodedToken;
      next();
    });
  });
};

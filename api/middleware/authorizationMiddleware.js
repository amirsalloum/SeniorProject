// api/middleware/authorizationMiddleware.js

/**
 * Middleware to authorize users based on their roles.
 * @param {...string} allowedRoles - List of roles allowed to access the route.
 * @returns {Function} Middleware function.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user information is available in the request (set by the authentication middleware)
    if (!req.user || !req.user.role) {
      console.error('Authorization Error: No user role found'); // Log the error for debugging
      return res.status(401).json({ message: 'Authorization required: No user role found' });
    }

    // Extract the user's role from the request object
    const { role } = req.user;

    // Check if the user's role is included in the allowed roles for this route
    if (!allowedRoles.includes(role)) {
      console.error(`Access Denied: User role '${role}' does not have permission`); // Log insufficient permission attempt
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // If the role is allowed, proceed to the next middleware or route handler
    next();
  };
};
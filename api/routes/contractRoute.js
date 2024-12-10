// api/routes/contractRoute.js
import express from 'express';
import { createContractType,getContractTypes, deleteContractType } from '../controllers/contract.controller.js';
import { authenticateToken } from '../middleware/authenticationMiddleware.js';  // Ensure this middleware checks for JWT
import { authorizeRoles } from '../middleware/authorizationMiddleware.js'; // Import authorization middleware
const router = express.Router();

// Route to create or update a contract type, only Admin can access this route
router.post(
    '/create-contract',
    authenticateToken,
    authorizeRoles('Admin'), 
    createContractType
  );
  

  router.get('/contract-types',authenticateToken,getContractTypes);

  
  // Route to delete a contract type, only Admin can access this route
  router.delete(
    '/delete-contract/:contractTypeID',
    authenticateToken,
    authorizeRoles('Admin'), 
    deleteContractType
  );
  

export default router;
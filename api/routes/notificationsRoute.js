import express from 'express';
import { getNotifications, markNotificationAsRead , getEmployeeNotifications , markEmployeeNotificationAsRead, deleteNotification ,deleteAllNotifications } from '../controllers/notifications.controller.js';

import { authenticateToken } from '../middleware/authenticationMiddleware.js';

const router = express.Router();

// General User Notifications Routes
router.get('/user-notifications', authenticateToken, getNotifications);
router.put('/mark-as-read', authenticateToken, markNotificationAsRead);

// Employee Specific Notifications Routes (roleID = 4)
router.get('/employee-notifications', authenticateToken, getEmployeeNotifications);
router.put('/employee-notifications/mark-read', authenticateToken, markEmployeeNotificationAsRead);

//Deleting the notification from the panel logic

router.delete('/delete', authenticateToken , deleteNotification );
router.delete('/delete-all', authenticateToken, deleteAllNotifications);


export default router;

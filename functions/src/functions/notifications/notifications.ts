import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { NotificationService } from '../../services/notificationService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Send notification
export const sendNotification = functions.https.onCall(async (data: {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority?: 'low' | 'medium' | 'high';
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'notifications');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await NotificationService.sendNotification(data, context.auth.uid);
    
    return {
      success: true,
      message: 'Notification sent'
    };
  } catch (error) {
    console.error('sendNotification error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get notifications by user
export const getNotifications = functions.https.onCall(async (data: { userId: string; limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'notifications');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const notifications = await NotificationService.getNotificationsByUser(data.userId, data.limit || 50);
    
    return {
      success: true,
      data: notifications
    };
  } catch (error) {
    console.error('getNotifications error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Mark notification as read
export const markNotificationAsRead = functions.https.onCall(async (data: { notificationId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'notifications');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await NotificationService.markAsRead(data.notificationId, context.auth.uid);
    
    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all notifications (admin only)
export const listNotifications = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'notifications');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const notifications = await NotificationService.list(data.limit || 100);
    
    return {
      success: true,
      data: notifications
    };
  } catch (error) {
    console.error('listNotifications error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 
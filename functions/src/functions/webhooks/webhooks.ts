import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { WebhookService } from '../../services/webhookService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';

// Receive webhook event
export const receiveWebhookEvent = functions.https.onCall(async (data: { event: any }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'webhooks');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await WebhookService.receiveEvent(data.event, context.auth.uid);
    
    return {
      success: true,
      message: 'Webhook event received'
    };
  } catch (error) {
    console.error('receiveWebhookEvent error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Retry webhook event
export const retryWebhookEvent = functions.https.onCall(async (data: { eventId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'webhooks');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await WebhookService.retryEvent(data.eventId, context.auth.uid);
    
    return {
      success: true,
      message: 'Webhook event retry initiated'
    };
  } catch (error) {
    console.error('retryWebhookEvent error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get webhook event
export const getWebhookEvent = functions.https.onCall(async (data: { eventId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'webhooks');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const event = await WebhookService.getEvent(data.eventId);
    
    return {
      success: true,
      data: event
    };
  } catch (error) {
    console.error('getWebhookEvent error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List webhook events (admin only)
export const listWebhooks = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'webhooks');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const events = await WebhookService.list(data.limit || 100);
    
    return {
      success: true,
      data: events
    };
  } catch (error) {
    console.error('listWebhooks error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 
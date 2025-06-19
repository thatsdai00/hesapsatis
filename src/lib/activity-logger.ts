import { db } from './db';

export type ActivityLogType = 
  | 'USER_REGISTRATION'
  | 'ORDER_CREATED'
  | 'TICKET_SUBMITTED'
  | 'PRODUCT_ADDED'
  | 'CATEGORY_CREATED'
  | 'STOCK_ADDED'
  | 'SETTINGS_UPDATED'
  | 'BALANCE_REFUND'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET';

interface LogActivityParams {
  type: ActivityLogType;
  message: string;
  userId?: string;
}

/**
 * Logs an activity to the database
 * @param params Object containing type, message, and optional userId
 * @returns The created activity log entry
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const { type, message, userId } = params;
    
    const activityLog = await db.activityLog.create({
      data: {
        type,
        message,
        userId,
      }
    });
    
    console.log(`Activity logged: ${type} - ${message}`);
    return activityLog;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // We don't throw here to prevent breaking the main flow
    // if activity logging fails
    return null;
  }
} 
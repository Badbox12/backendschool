// src/utils/logAdminActivity.ts
import AdminLog from "../models/adminLogModel";
export async function logAdminActivity(adminId: string, action: string, details?: string) {
  try {
    await AdminLog.create({ adminId, action, details });
  } catch (err) {
    console.error("Failed to log admin activity:", err);
  }
}
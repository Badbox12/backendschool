import AdminLog, { AdminLogDocument } from "../models/adminLogModel";
import { Types, isValidObjectId } from "mongoose";

// Type definitions
interface CreateAdminLogParams {
  adminId: Types.ObjectId | string;
  action: string;
  details?: string;
}

interface GetAdminLogsParams {
  adminId: Types.ObjectId | string;
  page?: number;
  limit?: number;
}

// Validation helpers
const validateAdminId = (adminId: unknown): adminId is Types.ObjectId | string => {
  return (
    (typeof adminId === "string" && isValidObjectId(adminId)) ||
    adminId instanceof Types.ObjectId
  );
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isOptionalValidString = (value?: unknown): boolean => {
  return value === undefined || 
         (typeof value === "string" && value.trim().length > 0);
};

export const createAdminLog = async (
  params: CreateAdminLogParams
): Promise<AdminLogDocument> => {
  try {
    const { adminId, action, details } = params;

    // Validate inputs
    if (!validateAdminId(adminId)) {
      throw new Error("Invalid admin ID format");
    }

    if (!isNonEmptyString(action)) {
      throw new Error("Action must be a non-empty string");
    }

    if (!isOptionalValidString(details)) {
      throw new Error("Details must be a non-empty string when provided");
    }

    // Convert to ObjectId if needed
    const normalizedAdminId = typeof adminId === "string" ?
      new Types.ObjectId(adminId) :
      adminId;

    // Create and save log
    const newLog = await AdminLog.create({
      adminId: normalizedAdminId,
      action: action.trim(),
      details: details?.trim()
    });

    return newLog;
  } catch (error) {
    console.error("Error creating admin log:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create admin log");
  }
};

export const getAdminLogs = async (
  params: GetAdminLogsParams
): Promise<{ logs: AdminLogDocument[]; total: number }> => {
  try {
    const { adminId, page = 1, limit = 10 } = params;

    if (!validateAdminId(adminId)) {
      throw new Error("Invalid admin ID format");
    }

    const normalizedAdminId = typeof adminId === "string" ?
      new Types.ObjectId(adminId) :
      adminId;

    const [logs, total] = await Promise.all([
      AdminLog.find({ adminId: normalizedAdminId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
        
      AdminLog.countDocuments({ adminId: normalizedAdminId })
    ]);

    return {
      logs: logs as AdminLogDocument[],
      total
    };
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch admin logs");
  }
};
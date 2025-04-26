import { Schema, model, models, Document, Model } from "mongoose";

export interface AdminLogDocument extends Document {
  adminId: Schema.Types.ObjectId;
  action: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define schema with proper typing and validation
const adminLogSchema = new Schema<AdminLogDocument>({
  adminId: { 
    type: Schema.Types.ObjectId, 
    ref: "Admin", 
    required: [true, "Admin ID is required"],
    index: true // Added index for faster queries
  },
  action: { 
    type: String, 
    required: [true, "Action description is required"],
    minlength: [3, "Action must be at least 3 characters"],
    maxlength: [100, "Action cannot exceed 100 characters"]
  },
  details: {
    type: String,
    maxlength: [1000, "Details cannot exceed 1000 characters"]
  }
}, {
  timestamps: true,
  strict: "throw", // Prevent unknown fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search capabilities
adminLogSchema.index({ action: "text", details: "text" });

// Type for the model
interface AdminLogModel extends Model<AdminLogDocument> {}

// Model creation with proper type checking
const AdminLog: AdminLogModel = models.AdminLog || model<AdminLogDocument, AdminLogModel>("AdminLog", adminLogSchema);

export default AdminLog;
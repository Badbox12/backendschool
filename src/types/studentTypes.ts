// types/studentTypes.ts
import { z } from 'zod';

// Base student data schema
export const StudentDataSchema = z.object({
  studentId: z.string().min(3).max(20),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  dateOfBirth: z.coerce.date().refine(date => date < new Date(), {
    message: "Date of birth must be in the past"
  }),
  gender: z.enum(["Male", "Female", "Other"]),
  placeOfBirth: z.string().min(2).max(100),
  guardianContact: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: "Invalid phone number format"
  }),
  grade: z.string().max(10).optional(),
  class: z.string().max(10).optional(),
  guardianName: z.string().max(100).optional()
});

// Update data schema (partial version of base schema)
export const StudentUpdateSchema = StudentDataSchema.partial();

// TypeScript types inferred from Zod schemas
export type StudentData = z.infer<typeof StudentDataSchema>;
export type StudentUpdateData = z.infer<typeof StudentUpdateSchema>;

// Database model type (extends base schema with MongoDB fields)
export type StudentDocument = StudentData & {
  _id: string;
  admin: string;
  createdAt: Date;
  updatedAt: Date;
};

// Response type for student operations
export type StudentResponse = {
  success: boolean;
  data?: StudentDocument | StudentDocument[];
  error?: string;
  statusCode?: number;
};
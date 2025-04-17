import { Schema, Types, model, models } from "mongoose";

// Base Student Interface
export interface IStudent {
  studentId: string;
  LastName: string;
  FirstName: string;
  dateOfBirth: Date;
  gender: "Male" | "Female" | "Other";
  placeOfBirth: string;
  grade?: string;
  class?: string;
  guardianName?: string;
  guardianContact: string;
  admin: Types.ObjectId;
}
const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    LastName: {
      type: String,
      required: true,
    },

    FirstName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    placeOfBirth: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
    },
    class: {
      type: String,
    },
    guardianName: {
      type: String,
    },
    guardianContact: {
      type: String,
      required: true,
    },
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
      transform: (doc, ret) => {
        ret.id = doc._id.toString(); //
        return ret;
      } // Transform the output to remove _id and add id
    }
  }
);

export default model<IStudent>("Student", StudentSchema);

import { Schema, model, models, Document, Model, UpdateQuery } from "mongoose";
import { updateAdmin } from "../controllers/adminController";

// Define an interface for the Mark document
export interface IMark extends Document {
  studentId: Schema.Types.ObjectId;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  month: string;
  year: number;
  teacherComments?: string;
  grade?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
const markSchema = new Schema<IMark>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      // Reference to the Student model
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 10, // Assuming 100 is the maximum by default
    },
    month: {
      type: String,
      required: true,
      enum: [
        // Restrict to month names
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },
    year: {
      type: Number,
      required: true,
      min: [2000, "Year must be after 2000"], // Minimum year validation
      max: [new Date().getFullYear(), `Year can't be in the future`], // Max year validation
    },
    teacherComments: {
      type: String,
      maxlength: 250, // Limit to 250 characters
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"], // Calculated based on marks
    },
  },
  {
    timestamps: true,
  }
);
// Add a compound uqique index to prevent duplicate marks
markSchema.index(
  { studentId: 1, subjectName: 1, month: 1, year: 1 },
  { unique: true }
);
function calculateGrade(marksObtained: number, maxMarks: number): string {
  const percentage = (marksObtained / maxMarks) * 100;
  if (percentage >= 90) return "A";
  else if (percentage >= 80) return "B";
  else if (percentage >= 70) return "C";
  else if (percentage >= 60) return "D";
  else if (percentage >= 50) return "E";
  else return "F";
}

// Pre-save middleware to calculate grade based on marks
// markSchema.pre<IMark>("save", function (next) {
//     const percentage = (this.marksObtained / this.maxMarks) * 100;
//     if (percentage >= 90) this.grade = "A";
//     else if (percentage >= 80) this.grade = "B";
//     else if (percentage >= 70) this.grade = "C";
//     else if (percentage >= 60) this.grade = "D";
//     else if (percentage >= 50) this.grade = "E";
//     else this.grade = "F";
//     next();
//   });

// If you use findByIdAndUpdate, consider a pre('findOneAndUpdate') hook too
markSchema.pre("findOneAndUpdate", async function (next) {
  // Get the update object; it might contain a $set operator
  const update = this.getUpdate() as UpdateQuery<IMark>;

  // Extract marksObtained and maxMarks from either the root or $set object
  const marksObtained = update.marksObtained ?? update.$set?.marksObtained;
  const maxMarks = update.maxMarks ?? update.$set?.maxMarks;

  if (markSchema != null || maxMarks != null) {
    // Retrieve the document to be updated for fallback values
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) {
      return next(new Error("Document not found"));
    }
    const newMarks =
      marksObtained != null ? marksObtained : docToUpdate.marksObtained;
    const newMax = maxMarks != null ? maxMarks : docToUpdate.maxMarks;
    const newGrade = calculateGrade(newMarks, newMax);

    // If using $set, update the grade field there
    if (update.$set) {
      update.$set.grade = newGrade;
    } else {
      // Otherwise, merge the grade field into the update object
      this.setUpdate({ ...update, grade: newGrade });
    }
  }
  next();
});

markSchema.pre<IMark>("save", async function (next) {
  // Calculate grade based on the updated marks
  this.grade = calculateGrade(this.marksObtained, this.maxMarks);
  // Use this.constructor to get the model reference

  // Only perform duplicate check when the document is new
  if (this.isNew) {
    const existingMark = await (this.constructor as Model<IMark>).findOne({
      studentId: this.studentId,
      subjectName: this.subjectName,
      month: this.month,
      year: this.year,
    });
    if (existingMark) {
      // Throw an error if a duplicate mark exists
      const error = new Error(
        `Mark for subject '${this.subjectName}' in ${this.month} ${this.year} already exists.`
      );
      return next(error);
    }
  }

  next();
});

const Mark = models.Mark || model<IMark>("Mark", markSchema);

export default Mark;

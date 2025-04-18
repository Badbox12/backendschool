import { Schema, model, models, Document } from "mongoose";
interface AdminDocument extends Document {
  username: string;
  email: string;
  password: string;
  salt: string;
  role: "admin" | "superadmin" | "teacher"; // Add more roles as needed
  status: "pending" | "active" | "rejected";
  confirmationToken?: string;
  resetPasswordOtp?: string; // Hashed OTP
  resetPasswordExpires?: number; // Expiration timestamp
  resetPasswordToken?: string;
}

const adminSchema: Schema<AdminDocument> = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    salt: {
      type: String,
      required: true,
     
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "superadmin", "teacher"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected","suspended"],
      default: "pending",
    },
    confirmationToken: { type: String,  },
    resetPasswordOtp: { type: String, },
    resetPasswordExpires: { type: Number,  },
    resetPasswordToken: { type: String,  },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// adminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const { hash, salt } = await hashPassword(this.password);
//   this.password = hash;
//   this.salt = salt; // Ensure salt is being stored if needed
//   next();
// });
adminSchema.pre("save", async function (next) {
  if (this.isModified('password') && this.password.startsWith('$2b$')) {
    return next(new Error('Attempted to re-hash already hashed password'));
  }
  next();
});

const Admin = models.Admin || model<AdminDocument>("Admin", adminSchema);

export default Admin;

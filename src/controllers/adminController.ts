import Admin from "../models/adminModel";
import { hashPassword, comparePassword, debugRehash } from "~utils/cryptoUtils";
import nodemailer from "nodemailer";
import crypto from "crypto";
// Define a standard response interface
interface ControllerResponse {
  success: boolean;
  data?: any;
  error?: string;
}
// Email configuration (use your SMTP credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: "kyt81086@gmail.com", // Replace with your email
    pass: process.env.PASS_NODEMAIL, // Replace with your email password or app-specific password
  },
});

/**
 * Forgot Password - Send OTP via email
 * @param email - Admin's email address
 * @returns A ControllerResponse indicating success or failure
 */
export const forgotPassword = async (
  email: string
): Promise<ControllerResponse> => {
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin || admin.role === "guest") {
      return { success: false, error: "Admin not found" };
    }

    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Set OTP and expiration time in the database
    admin.resetPasswordOtp = otpHash;
    admin.resetPasswordExpires = Date.now() + 2 * 60 * 1000 ;

    await admin.save();

    // Send the OTP via email
    await transporter.sendMail({
      from: "kyt81086@gmail.com", // Replace with your email
      to: admin.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is ${otp}. It will expire in 1 minutes.`,
    });

    return { success: true, data: "OTP sent to email" };
  } catch (error: any) {
    console.error("Error in forgotPassword:", error);
    return { success: false, error: error.message };
  }
};
/**
 * Verify OTP - Check if the provided OTP is valid
 * @param email - Admin's email address
 * @param otp - The OTP provided by the admin
 * @returns A ControllerResponse indicating success or failure
 */
export const verifyOtp = async (
  email: string,
  otp: string
): Promise<ControllerResponse> => {
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    //console.log(admin.resetPasswordOtp);
    if (!admin) {
      return { success: false, error: "Admin not found" };
    }
    if (
      !admin.resetPasswordExpires ||
      admin.resetPasswordExpires < Date.now()
    ) {
      return { success: false, error: "OTP has expired" };
    }
     // If you hashed the OTP, you'll need to hash the provided OTP and compare the hashes
         const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        // if (otpHash !== admin.resetPasswordOtp) 

        if(otpHash !== admin.resetPasswordOtp) {
      return { success: false, error: "Invalid OTP" };

        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        admin.resetPasswordToken = resetToken;
        admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await admin.save();
        return { success: true, data:{ token: resetToken }};
  } catch (error: any) {
    console.error("Error in verifyOtp:", error);
    return { success: false, error: error.message };
  }
};
/**
 * Reset Password - Verify OTP and update password
 * @param body - Contains email, OTP, and new password
 * @returns A ControllerResponse indicating success or failure
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<ControllerResponse> => {
  try {
    // Find admin by email
    const admin = await Admin.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    // // Check if the OTP has expired
    // if (
    //   !admin.resetPasswordExpires ||
    //   admin.resetPasswordExpires < Date.now()
    // ) {
    //   return { success: false, error: "OTP has expired" };
    // }

    // // verify the otp
    // const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    // if (otpHash !== admin.resetPasswordOtp) {
    //   return { success: false, error: "Invalid OTP" };
    // }

    // Hash the new password and save it
    const { hash, salt } = await hashPassword(newPassword);
    admin.password = hash;
    admin.salt = salt;

    // Clear token and expiration
    admin.resetPasswordToken = undefined;
    admin.resetPasswordOtp = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();
    return { success: true, data: "Password reset successfully" };
  } catch (error: any) {
    console.error("Error in resetPassword:", error);
    return { success: false, error: error.message };
  }
};
/**
 * Login admin using email and password
 * @param body - The request body containing email and password
 * @param jwt - The JWT plugin instance from Elysia
 * @returns A ControllerResponse indicating success or failure
 */

export const loginAdmin = async (
  body: { email: string; password: string },
  jwt: { sign: (payload: any, options?: any) => Promise<string> }
): Promise<ControllerResponse> => {
  try {
    const { email, password }: any = body;

    // Validate input
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin || admin.status !== "active") {
      return { success: false, error: "Invalid credential" };
    }
    admin.lastLogin = new Date();
    await admin.save();
    // Compare the input password with the stored hash
    const isMatch = await comparePassword(password, admin.salt, admin.password);
    // const test = await debugRehash(password, admin.salt, admin.password).then(() => console.log("Debugging completed"))
    // .catch((error) => console.error("Error during debugging:", error));
    if (!isMatch) {
      return { success: false, error: "Invalid email or password" };
    }

    // Generate JWT token using Elysia's JWT plugin
    // console.log(jwt);
    const token = await jwt.sign(
      { id: admin._id, role: admin.role },
      { expiresIn: "1h" } // Token expires in 1 hour
    );
    //console.log("Generated Token : ", token);
    // Return success if authentication is valid
    return {
      success: true,
      data: { token, email: admin.email, role: admin.role, username: admin.username },
    };
  } catch (error: any) {
    console.error("Error during login:", error);
    return { success: false, error: error.message };
  }
};

export const createAdmin = async (body: any) => {
  try {
    const { username, email, password, role } = body;

    // Check for duplicate email or username
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });
    if (existingAdmin) {
      return { success: false, error: "Email or username already in use" };
    }

    // Generate a confirmation token
    const confirmationToken = crypto.randomBytes(20).toString("hex");

    // Hash The Password
    const { hash, salt } = await hashPassword(password);
    //console.log({ hash, salt });
    const newAdmin = new Admin({
      username,
      email,
      password: hash,
      salt,
      role,
      status: "pending",
      confirmationToken,
    });
    const test = await newAdmin.save();
    //console.log(test.password);
    const superAdminEmail = "kyt81086@gmail.com";
    // Construct the confirmation link (adjust FRONTEND_URL as needed)
    const confirmationLink = `${process.env.FRONTEND_URL}/admin/confirm?token=${confirmationToken}`;

    await transporter.sendMail({
      from: "kyt81086@gmail.com",
      to: superAdminEmail,
      subject: "Approve New Admin Account",
      text: `A new admin account has been created for ${username} (${email}) with role "${role}".\n\nTo approve this account, please click the link below:\n${confirmationLink}\n\nIf you did not expect this, please contact your support team.`,
    });

    return  {
      success: true,
      data: ` ${newAdmin} :  was account created pending approval.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllAdmins = async () => {
  try {
    const admins = await Admin.find({}, "-password"); // Exclude password
    
    return { success: true, data: admins };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAdminById = async (id: string) => {
  try {
    const admin = await Admin.findById(id, "-password");
    if (!admin) return { success: false, error: "Admin not found" };
    return { success: true, data: admin };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateAdmin = async (id: string, body: any) => {
  try {
    const updateData: any = { ...body };

    // If updating the password, hash it
    if (body.password) {
      const { hash, salt } = await hashPassword(body.password);
      updateData.password = hash;
      updateData.salt = salt;
    }
    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedAdmin) {
      return { success: false, error: "Admin not found or update failed" };
    }

    return { success: true, data: updatedAdmin };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteAdmin = async (id: string) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(id);
    if (!deletedAdmin) return { success: false, error: "Admin not found" };
    return { success: true, data: deletedAdmin };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Confirm Admin Registration
 * This function confirms a pending admin account using a confirmation token.
 * It searches for an admin with a matching token and a "pending" status.
 * If found, it sets the admin's status to "active" and clears the confirmation token.
 *
 * @param token - The confirmation token from the email link.
 * @returns A ControllerResponse indicating success or failure.
 */
export const confirmAdmin = async (
  token: string
): Promise<ControllerResponse> => {
  try {
    // Find the pending admin by confirmation token
    const admin = await Admin.findOne({
      confirmationToken: token,
      status: "pending",
    });

    if (!admin) {
      return {
        success: false,
        error: "Invalid or expired confirmation token.",
      };
    }

    // Update admin status to active and clear the token
    admin.status = "active";
    admin.confirmationToken = undefined;

    await admin.save();

    return { success: true, data: "Admin account approved successfully." };
  } catch (error: any) {
    console.error("Error confirming admin:", error);
    return { success: false, error: error.message };
  }
};

// backend/controllers/adminController.ts
export const updateAdminStatus = async (
  ctx: any, // Context from Elysia containing user details
  adminId: string,
  action: "confirm" | "reject",
  newRole?: string // Optional role update (e.g., promote guest to admin)
): Promise<ControllerResponse> => {
  try {
    // Ensure only superadmins can perform this action
    if (ctx.user?.role !== "superadmin") {
      return { success: false, error: "Unauthorized" };
    }

    const targetAdmin = await Admin.findById(adminId);
    if (!targetAdmin) {
      return { success: false, error: "Admin not found" };
    }

    // Update status and role
    targetAdmin.status = action === "confirm" ? "active" : "rejected";
    if (newRole && ["admin", "superadmin", "teacher"].includes(newRole)) {
      targetAdmin.role = newRole;
    }

    await targetAdmin.save();

    return {
      success: true,
      data: `Admin ${targetAdmin.username} was ${
        action === "confirm" ? "activated" : "rejected"
      } successfully.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message, };
  }
};

export const promoteAdmin = async(adminId: string) => {
  try {
    const admin = await Admin.findById(adminId)
    if (!admin) return { success: false, error: "Admin not found" };
    admin.role = "superadmin";
    await admin.save();
    return { success: true, data: "Admin promoted to superadmin." };
  } catch (error : any) {
    return { success: false, error: error.message };
  }
}

export const demoteAdmin = async(adminId: string) => { 
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return { success: false, error: "Admin not found" };
    // Prevent demoting the last superadmin
    if(admin.role === "superadmin") {
      const superadminCount = await Admin.countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        return { success: false, error: "Cannot demote the last superadmin." };
      }
    }
    admin.role = "admin";
    await admin.save();
    return { success: true, data: "Admin demoted to admin." };
  } catch (error: any) {
    return { success: false, error: error.message };   
  }
 }

 export const suspendAdmin = async (adminId: string) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return { success: false, error: "Admin not found" };
    admin.status = "suspended";
    await admin.save();
    return { success: true, data: "Admin suspended." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const forceResetAdminPassword = async (adminId: string, newPassword: string) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return { success: false, error: "Admin not found" };
    const { hash, salt } = await hashPassword(newPassword);
    admin.password = hash;
    admin.salt = salt;
    await admin.save();
    return { success: true, data: "Admin password reset successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
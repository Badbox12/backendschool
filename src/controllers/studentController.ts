import Student from "../models/studentModel";
import Mark from "../models/markModel";
import { ObjectId } from "mongodb";
interface StudentData {
  studentId: string;
  FirstName: string;
  LastName: string;
  dateOfBirth: Date;
  gender: "Male" | "Female" | "Other";
  placeOfBirth: string;
  grade?: string;
  class?: string;
  guardianName?: string;
  guardianContact: string;
  admin: string;
}
// Define a type for controller responses
type ControllerResponse = {
  success: boolean;
  data?: any; // Data field, optional
  error?: string; // Error field, optional
};
export const createStudent = async (
  adminId: string,
  { body }: { body: StudentData }
) => {
  //   Check for body
  try {
    if (!body.studentId || !body.guardianContact) {
      return { 
        success: false, 
        error: "Missing required fields", 
        statusCode: 400 
      };
    }
    const newStudent = new Student({ ...body, admin: new  ObjectId(adminId) });
    await newStudent.save();
    return { success: true, data: newStudent };
  } catch (error: any) {
    console.log({ error: error.message });
  }
};
// Check if a student exists by studentId
export const studentExists = async (studentId: string): Promise<boolean> => {
  const student = await Student.findOne({ studentId }); // Search by studentId
  return !!student; // Return true if found, otherwise false
};

// Function to check if a student exists by ID
export const studentExistsById = async (id: string): Promise<boolean> => {
  const student = await Student.findById(id); // Find the student by ID
  return !!student; // Return true if student exists, false otherwise
};
export const getAllStudentsByAdmin = async (
  adminId: string
): Promise<ControllerResponse> => {
  try {
    const students = await Student.find({ admin: adminId }); // Fetch all students from the database
    return { success: true, data: students };
  } catch (error: any) {
    return { success: false, error: error.message }; // Return error details if fetching fails
  }
};

// Find student by ID
export const findStudentById = async (
  adminId: string,
  id: string
): Promise<ControllerResponse> => {
  try {
    const student = await Student.findById({ _id: id, admin: adminId });
    if (!student) {
      return { success: false, error: "Student not found" };
    }
    return { success: true, data: student };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
// Update student by ID

export const editStudentById = async (
  adminId: string,
  id: string,
  body: Record<string, any>
): Promise<ControllerResponse> => {
  try {
    // Validate ID format (for MongoDB ObjectID)
    const isObjectId = ObjectId.isValid(id);
    //Check if body is a valid object and not null
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return { success: false, error: "Invalid data for update" };
    }
    // Determine if we're searching by _id (ObjectId) or studentId
    const filter = isObjectId
      ? { _id: new ObjectId(id), admin: adminId }
      : { studentId: id, admin: adminId };
    // Update the student data
    const updatedStudent = await Student.findByIdAndUpdate(
      filter,
      { $set: body },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the update operation
        overwrite: true, // Overwrite the document with the new data
      }
    );
    if (!updatedStudent) {
      return { success: false, error: "Student not found or update failed" };
    }
    // Return the updated student data
    return { success: true, data: updatedStudent.toObject() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete student by ID
export const deleteStudentById = async (
  adminId: string,
  id: string
): Promise<ControllerResponse> => {
  try {
    const deletedStudent = await Student.findByIdAndDelete({
      _id: id,
      admin: adminId,
    });
    if (!deletedStudent) {
      return { success: false, error: "Student not found or delete failed" };
    }
    return { success: true, data: "Student deleted successfully" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Controller function to calculate aggregate marks for a student
export const calculateAggregateMarks = async (studentId: string) => {
  try {
    // Fetch all marks for the student
    const marks = await Mark.find({ studentId });

    if (marks.length === 0) {
      return { success: false, error: "No marks found for this student." };
    }

    // Calculate total marks obtained
    const totalMarks = marks.reduce((acc, mark) => acc + mark.marksObtained, 0);

    // Calculate aggregate (average) marks
    const aggregate = totalMarks / marks.length;

    // Return the aggregate score
    return { success: true, aggregate };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

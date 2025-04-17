import Mark from "../models/markModel";
import Student from "../models/studentModel";

// Define a standard response interface
interface ControllerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a new mark
export const createMark = async (body: any): Promise<ControllerResponse> => {
  try {
    const { studentId, subjectName, month, year } = body;
    // Validate studentId before querying
    if (!studentId || typeof studentId !== "string") {
      return { success: false, error: "Invalid student ID" };
    }
    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return { success: false, error: "Student not found or don't have mark" };
    }

    // Check if the subject already exists for the given student in the same month and year
    const existingMark = await Mark.findOne({
      studentId: student._id,
      subjectName,
      month,
      year,
    });
    if (existingMark) {
      return {
        success: false,
        error: `Mark for subject '${subjectName}' in ${month} ${year} already exists for this student.`,
      };
    }
    // Create and save the new mark
    const newMark = new Mark({
      ...body,
      studentId: student._id,
    });
    await newMark.save();
    console.log(newMark);
    return { success: true, data: newMark };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get all marks for all students
export const getAllMarks = async (): Promise<ControllerResponse> => {
  try {
    const marks = await Mark.find().populate({
      path: "studentId",
      select: "FirstName LastName",
      model: Student,
    }); // Populate student details
    return { success: true, data: marks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get marks for a specific student by studentId
export const getMarksByStudentId = async (
  studentId: string
): Promise<ControllerResponse> => {
  try {
    // Find student by custom ID first
    const student = await Student.findById(studentId);
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get marks using ObjectId
    const marks = await Mark.find({ studentId: student._id }).populate({
      path: "studentId", // Populate student details
      select: "FirstName LastName studentId", // Select specific fields
      model: Student, // Populate student details
    });

    return marks.length > 0
      ? { success: true, data: marks }
      : { success: false, error: "No marks found" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// studentController.ts
export const getStudentMarks = async (
  adminId: string,
  studentId: string
): Promise<ControllerResponse> => {
  try {
    // Find the student to check admin ownership
    const student = await Student.findById(studentId);
    if (!student) {
      return { success: false, error: "Student not found"};
    }
    if (student.admin.toString() !== adminId) {
      return { success: false, error: "Unauthorized"};
    }

    // Fetch all marks for this student
    const marks = await Mark.find({ studentId: studentId }).sort({ year: -1, month: -1 });
    return { success: true, data: marks };
  } catch (error: any) {
    return { success: false, error: error.message, };
  }
};
// Function to get and sort all students by their total score
export const getStudentsSortedByTotalScore =
  async (): Promise<ControllerResponse> => {
    try {
      // Aggregate pipeline to calculate total marks for each student
      const studentScore = await Mark.aggregate([
        // Group by studentId and sum their total marks
        {
          $group: {
            _id: "$studentId",
            totalScore: { $sum: "$marksObtained" }, // Sum of marks for each student
          },
        },
        // Sort students by their total score in descending order
        {
          $sort: { totalScore: -1 },
        },
        // Lookup to populate student details from the Student collection
        {
          $lookup: {
            from: "students",
            localField: "_id",
            foreignField: "_id",
            as: "studentDetails",
          },
        },
        //  // Unwind the array created by $lookup to flatten the results
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Project the fields to include in the final result
        {
          $project: {
            _id: 0, // Hide the _id field
            studentId: "$studentDetails._id",
            FirstName: "$studentDetails.FirstName",
            LastName: "$studentDetails.LastName",
            totalScore: 1, // Include totalScore
          },
        },
      ]);
      return { success: true, data: studentScore };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

// Update marks by markId
export const updateMarkById = async (
  markId: string,
  body: any
): Promise<ControllerResponse> => {
  console.log("Updating mark with ID:", markId);

  try {
    // Ensure valid update data
    if (!markId) return { success: false, error: "Mark ID is required" };
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return { success: false, error: "Invalid update data" };
    }

    const updatedMark = await Mark.findOneAndUpdate(
      {_id: markId},
      { $set: body },
      {
        new: true,
        runValidators: true,
        //overwrite: true // Overwrite the document with the new data
      }
    );
    if (!updatedMark) {
      return { success: false, error: "Mark not found or update failed" };
    }
    return { success: true, data: updatedMark };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete a mark by markId
export const deleteMarkById = async (
  markId: string
): Promise<ControllerResponse> => {
  try {
    const deletedMark = await Mark.findByIdAndDelete(markId);
    if (!deletedMark) {
      return { success: false, error: "Mark not found or deletion failed" };
    }
    return { success: true, data: deletedMark };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// CREATE GET STUDENT RANKING IN MY PROJECT (06/11/2024)
export const getStudentRankings = async (): Promise<ControllerResponse> => {
  try {
    const ranking = await Mark.aggregate([
      {
        // Group marks by student and calculate average
        $group: {
          _id: "$studentId",
          averageScore: { $avg: "$marksObtained" },
        },
      },
      {
        $sort: { averageScore: -1 },
      },
      {
        // Populate student details
        $lookup: {
          from: "students", // collection to join
          localField: "_id", //field from the input documents
          foreignField: "_id", //field from the documents of the "from" collection
          as: "studentDetails", // output array field
        },
      },
      {
        // Unwind the studentDetails array for easier access
        $unwind: { path: "$studentDetails", preserveNullAndEmptyArrays: true }, // Preserve unmatched documents
      },
      {
        // Select only relevant fields
        $project: {
          _id: 0,
          studentId: "$_id",
          studentName: {
            $concat: [
              "$studentDetails.FirstName",
              " ",
              "$studentDetails.LastName",
            ],
          },
          averageScore: 1,
        },
      },
    ]);
    // Add ranking based on position in sorted array
    const rankedData = ranking.map((stu, ind) => ({
      rank: ind + 1,
      ...stu,
    }));
    console.log(ranking, rankedData);
    return { success: true, data: rankedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

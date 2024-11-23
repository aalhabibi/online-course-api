const { default: mongoose } = require("mongoose");
const { Course } = require("../models/course");
const { User } = require("../models/user");

async function getUserCourses(req, res) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid Course ID" });
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role == "instructor") {
    const courses = await Course.find({ instructorId: user._id });
    if (courses.length == 0)
      res.status(404).json({ message: "No courses found for the instructor" });
    else return res.status(200).json({ ownedCourses: courses });
  } else {
    return res.status(400).json({ message: "This user is not an instructor" });
  }
}

module.exports = { getUserCourses };

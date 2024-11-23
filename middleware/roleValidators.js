const jwt = require("jsonwebtoken");
const { Course } = require("../models/course");
const { default: mongoose } = require("mongoose");
const Enrollment = require("../models/enrollment");

const jwtSecret = process.env.ACCESS_TOKEN_SECRET;

const verifyInstructor = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    if (user.role != "instructor") {
      return res.status(401).json({ message: "Not authorized as instructor" });
    }
    next();
  });
};

const verifyStudent = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    if (user.role != "student") {
      return res.status(401).json({ message: "Not authorized as student" });
    }
    next();
  });
};

const courseOwnershipValidator = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid Course ID" });

    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (user.id != course.instructorId) {
      return res
        .status(401)
        .json({ message: "Not authorized as course owner" });
    }
    next();
  });
};

const verifyEnrollment = async (req, res, next) => {
  if (await Enrollment.findOne({ course: req.params.id, student: req.user.id }))
    next();
  else {
    return res.status(401).json({
      message: "You're not enrolled in this course to see it's content",
    });
  }
};

const verifyAuthorityToViewCourseContent = async (req, res, next) => {
  switch (req.user.role) {
    case "student": {
      if (
        await Enrollment.findOne({
          course: req.params.id,
          student: req.user.id,
        })
      )
        next();
      else {
        return res.status(401).json({
          message: "You're not enrolled in this course to see it's content",
        });
      }
      break;
    }

    case "instructor":
      {
        const course = await Course.findById(req.params.id);
        if (course.instructorId == req.user.id) next();
        else {
          return res.status(401).json({
            message: "You're not the instructor of this course.",
          });
        }
      }
      break;

    default:
      break;
  }
};

const verifyAuthorityToReviewCourse = async (req, res, next) => {
  if (
    await Enrollment.findOne({
      course: req.params.id,
      student: req.user.id,
    })
  )
    next();
  else {
    return res.status(401).json({
      message: "You're not enrolled in this course to review it",
    });
  }
};

module.exports = {
  verifyInstructor,
  verifyStudent,
  courseOwnershipValidator,
  verifyEnrollment,
  verifyAuthorityToViewCourseContent,
  verifyAuthorityToReviewCourse,
};

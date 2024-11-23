const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Course } = require("../models/course");
const Enrollment = require("../models/enrollment");

const { S3Client } = require("@aws-sdk/client-s3");

const multer = require("multer");
const multerS3 = require("multer-s3");
const Material = require("../models/material");
const Review = require("../models/review");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|mp4|avi|mov|mkv/;
    const extname = fileTypes.test(file.mimetype);

    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs and videos are allowed!"));
    }
  },
});

async function createCourse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const newCourse = new Course({
    title: req.body.title,
    instructorId: req.user.id,
  });
  if (req.body.description) newCourse.description = req.body.description;
  if (req.body.level) newCourse.level = req.body.level;
  if (req.body.category) newCourse.category = req.body.category;
  newCourse.save();
  res.status(200).json({ message: "Course added successfully" });
}

async function getAllCourses(req, res) {
  const criteria = {};

  if (req.body.category) {
    criteria.category = { $regex: req.body.category, $options: "i" };
  }

  if (req.body.level) {
    criteria.level = { $regex: req.body.level, $options: "i" };
  }
  if (req.body.instructorName) {
    criteria.instructorName = {
      $regex: req.body.instructorName,
      $options: "i",
    };
  }

  // const courses = await Course.aggregate([
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "instructorId",
  //       foreignField: "_id",
  //       as: "instructorDetails",
  //     },
  //   },
  //   {
  //     $unwind: "$instructorDetails",
  //   },
  //   {
  //     $addFields: {
  //       instructorName: "$instructorDetails.fullName",
  //     },
  //   },
  //   {
  //     $project: {
  //       title: 1,
  //       description: 1,
  //       instructorName: 1,
  //       category: 1,
  //       level: 1,
  //     },
  //   },
  //   { $match: criteria },
  // ]);

  const courses = await Course.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "instructorId",
        foreignField: "_id",
        as: "instructorDetails",
      },
    },
    {
      $unwind: "$instructorDetails",
    },
    {
      $addFields: {
        instructorName: "$instructorDetails.fullName",
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "courseId",
        as: "courseReviews",
      },
    },
    {
      $addFields: {
        averageRating: { $round: [{ $avg: "$courseReviews.rating" }, 2] },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        instructorName: 1,
        category: 1,
        level: 1,
        averageRating: 1,
      },
    },
    { $match: criteria },
  ]);

  res.status(200).json({
    courses,
  });
}

async function getCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid Course ID" });

  const course = await Course.findById(req.params.id);

  if (!course) return res.status(404).json({ message: "Course not found" });

  return res.status(200).json({ course });
}

async function updateCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid Course ID" });

  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  let updatedinfo = {};
  if (req.body.title) updatedinfo.title = req.body.title;
  if (req.body.description) updatedinfo.description = req.body.description;
  if (req.body.category) updatedinfo.category = req.body.category;
  if (req.body.level) updatedinfo.level = req.body.level;

  const course = await Course.findByIdAndUpdate(req.params.id, updatedinfo, {
    runValidators: true,
    new: true,
  });

  if (!course) return res.status(404).json({ message: "Course not found" });

  return res.status(200).json({ course: "Course updated successfully" });
}

async function deleteCourse(req, res) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid Course ID" });

  const course = await Course.findByIdAndDelete(req.params.id);

  return res.status(200).json({ course: "Course deleted successfully" });
}

async function enrollCourse(req, res) {
  const course = await Course.findById(req.params.id);

  if (!course) return res.status(404).json({ message: "Course not found" });

  const newEnrollment = new Enrollment({
    student: req.user.id,
    course: course.id,
  });
  newEnrollment.save();
  res.status(200).json({ message: "Course enrolled successfully" });
}

async function getEnrolledCourses(req, res) {
  const courses = await Enrollment.find({ student: req.user.id })
    .select("course enrolledAt")
    .populate("course");
  return res.status(200).json({ courses });
}

async function addMaterialToCourse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const material = req.file;

  const newMaterial = new Material({
    courseId: req.params.id,
    materialTitle: req.body.materialTitle,
    link: material.location,
  });

  newMaterial.save();

  res.status(200).json({ message: "Course material added successfully" });
}

async function getCourseContent(req, res) {
  const content = await Material.find({ courseId: req.params.id }).select();
  res.status(200).json({ content });
}

async function reviewCourse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const review = new Review({
    courseId: req.params.id,
    studentId: req.user.id,
    rating: req.body.rating,
  });
  if (req.body.comment) {
    review.comment = req.body.comment;
  }

  review.save();
  res.status(200).json({ message: "Review has been posted successfully" });
}

async function getAllCourseReviews(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid Course ID" });
  const reviews = await Review.find({ courseId: req.params.id }).select(
    "studentId rating comment"
  );
  if (reviews.length == 0)
    res.status(404).json({ messgae: "No reviews found for this course" });
  res.status(200).json(reviews);
}

module.exports = {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
  addMaterialToCourse,
  upload,
  getCourseContent,
  reviewCourse,
  getAllCourseReviews,
};

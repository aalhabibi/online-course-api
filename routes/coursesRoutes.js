const express = require("express");
const {
  verifyInstructor,
  verifyStudent,
  courseOwnershipValidator,
  verifyEnrollment,
  verifyAuthorityToViewCourseContent,
  verifyAuthorityToReviewCourse,
} = require("../middleware/roleValidators");
const { verifyToken } = require("../middleware/tokenValidator");
const {
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
} = require("../controllers/coursesController");
const {
  createCourseValidator,
  updateCourseValidator,
  uploadMaterialValidator,
} = require("../middleware/courseValidators");
const { body } = require("express-validator");

const router = express.Router();

router.post(
  "/",
  verifyToken,
  verifyInstructor,
  createCourseValidator,
  async (req, res) => {
    await createCourse(req, res);
  }
);

router.put(
  "/:id",
  verifyToken,
  verifyInstructor,
  courseOwnershipValidator,
  updateCourseValidator,
  async (req, res) => {
    await updateCourse(req, res);
  }
);

router.post(
  "/:id/upload-material",
  verifyToken,
  verifyInstructor,
  courseOwnershipValidator,
  uploadMaterialValidator,
  upload.single("file"),

  async (req, res) => {
    console.log(req.body.materialTitle);
    await addMaterialToCourse(req, res);
  }
);

router.delete(
  "/:id",
  verifyToken,
  verifyInstructor,
  courseOwnershipValidator,
  async (req, res) => {
    await deleteCourse(req, res);
  }
);

router.get("/", async (req, res) => {
  await getAllCourses(req, res);
});

router.get("/enrolled", verifyToken, verifyStudent, async (req, res) => {
  await getEnrolledCourses(req, res);
});

router.get("/:id", async (req, res) => {
  await getCourse(req, res);
});

router.post("/:id/enroll", verifyToken, verifyStudent, async (req, res) => {
  await enrollCourse(req, res);
});

router.get(
  "/:id/content",
  verifyToken,
  verifyAuthorityToViewCourseContent,
  async (req, res) => {
    await getCourseContent(req, res);
  }
);

router.post(
  "/:id/review",
  verifyToken,
  verifyStudent,
  verifyAuthorityToReviewCourse,
  body("rating")
    .exists()
    .withMessage("Rating required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating has to be a number between 1 and 5"),
  async (req, res) => {
    await reviewCourse(req, res);
  }
);

router.get("/:id/review", async (req, res) => {
  await getAllCourseReviews(req, res);
});

module.exports = router;

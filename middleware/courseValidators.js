const { body, validationResult, param } = require("express-validator");

const createCourseValidator = [
  body("title").notEmpty().withMessage("Course title required"),
  body("level")
    .optional()
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("Levels can only be Beginner, Intermediate or Advanced"),
  body("category")
    .optional()
    .isIn([
      "Technology",
      "Business",
      "Art",
      "Science",
      "Health",
      "Language",
      "Other",
    ])
    .withMessage(
      "Available categories are: Technology, Business, Art, Science, Health, Language, Other"
    ),
];

const updateCourseValidator = [
  body("level")
    .optional()
    .isIn(["Beginner", "Intermediate", "Advanced"])
    .withMessage("Levels can only be Beginner, Intermediate or Advanced"),
  body("category")
    .optional()
    .isIn([
      "Technology",
      "Business",
      "Art",
      "Science",
      "Health",
      "Language",
      "Other",
    ])
    .withMessage(
      "Available categories are: Technology, Business, Art, Science, Health, Language, Other"
    ),
];

const uploadMaterialValidator = [
  param("id").notEmpty().withMessage("Course ID required"),
];

module.exports = {
  createCourseValidator,
  updateCourseValidator,
  uploadMaterialValidator,
};

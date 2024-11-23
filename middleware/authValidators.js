const { body, validationResult } = require("express-validator");
const { User } = require("../models/user");

const registerValidation = [
  body("fullName").notEmpty().withMessage("Full name is required.").trim(),

  body("email")
    .isEmail()
    .withMessage("Email is invalid.")
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        return Promise.reject("Email already in use.");
      }
    })
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),

  body("role")
    .optional()
    .isIn(["student", "instructor"])
    .withMessage('Role must be either "student" or "instructor".'),
];

const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Email is invalid.")
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (!user) {
        return Promise.reject("Email is not registered.");
      }
    })
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required."),
];

const refreshTokinValidator = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required.")
    .trim(),
];

module.exports = { registerValidation, loginValidator, refreshTokinValidator };

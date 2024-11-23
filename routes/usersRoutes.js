const express = require("express");
const { verifyToken } = require("../middleware/tokenValidator");
const { getUserCourses } = require("../controllers/usersController");

const router = express.Router();

router.get("/:id/courses", async (req, res) => {
  await getUserCourses(req, res);
});

module.exports = router;

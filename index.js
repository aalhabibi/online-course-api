const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use("/auth", require("./routes/authRoutes"));
app.use("/courses", require("./routes/coursesRoutes"));
app.use("/users", require("./routes/usersRoutes"));

mongoose
  .connect("mongodb://localhost:27017/onlinecourseplatform")
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

app.listen(3000, function () {
  console.log("Express App running at http://localhost:3000/");
});

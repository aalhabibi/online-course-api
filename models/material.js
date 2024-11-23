const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  materialTitle: { type: String, required: true },
  type: { type: String, enum: ["PDF", "Video"] },
  link: { type: String, required: true },
});

const Material = mongoose.model("Material", materialSchema);

module.exports = Material;

const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  category: {
    type: String,
    enum: [
      "Technology",
      "Business",
      "Art",
      "Science",
      "Health",
      "Language",
      "Other",
    ],
  },
});

courseSchema.virtual("averageRating").get(async function () {
  const Review = require("./review");

  const result = await Review.aggregate([
    { $match: { courseId: this._id } },
    {
      $group: {
        _id: "$courseId",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  return result.length > 0 ? result[0].averageRating : 0;
});

courseSchema.virtual("materialsCount", {
  ref: "Material",
  localField: "_id",
  foreignField: "courseId",
  count: true,
});

const Course = mongoose.model("Course", courseSchema);

module.exports = { Course };

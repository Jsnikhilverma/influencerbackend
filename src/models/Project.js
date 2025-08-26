import mongoose from "mongoose";
import slugify from "slugify";

const ProjectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    niches: [{ type: String }],
    platforms: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "closed", "in_progress", "completed"],
      default: "open",
    },
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

ProjectSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(`${this.title}-${Date.now()}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

export default mongoose.model("Project", ProjectSchema);

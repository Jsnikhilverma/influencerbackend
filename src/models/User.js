import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["influencer", "client", "admin"],
      required: true,
    },
    slug: { type: String, unique: true, index: true },
    bio: { type: String },
    avatarUrl: { type: String },
    platforms: [{ type: String }],
    niches: [{ type: String }],
    stats: {
      followers: { type: Number, default: 0 },
      avgViews: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  try {
    if (this.isModified("name") || this.isNew) {
      const base = slugify(this.name, { lower: true, strict: true }) || "user";
      let attempt = base;
      let i = 0;
      while (
        await mongoose.models.User.findOne({
          slug: attempt,
          _id: { $ne: this._id },
        })
      ) {
        i += 1;
        const suffix = Math.random().toString(36).slice(2, 6);
        attempt = `${base}-${suffix}${i > 1 ? i : ""}`;
      }
      this.slug = attempt;
    }
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model("User", UserSchema);

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Joi from "joi";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, slug: user.slug },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid("influencer", "client").required(),
});

export const register = async (req, res) => {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const exists = await User.findOne({ email: value.email });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(value.password, 10);
    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash,
      role: value.role,
    });
    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const login = async (req, res) => {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.comparePassword(value.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  slug: user.slug,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  platforms: user.platforms,
  niches: user.niches,
  stats: user.stats,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

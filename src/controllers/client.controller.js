import Joi from "joi";
import User from "../models/User.js";
import Project from "../models/Project.js";

const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  bio: Joi.string().max(1000).allow(""),
  avatarUrl: Joi.string().uri().allow(""),
});

export const filterClients = async (req, res) => {
  try {
    const {
      name,
      slug,
      createdFrom,
      createdTo,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;
    const filter = { role: "client" };
    if (name) filter.name = { $regex: new RegExp(name, "i") };
    if (slug) filter.slug = slug;
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
      if (createdTo) filter.createdAt.$lte = new Date(createdTo);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [clients, total] = await Promise.all([
      User.find(filter)
        .select("name slug bio avatarUrl createdAt")
        .sort(sort.replace(/,/g, " "))
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.json({
      data: clients,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to filter clients" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { value, error } = profileUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const user = await User.findByIdAndUpdate(req.user.id, value, {
      new: true,
    });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

const createProjectSchema = Joi.object({
  title: Joi.string().min(3).max(140).required(),
  description: Joi.string().min(10).max(5000).required(),
  budgetMin: Joi.number().min(0).required(),
  budgetMax: Joi.number().min(Joi.ref("budgetMin")).required(),
  niches: Joi.array().items(Joi.string()).default([]),
  platforms: Joi.array().items(Joi.string()).default([]),
});

export const createProject = async (req, res) => {
  try {
    const { value, error } = createProjectSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const project = await Project.create({ ...value, client: req.user.id });
    return res.status(201).json({ project });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create project" });
  }
};

export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).populate("client", "name slug");
    return res.json({ projects });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "client",
      "name slug"
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    return res.json({ project });
  } catch (err) {
    return res.status(404).json({ error: "Not found" });
  }
};

export const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug }).populate(
      "client",
      "name slug"
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    return res.json({ project });
  } catch (err) {
    return res.status(404).json({ error: "Not found" });
  }
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  slug: user.slug,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
});

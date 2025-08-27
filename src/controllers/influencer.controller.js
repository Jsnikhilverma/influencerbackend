import Joi from "joi";
import User from "../models/User.js";
import Bid from "../models/Bid.js";
import Project from "../models/Project.js";
import path from "path";

export const listInfluencers = async (req, res) => {
  try {
    const influencers = await User.find({ role: "influencer" })
      .select("name slug bio avatarUrl platforms niches stats createdAt")
      .sort({ createdAt: -1 });
    return res.json({ influencers });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch influencers" });
  }
};

export const filterInfluencers = async (req, res) => {
  try {
    const {
      name,
      slug,
      platforms,
      niches,
      followersMin,
      followersMax,
      avgViewsMin,
      avgViewsMax,
      engagementRateMin,
      engagementRateMax,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = { role: "influencer" };
    if (name) filter.name = { $regex: new RegExp(name, "i") };
    if (slug) filter.slug = slug;
    if (platforms)
      filter.platforms = {
        $in: String(platforms)
          .split(",")
          .map((s) => s.trim()),
      };
    if (niches)
      filter.niches = {
        $in: String(niches)
          .split(",")
          .map((s) => s.trim()),
      };

    const stats = {};
    if (followersMin != null || followersMax != null) {
      stats["stats.followers"] = {};
      if (followersMin != null)
        stats["stats.followers"].$gte = Number(followersMin);
      if (followersMax != null)
        stats["stats.followers"].$lte = Number(followersMax);
    }
    if (avgViewsMin != null || avgViewsMax != null) {
      stats["stats.avgViews"] = {};
      if (avgViewsMin != null)
        stats["stats.avgViews"].$gte = Number(avgViewsMin);
      if (avgViewsMax != null)
        stats["stats.avgViews"].$lte = Number(avgViewsMax);
    }
    if (engagementRateMin != null || engagementRateMax != null) {
      stats["stats.engagementRate"] = {};
      if (engagementRateMin != null)
        stats["stats.engagementRate"].$gte = Number(engagementRateMin);
      if (engagementRateMax != null)
        stats["stats.engagementRate"].$lte = Number(engagementRateMax);
    }
    Object.assign(filter, stats);

    const skip = (Number(page) - 1) * Number(limit);
    const [influencers, total] = await Promise.all([
      User.find(filter)
        .select("name slug bio avatarUrl platforms niches stats createdAt")
        .sort(sort.replace(/,/g, " "))
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.json({
      data: influencers,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to filter influencers" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const relativePath = `/uploads/avatars/${path.basename(req.file.path)}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: relativePath },
      { new: true }
    );
    return res.json({ user: { id: user._id, avatarUrl: user.avatarUrl } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to upload avatar" });
  }
};

export const getInfluencerById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "influencer" });
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ influencer: sanitizeUser(user) });
  } catch (err) {
    return res.status(404).json({ error: "Not found" });
  }
};

export const getInfluencerBySlug = async (req, res) => {
  try {
    const user = await User.findOne({
      slug: req.params.slug,
      role: "influencer",
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ influencer: sanitizeUser(user) });
  } catch (err) {
    return res.status(404).json({ error: "Not found" });
  }
};

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  bio: Joi.string().max(1000).allow(""),
  avatarUrl: Joi.string().uri().allow(""),
  platforms: Joi.array().items(Joi.string()),
  niches: Joi.array().items(Joi.string()),
  stats: Joi.object({
    followers: Joi.number().min(0),
    avgViews: Joi.number().min(0),
    engagementRate: Joi.number().min(0),
  }),
});

export const updateMyProfile = async (req, res) => {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const user = await User.findByIdAndUpdate(req.user.id, value, {
      new: true,
    });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

const bidSchema = Joi.object({
  projectId: Joi.string().required(),
  amount: Joi.number().min(1).required(),
  message: Joi.string().max(1000).allow(""),
});

export const createBid = async (req, res) => {
  try {
    const { value, error } = bidSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const project = await Project.findById(value.projectId);
    if (!project || project.status !== "open")
      return res.status(400).json({ error: "Project not open" });
    const bid = await Bid.create({
      project: project._id,
      influencer: req.user.id,
      amount: value.amount,
      message: value.message || "",
    });
    return res.status(201).json({ bid });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: "Already bid on this project" });
    return res.status(500).json({ error: "Failed to create bid" });
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

export const listMyBidProjects = async (req, res) => {
  try {
    const bids = await Bid.find({ influencer: req.user.id })
      .populate({
        path: "project",
        populate: { path: "client", select: "name slug" },
      })
      .sort({ createdAt: -1 });

    const projects = bids
      .filter((b) => b.project)
      .map((b) => ({
        id: b.project._id,
        title: b.project.title,
        description: b.project.description,
        slug: b.project.slug,
        status: b.project.status,
        budgetMin: b.project.budgetMin,
        budgetMax: b.project.budgetMax,
        niches: b.project.niches,
        platforms: b.project.platforms,
        client: b.project.client
          ? {
              id: b.project.client._id,
              name: b.project.client.name,
              slug: b.project.client.slug,
            }
          : null,
        myBid: {
          id: b._id,
          amount: b.amount,
          message: b.message,
          status: b.status,
          createdAt: b.createdAt,
        },
      }));

    return res.json({ projects });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  slug: user.slug,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  platforms: user.platforms,
  niches: user.niches,
  stats: user.stats,
  createdAt: user.createdAt,
});

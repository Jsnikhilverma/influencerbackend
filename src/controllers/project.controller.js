import Project from "../models/Project.js";
import Bid from "../models/Bid.js";

export const listAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .populate("client", "name slug");
    return res.json({ projects });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getById = async (req, res) => {
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

export const getBySlug = async (req, res) => {
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

export const listBidsForProject = async (req, res) => {
  try {
    const bids = await Bid.find({ project: req.params.id })
      .populate("influencer", "name slug")
      .sort({ createdAt: -1 });
    return res.json({ bids });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch bids" });
  }
};

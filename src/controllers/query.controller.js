import Joi from "joi";
import Query from "../models/Query.js";

const createSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(5).max(5000).required(),
});

export const createQuery = async (req, res) => {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const q = await Query.create(value);
    return res.status(201).json({ query: q });
  } catch (err) {
    return res.status(500).json({ error: "Failed to submit query" });
  }
};

export const listQueries = async (req, res) => {
  try {
    const queries = await Query.find({}).sort({ createdAt: -1 });
    return res.json({ queries });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch queries" });
  }
};

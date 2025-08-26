import { Router } from "express";
import {
  listAllProjects,
  getById,
  getBySlug,
  listBidsForProject,
} from "../controllers/project.controller.js";

const router = Router();

router.get("/", listAllProjects);
router.get("/id/:id", getById);
router.get("/slug/:slug", getBySlug);
router.get("/:id/bids", listBidsForProject);

export default router;

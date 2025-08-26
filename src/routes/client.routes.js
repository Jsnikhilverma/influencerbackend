import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMyProfile,
  updateMyProfile,
  createProject,
  listProjects,
  getProjectById,
  getProjectBySlug,
  filterClients,
} from "../controllers/client.controller.js";

const router = Router();

router.get("/me", requireAuth(["client"]), getMyProfile);
router.put("/me", requireAuth(["client"]), updateMyProfile);

router.get("/filter", filterClients);

router.post("/projects", requireAuth(["client"]), createProject);
router.get("/projects", listProjects);
router.get("/projects/id/:id", getProjectById);
router.get("/projects/slug/:slug", getProjectBySlug);

export default router;

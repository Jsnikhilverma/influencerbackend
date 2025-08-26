import { Router } from "express";
import { createQuery, listQueries } from "../controllers/query.controller.js";
// import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post("/", createQuery);
// router.get('/', requireAuth(['admin']), listQueries); // enable when admin role is ready

export default router;

import { Router } from "express";
import {
  listInfluencers,
  getInfluencerById,
  getInfluencerBySlug,
  updateMyProfile,
  createBid,
  filterInfluencers,
  uploadAvatar,
} from "../controllers/influencer.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";

const router = Router();

router.get("/", listInfluencers);
router.get("/filter", filterInfluencers);
router.get("/id/:id", getInfluencerById);
router.get("/slug/:slug", getInfluencerBySlug);

router.put("/me", requireAuth(["influencer"]), updateMyProfile);
router.post("/bids", requireAuth(["influencer"]), createBid);
router.post(
  "/me/avatar",
  requireAuth(["influencer"]),
  avatarUpload.single("avatar"),
  uploadAvatar
);

export default router;

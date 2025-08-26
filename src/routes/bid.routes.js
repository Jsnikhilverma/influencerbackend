import { Router } from "express";
import Bid from "../models/Bid.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:bidId/accept", requireAuth(["client"]), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId).populate("project");
    if (!bid) return res.status(404).json({ error: "Not found" });
    if (String(bid.project.client) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });
    bid.status = "accepted";
    await bid.save();
    return res.json({ bid });
  } catch (err) {
    return res.status(500).json({ error: "Failed to accept bid" });
  }
});

router.post("/:bidId/reject", requireAuth(["client"]), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId).populate("project");
    if (!bid) return res.status(404).json({ error: "Not found" });
    if (String(bid.project.client) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });
    bid.status = "rejected";
    await bid.save();
    return res.json({ bid });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reject bid" });
  }
});

router.post(
  "/:bidId/withdraw",
  requireAuth(["influencer"]),
  async (req, res) => {
    try {
      const bid = await Bid.findById(req.params.bidId);
      if (!bid) return res.status(404).json({ error: "Not found" });
      if (String(bid.influencer) !== String(req.user.id))
        return res.status(403).json({ error: "Forbidden" });
      bid.status = "withdrawn";
      await bid.save();
      return res.json({ bid });
    } catch (err) {
      return res.status(500).json({ error: "Failed to withdraw bid" });
    }
  }
);

export default router;

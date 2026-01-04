import { Router } from "express";
import { listPlans, getPlan, getCurrentPlan, getUserLimits } from "../controllers/plans.controller";
import { authMiddleware } from "../src/middleware/auth.middleware";

const router = Router();

router.get("/", listPlans);
router.get("/:id", getPlan);
router.get("/current/plan", authMiddleware, getCurrentPlan);
router.get("/current/limits", authMiddleware, getUserLimits);

export default router;


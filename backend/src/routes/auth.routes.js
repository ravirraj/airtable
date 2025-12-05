import { Router } from "express";
import { startOAuth, handleOAuthCallback } from "../controller/auth.controller.js";

const router = Router();

// Define your auth routes here
router.get("/airtable", startOAuth);
router.get("/airtable/callback", handleOAuthCallback);

export default router;

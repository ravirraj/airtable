import express from 'express';
const router = express.Router();
import { startOAuth, handleOAuthCallback, logout } from "../controller/auth.controller.js";
router.get("/airtable", startOAuth);
router.get("/airtable/callback", handleOAuthCallback);
router.get("/logout", logout);

export default router;

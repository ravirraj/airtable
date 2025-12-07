import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDb } from "./db/index.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
dotenv.config({ path: "./.env" });

const app = express();

// ROUTES >>>>>

import airtableRoutes from "./routes/airtable.routes.js";
import webhookRoutes from "./routes/webhook.js";
import formsRoutes from "./routes/forms.routes.js";
import getCurrentUser from "./middleware/getCurrentUser.middleware.js";
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(getCurrentUser);

// Routes
app.use("/auth", authRoutes);
app.use("/api/airtable", airtableRoutes);
app.use("/api/forms", formsRoutes);
app.use("/webhooks", webhookRoutes);

app.get("/api/me", (req, res) => {
  if (!req.currentUser) return res.status(401).json({ ok: false });
  const u = req.currentUser;
  return res.json({
    ok: true,
    user: {
      _id: u._id,
      airtableUserId: u.airtableUserId,
      lastLoginAt: u.lastLoginAt,
    },
  });
});

app.get("/", (req, res) => {
  res.send("Airtable OAuth Backend is running");
});

connectToDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT} `);
    });
  })
  .catch((err) => console.log(err));

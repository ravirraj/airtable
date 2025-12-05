import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    airtablUserId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    accessToken: { type: String, required: true },
    tokenExpiry: { type: Date, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

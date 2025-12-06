import mongoose from "mongoose";
const responseSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
    airtableRecordId: String,
    answers: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["synced", "pending", "deletedInAirtable"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  },
  { timestamps: true }
);
export const Response = mongoose.model("Response", responseSchema);

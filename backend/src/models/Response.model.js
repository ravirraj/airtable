const responseSchema = new Schema(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    airtableRecordId: String,
    answers: Schema.Types.Mixed,
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

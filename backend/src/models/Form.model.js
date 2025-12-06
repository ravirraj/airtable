import mongoose from "mongoose";

const conditionSchema = new mongoose.Schema(
  {
    quetionKey: String,
    conditionType: {
      type: String,
      enum: ["equals", "not equals", "contains"],
    },
    value: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const conditionalRulesSchema = new mongoose.Schema(
  {
    logic: {
      type: String,
      enum: ["AND", "OR"],
      default: "AND",
    },
    conditions: [conditionSchema],
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    airtableFieldId: { type: String, required: true },
    label: String,
    type: String,
    required: { type: Boolean, default: false },
    options: [String],
    conditionalRules: { type: conditionalRulesSchema, default: null },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    airtableBaseId: String,
    airtableTableId: String,
    questions: [questionSchema],
  },
  { timestamps: true }
);


export const Form = mongoose.model("Form", formSchema);

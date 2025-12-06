import { Form } from "../models/Form.model.js";
import { Response } from "../models/Response.model.js";
import { getValidAirtableToken } from "../services/tokenManager.js";
import { getTableMeta, createRecord } from "../services/airtable.service.js";
import { shouldShowQuestion } from "../utils/conditionalLogic.utils.js";
const ALLOWED_TYPES = new Set([
  "singleLineText",
  "longText",
  "singleSelect",
  "multipleSelects",
]);

function mapMetaTypeToInternal(type) {
  if (type === "singleLineText") return "short_text";
  if (type === "longText") return "long_text";
  if (type === "singleSelect") return "single_select";
  if (type === "multipleSelects") return "multi_select";
  return "unknown";
}

async function createForm(req, res) {
  const user = req.currentUser;
  const { airtableBaseId, airtableTableId, title, questions } = req.body;
  if (!airtableBaseId || !airtableTableId)
    return res.status(400).json({ error: "missing_base_or_table" });

  try {
    const meta = await getTableMeta(
      req.currentUser,
      airtableBaseId,
      airtableTableId
    );
    const fieldMap = {};
    (meta.fields || []).forEach((f) => {
      fieldMap[f.name] = f;
    });

    const outQuestions = [];
    for (const q of questions) {
      const f = fieldMap[q.airtableFieldId];
      if (!f)
        return res
          .status(400)
          .json({ error: `field_not_found`, field: q.airtableFieldId });
      if (!ALLOWED_TYPES.has(f.type))
        return res.status(400).json({
          error: "unsupported_field_type",
          field: f.name,
          type: f.type,
        });
      outQuestions.push({
        questionKey: q.questionKey,
        airtableFieldId: q.airtableFieldId,
        label: q.label || f.name,
        type: mapMetaTypeToInternal(f.type),
        required: !!q.required,
        options:
          f.options && f.options.choices
            ? f.options.choices.map((c) => c.name)
            : [],
        conditionalRules: q.conditionalRules || null,
      });
    }

    const form = new Form({
      owner: user._id,
      title,
      airtableBaseId,
      airtableTableId,
      questions: outQuestions,
    });
    await form.save();
    return res.json({ ok: true, form });
  } catch (err) {
    console.log(err)
    console.error("createForm", err.response?.data || err.message);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}

async function getForm(req, res) {
  const { formId } = req.params;
  const form = await Form.findById(formId).lean();
  if (!form) return res.status(404).json({ error: "not_found" });
  return res.json({ ok: true, form });
}

async function submitForm(req, res) {
  const { formId } = req.params;
  const { answers } = req.body;
  const form = await Form.findById(formId);
  if (!form) return res.status(404).json({ error: "not_found" });

  const visible = form.questions.filter((q) =>
    shouldShowQuestion(q.conditionalRules, answers)
  );

  for (const q of visible) {
    const val = answers[q.questionKey];
    if (
      q.required &&
      (val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0))
    ) {
      return res.status(400).json({ error: "required", field: q.questionKey });
    }
    if (q.type === "single_select" && val && !q.options.includes(val))
      return res
        .status(400)
        .json({ error: "invalid_choice", field: q.questionKey });
    if (q.type === "multi_select" && val) {
      if (!Array.isArray(val) || val.some((v) => !q.options.includes(v)))
        return res
          .status(400)
          .json({ error: "invalid_choice", field: q.questionKey });
    }
    // attachments not supported — we didn't include that type in mapping
  }

  const fields = {};
  visible.forEach((q) => {
    const v = answers[q.questionKey];
    fields[q.airtableFieldId] = v;
  });

  try {
    const airtableResp = await createRecord(
      req.currentUser,
      form.airtableBaseId,
      form.airtableTableId,
      fields
    );
    const recordId =
      airtableResp.id ||
      (airtableResp.records &&
        airtableResp.records[0] &&
        airtableResp.records[0].id);

    const respDoc = await Response.create({
      formId: form._id,
      airtableRecordId: recordId,
      answers,
      status: recordId ? "synced" : "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res.json({
      ok: true,
      responseId: respDoc._id,
      airtableRecordId: recordId,
    });
  } catch (err) {
    console.error("submitForm", err.response?.data || err.message);
    const respDoc = await Response.create({
      formId: form._id,
      answers,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return res.status(502).json({
      ok: false,
      message: "Saved locally (pending). Airtable failed.",
      responseId: respDoc._id,
    });
  }
}

async function listResponses(req, res) {
  const { formId } = req.params;
  const responses = await Response.find({ formId })
    .sort({ createdAt: -1 })
    .lean();
  const out = responses.map((r) => ({
    id: r._id,
    createdAt: r.createdAt,
    status: r.status,
    preview: JSON.stringify(r.answers).slice(0, 200),
  }));
  return res.json({ ok: true, responses: out });
}

export { createForm, getForm, submitForm, listResponses };

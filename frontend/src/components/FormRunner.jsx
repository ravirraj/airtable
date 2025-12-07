// src/FormRunner.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getForm, submitForm } from "../helper/api.js";

export default function FormRunner() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!formId) return;
    (async () => {
      try {
        const f = await getForm(formId);
        setForm(f);
      } catch (e) {
        console.error(e);
        setMsg("Failed to load form");
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  function handleChange(questionKey, value) {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form) return;

    setMsg("");
    setSubmitting(true);
    try {
      const res = await submitForm(form._id, answers);
      if (res.ok) {
        setMsg("Submitted successfully!");
      } else {
        setMsg(res.message || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      setMsg("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  }

  if (!formId) return <div>Missing formId in URL.</div>;

  if (loading) return <div>Loading form...</div>;

  if (!form) return <div>Form not found.</div>;

  const visibleQuestions = form.questions.filter((q) =>
    shouldShowQuestion(q.conditionalRules, answers)
  );

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
        {form.title || "Form"}
      </h2>
      <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 12 }}>
        formId: {form._id}
      </div>

      {msg && (
        <div
          style={{
            border: "1px solid #4b5563",
            background: "#020617",
            padding: 8,
            borderRadius: 8,
            fontSize: "0.85rem",
            marginBottom: 12,
          }}
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {visibleQuestions.map((q) => (
          <QuestionInput
            key={q.questionKey}
            question={q}
            value={answers[q.questionKey]}
            onChange={handleChange}
          />
        ))}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 12,
            fontSize: "0.9rem",
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid #4b5563",
            background: "#0f172a",
            cursor: "pointer",
            color: "#e5e7eb",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

// same logic as backend
function evaluateCondition(cond, answersSoFar) {
  const { questionKey, operator, value } = cond;
  const answer = answersSoFar?.[questionKey];

  if (answer === undefined || answer === null) {
    if (operator === "equals")
      return value === null || value === undefined || value === "";
    if (operator === "contains") return false;
    if (operator === "notEquals")
      return value !== null && value !== undefined && value !== "";
  }

  if (operator === "equals") {
    if (Array.isArray(answer)) return answer.includes(value);
    return answer === value;
  }
  if (operator === "notEquals") {
    if (Array.isArray(answer)) return !answer.includes(value);
    return answer !== value;
  }
  if (operator === "contains") {
    if (Array.isArray(answer)) return answer.includes(value);
    if (typeof answer === "string")
      return answer.indexOf(String(value)) !== -1;
    return false;
  }
  return false;
}

function shouldShowQuestion(rules, answersSoFar) {
  if (!rules) return true;
  const { logic = "AND", conditions = [] } = rules;
  if (!conditions.length) return true;
  const results = conditions.map((c) => {
    try {
      return evaluateCondition(c, answersSoFar);
    } catch (e) {
      return false;
    }
  });
  if (logic === "AND") return results.every(Boolean);
  return results.some(Boolean);
}

function QuestionInput({ question, value, onChange }) {
  const { questionKey, label, type, required, options = [] } = question;
  const v = value ?? "";

  if (type === "short_text" || type === "long_text") {
    const multiline = type === "long_text";
    return (
      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.9rem",
            marginBottom: 3,
          }}
        >
          {label} {required && <span style={{ color: "#f97316" }}>*</span>}
        </label>
        {multiline ? (
          <textarea
            style={{
              width: "100%",
              minHeight: 80,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.9rem",
            }}
            value={v}
            onChange={(e) => onChange(questionKey, e.target.value)}
          />
        ) : (
          <input
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.9rem",
            }}
            value={v}
            onChange={(e) => onChange(questionKey, e.target.value)}
          />
        )}
      </div>
    );
  }

  if (type === "single_select") {
    return (
      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.9rem",
            marginBottom: 3,
          }}
        >
          {label} {required && <span style={{ color: "#f97316" }}>*</span>}
        </label>
        <select
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.9rem",
          }}
          value={v || ""}
          onChange={(e) => onChange(questionKey, e.target.value)}
        >
          <option value="">-- select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "multi_select") {
    const arrVal = Array.isArray(value) ? value : [];
    function toggleOption(opt) {
      if (arrVal.includes(opt)) {
        onChange(
          questionKey,
          arrVal.filter((o) => o !== opt)
        );
      } else {
        onChange(questionKey, [...arrVal, opt]);
      }
    }

    return (
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>
            {label} {required && <span style={{ color: "#f97316" }}>*</span>}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map((opt) => {
            const selected = arrVal.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                style={{
                  fontSize: "0.8rem",
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: selected ? "#0f172a" : "#020617",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "attachment") {
    return (
      <AttachmentInput
        questionKey={questionKey}
        label={label}
        required={required}
        value={value}
        onChange={onChange}
      />
    );
  }

  // fallback
  return (
    <div style={{ marginBottom: 10, fontSize: "0.8rem", color: "#9ca3af" }}>
      Unsupported question type: {type}
    </div>
  );
}

function AttachmentInput({ questionKey, label, required, value, onChange }) {
  const [tempUrl, setTempUrl] = useState("");
  const arrVal = Array.isArray(value) ? value : [];

  function addUrl() {
    if (!tempUrl) return;
    const next = [...arrVal, tempUrl];
    onChange(questionKey, next);
    setTempUrl("");
  }

  function removeUrl(idx) {
    const next = arrVal.filter((_, i) => i !== idx);
    onChange(questionKey, next);
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: "0.9rem",
          marginBottom: 3,
        }}
      >
        {label} {required && <span style={{ color: "#f97316" }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        <input
          type="url"
          placeholder="https://example.com/file.png"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.85rem",
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          style={{
            fontSize: "0.8rem",
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #4b5563",
            background: "#0f172a",
            cursor: "pointer",
            color: "#e5e7eb",
            whiteSpace: "nowrap",
          }}
        >
          Add
        </button>
      </div>
      {arrVal.length > 0 && (
        <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
          {arrVal.map((u, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <a
                href={u}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#60a5fa",
                  textDecoration: "underline",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {u}
              </a>
              <button
                type="button"
                onClick={() => removeUrl(idx)}
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

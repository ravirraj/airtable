// src/ResponsesPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchResponses, getForm } from "../helper/api.js";

export default function ResponsesPage() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!formId) return;
    (async () => {
      try {
        const f = await getForm(formId);
        setForm(f);
        const data = await fetchResponses(formId);
        if (data.ok) setResponses(data.responses);
        else setMsg("Failed to load responses");
      } catch (e) {
        console.error(e);
        setMsg("Error loading responses");
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  if (!formId) return <div>Missing formId in URL.</div>;

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
        Responses for form
      </h2>
      <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 8 }}>
        formId: {formId}
        {form && <> — {form.title}</>}
      </div>

      {loading && <div>Loading...</div>}
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

      {!loading && responses.length === 0 && !msg && (
        <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          No responses yet.
        </div>
      )}

      {responses.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {responses.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                fontSize: "0.85rem",
              }}
            >
              <div>
                <strong>ID:</strong> {r.id}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(r.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> {r.status}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  maxHeight: 64,
                  overflow: "hidden",
                }}
              >
                {r.preview}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import { useEffect, useState } from "react";
import {
  fetchBases,
  fetchTables,
  fetchTableMeta,
  createForm,
} from "../helper/api.js";

const OPERATORS = ["equals", "notEquals", "contains"];

export default function FormBuilder({ onFormCreated }) {
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedBase, setSelectedBase] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [fields, setFields] = useState([]);
  const [fieldConfigs, setFieldConfigs] = useState({});
  const [title, setTitle] = useState("Project Submission Form");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBases();
        setBases(data.bases || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load bases from Airtable");
      }
    })();
  }, []);

  function updateFieldConfig(fieldName, patch) {
    setFieldConfigs((prev) => ({
      ...prev,
      [fieldName]: { ...(prev[fieldName] || {}), ...patch },
    }));
  }

  function toggleField(fieldName) {
    const current = fieldConfigs[fieldName] || {};
    updateFieldConfig(fieldName, { selected: !current.selected });
  }

  async function handleBaseChange(e) {
    const baseId = e.target.value;
    setSelectedBase(baseId);
    setSelectedTable("");
    setFields([]);
    setFieldConfigs({});
    setError("");

    if (!baseId) {
      setTables([]);
      return;
    }

    setLoadingTables(true);
    try {
      const data = await fetchTables(baseId);
      setTables(data.tables || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  }

  async function handleTableChange(e) {
    const tableId = e.target.value;
    setSelectedTable(tableId);
    setFields([]);
    setFieldConfigs({});
    setError("");

    if (!tableId) return;

    setLoadingFields(true);
    try {
      const data = await fetchTableMeta(selectedBase, tableId);
      setFields(data.fields || []);

      const initialConfigs = {};
      (data.fields || []).forEach((f) => {
        initialConfigs[f.name] = {
          selected: false,
          label: f.name,
          required: false,
          conditionalRules: null,
        };
      });
      setFieldConfigs(initialConfigs);
    } catch (err) {
      console.error(err);
      setError("Failed to load fields for this table");
    } finally {
      setLoadingFields(false);
    }
  }

  async function handleCreateForm() {
    setError("");

    if (!selectedBase || !selectedTable) {
      setError("Base aur table select karo pehle");
      return;
    }

    const chosen = fields.filter(
      (f) => fieldConfigs[f.name] && fieldConfigs[f.name].selected
    );
    if (!chosen.length) {
      setError("Kam se kam 1 field to select karo 😅");
      return;
    }

    const questions = chosen.map((f) => {
      const cfg = fieldConfigs[f.name] || {};
      return {
        questionKey: f.name.replace(/\s+/g, "_").toLowerCase(),
        airtableFieldId: f.name,
        label: cfg.label || f.name,
        required: !!cfg.required,
        conditionalRules: cfg.conditionalRules || null,
      };
    });

    setCreating(true);
    try {
      const res = await createForm({
        title,
        airtableBaseId: selectedBase,
        airtableTableId: selectedTable,
        questions,
      });

      console.log("create form res:", res);

      if (res.ok) {
        alert("Form created! ID: " + res.form._id);
        onFormCreated && onFormCreated(res.form._id);
      } else {
        console.error(res);
        setError("Server ne form create nahi kiya");
      }
    } catch (err) {
      console.error(err);
      setError("Create form request fail ho gaya");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: 8 }}>Form builder</h2>
      <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: 12 }}>
        Select an Airtable base &amp; table, then choose which fields should
        appear as questions in your form.
      </p>

      {error && (
        <div
          style={{
            border: "1px solid #b91c1c",
            background: "#450a0a",
            padding: 8,
            borderRadius: 8,
            fontSize: "0.85rem",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            marginBottom: 4,
          }}
        >
          Form title
        </label>
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Airtable-backed form"
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            marginBottom: 4,
          }}
        >
          Select base
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
          value={selectedBase}
          onChange={handleBaseChange}
        >
          <option value="">-- select base --</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {loadingTables && (
          <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 4 }}>
            Loading tables...
          </div>
        )}
      </div>

      {tables.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              marginBottom: 4,
            }}
          >
            Select table
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
            value={selectedTable}
            onChange={handleTableChange}
          >
            <option value="">-- select table --</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadingFields && (
        <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 4 }}>
          Loading fields...
        </div>
      )}

      {fields.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Select fields to turn into form questions:
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {fields.map((f) => {
              const cfg = fieldConfigs[f.name] || {};
              const selected = !!cfg.selected;
              return (
                <div
                  key={f.id}
                  style={{
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: "0.85rem",
                    backgroundColor: selected ? "#020617" : "transparent",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleField(f.name)}
                    />
                    <span>{f.name}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      {f.type}
                    </span>
                  </label>

                  {selected && (
                    <>
                      <div style={{ marginTop: 6 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            marginBottom: 2,
                          }}
                        >
                          Question label
                        </label>
                        <input
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: 6,
                            border: "1px solid #4b5563",
                            background: "#020617",
                            color: "#e5e7eb",
                            fontSize: "0.8rem",
                          }}
                          value={cfg.label || f.name}
                          onChange={(e) =>
                            updateFieldConfig(f.name, {
                              label: e.target.value,
                            })
                          }
                        />
                      </div>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                          marginBottom: 4,
                          marginTop: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!cfg.required}
                          onChange={(e) =>
                            updateFieldConfig(f.name, {
                              required: e.target.checked,
                            })
                          }
                        />
                        Required
                      </label>

                      <ConditionalRuleEditor
                        fieldName={f.name}
                        allFields={fields}
                        config={cfg}
                        onChange={(rules) =>
                          updateFieldConfig(f.name, {
                            conditionalRules: rules,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleCreateForm}
        disabled={creating}
        style={{
          marginTop: 16,
          fontSize: "0.9rem",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #4b5563",
          background: "#0f172a",
          cursor: "pointer",
          color: "#e5e7eb",
        }}
      >
        {creating ? "Creating..." : "Create form from this table"}
      </button>
    </div>
  );
}

function ConditionalRuleEditor({ fieldName, allFields, config, onChange }) {
  const rules = config.conditionalRules || { logic: "AND", conditions: [] };

  function updateRule(patch) {
    onChange({ ...rules, ...patch });
  }

  function updateCondition(index, patch) {
    const next = rules.conditions.slice();
    next[index] = { ...next[index], ...patch };
    updateRule({ conditions: next });
  }

  function addCondition() {
    const next = [
      ...rules.conditions,
      { questionKey: "", operator: "equals", value: "" },
    ];
    updateRule({ conditions: next });
  }

  function removeCondition(idx) {
    const next = rules.conditions.filter((_, i) => i !== idx);
    updateRule({ conditions: next });
  }

  const possibleDeps = allFields
    .map((f) => f.name)
    .filter((n) => n !== fieldName);

  if (possibleDeps.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 6,
        paddingTop: 6,
        borderTop: "1px dashed #1f2937",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        Conditional visibility (optional)
      </div>

      {rules.conditions.length === 0 ? (
        <button
          type="button"
          onClick={addCondition}
          style={{
            fontSize: "0.75rem",
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          + Add condition
        </button>
      ) : (
        <>
          <div
            style={{
              fontSize: "0.75rem",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Show this question when
            <select
              value={rules.logic}
              onChange={(e) => updateRule({ logic: e.target.value })}
              style={{
                fontSize: "0.75rem",
                padding: "2px 4px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
              }}
            >
              <option value="AND">ALL</option>
              <option value="OR">ANY</option>
            </select>
            of the following are true:
          </div>

          {rules.conditions.map((c, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <select
                style={{
                  fontSize: "0.75rem",
                  flex: 1,
                  padding: "2px 4px",
                  borderRadius: 6,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
                value={c.questionKey}
                onChange={(e) =>
                  updateCondition(idx, { questionKey: e.target.value })
                }
              >
                <option value="">Select question</option>
                {possibleDeps.map((n) => {
                  const key = n.replace(/\s+/g, "_").toLowerCase();
                  return (
                    <option key={key} value={key}>
                      {n}
                    </option>
                  );
                })}
              </select>

              <select
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 4px",
                  borderRadius: 6,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
                value={c.operator}
                onChange={(e) =>
                  updateCondition(idx, { operator: e.target.value })
                }
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>

              <input
                style={{
                  fontSize: "0.75rem",
                  flex: 1,
                  padding: "2px 4px",
                  borderRadius: 6,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
                placeholder="Value"
                value={c.value}
                onChange={(e) =>
                  updateCondition(idx, { value: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => removeCondition(idx)}
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
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCondition}
            style={{
              fontSize: "0.75rem",
              padding: "3px 10px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            + Add another
          </button>
        </>
      )}
    </div>
  );
}

// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export async function fetchMe() {
  const res = await api.get("/api/me");
  return res.data; // { ok, user }
}

export async function fetchBases() {
  const res = await api.get("/api/airtable/bases");
  // backend: { ok: true, data: { bases: [...] } }
  return res.data.data;
}

export async function fetchTables(baseId) {
  const res = await api.get(`/api/airtable/bases/${baseId}/tables`);
  return res.data.data;
}

export async function fetchTableMeta(baseId, tableId) {
  const res = await api.get(
    `/api/airtable/bases/${baseId}/tables/${tableId}/fields`
  );
  return res.data.data;
}

export async function createForm(payload) {
  const res = await api.post("/api/forms", payload);
  return res.data; // { ok, form }
}

export async function getForm(formId) {
  const res = await api.get(`/api/forms/${formId}`);
  // backend: { ok: true, form }
  return res.data.form;
}

export async function submitForm(formId, answers) {
  // adjust path if your backend is different
  const res = await api.post(`/api/forms/${formId}/submit`, { answers });
  return res.data;
}

export async function fetchResponses(formId) {
  const res = await api.get(`/api/forms/${formId}/responses`);
  return res.data; // { ok, responses: [...] }
}

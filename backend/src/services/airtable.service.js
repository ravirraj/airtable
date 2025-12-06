import airtableClient from "../utils/airtableClient.js";

async function listBases(user) {
  const resp = await airtableClient.get("/meta/bases", { user });
  return resp.data;
}

async function listTables(user, baseId) {
  const resp = await airtableClient.get(`/meta/bases/${baseId}/tables`, {
    user,
  });
  return resp.data;
}

async function getTableMeta(user, baseId, tableNameOrId) {
  const resp = await airtableClient.get(
    `/meta/bases/${baseId}/tables/`,
    { user }
  );

  const tables = resp.data.tables || [];
  const table =
    tables.find((t) => t.id === tableNameOrId) ||
    tables.find((t) => t.name === tableNameOrId);
  if (!table) {
    const err = new Error("table_not_found");
    err.code = "table_not_found";
    throw err;
  }
  return table;
}

async function createRecord(user, baseId, tableNameOrId, fields) {
  const resp = await airtableClient.post(
    `/${baseId}/${tableNameOrId}`,
    { fields },
    { user }
  );
  return resp.data;
}
export { listBases, listTables, getTableMeta, createRecord };

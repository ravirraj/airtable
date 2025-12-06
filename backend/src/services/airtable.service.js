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

async function getTableMeta(user, baseId, tableId) {
  const resp = await airtableClient.get(
    `/meta/bases/${baseId}/tables/${tableId}`,
    { user }
  );
  return resp.data;
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

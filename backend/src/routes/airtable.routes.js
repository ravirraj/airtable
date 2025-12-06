import express from 'express';
const router = express.Router();
import { listBases, listTables, getTableMeta } from '../services/airtable.service.js';

import  requireAuth  from'../middleware/requiredAuth.middleware.js';

router.get('/bases', requireAuth, async (req, res) => {
  try {
    
    const data = await listBases(req.currentUser);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('airtable bases', err.response?.data || err.message);
    console.log(err)
    if (err.response && err.response.status === 401) return res.status(401).json({ ok:false, error:'reauth_required' });
    return res.status(500).json({ ok:false });
  }
});

router.get('/bases/:baseId/tables', requireAuth, async (req, res) => {
  try {
    const data = await listTables(req.currentUser, req.params.baseId);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('airtable tables', err.response?.data || err.message);
    return res.status(500).json({ ok:false });
  }
});

router.get('/bases/:baseId/tables/:tableId/fields', requireAuth, async (req, res) => {
  try {
    const data = await getTableMeta(req.currentUser, req.params.baseId, req.params.tableId);
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('table meta', err.response?.data || err.message);
    return res.status(500).json({ ok:false });
  }
});

export default router;
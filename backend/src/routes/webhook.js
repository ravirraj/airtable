import express from'express';
const router = express.Router();
import {Response} from '../models/Response.model.js'
import {Form} from  '../models/Form.model.js';
import {User} from '../models/User.model.js';
import axios from 'axios';
router.post('/airtable', async (req, res) => {
  // Note: in production validate webhook signature
  const payload = req.body;
  try {
    const { eventType, baseId, tableId, recordId } = payload;
    if (!recordId) return res.status(400).json({ ok:false });

    const respDoc = await Response.findOne({ airtableRecordId: recordId });
    if (!respDoc) return res.json({ ok: true, message: 'no local record' });

    if (eventType === 'record.deleted') {
      respDoc.status = 'deletedInAirtable';
      respDoc.updatedAt = new Date();
      await respDoc.save();
      return res.json({ ok: true });
    }

    if (eventType === 'record.updated') {
      const form = await Form.findById(respDoc.formId);
      const owner = await User.findById(form.owner);
      const token = owner.accessToken;
      const r = await axios.get(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, { headers: { Authorization: `Bearer ${token}` } });
      const fields = r.data.fields || {};
      const mapFieldToQ = {};
      form.questions.forEach(q => { mapFieldToQ[q.airtableFieldId] = q.questionKey; });
      const newAnswers = {};
      for (const [fname, val] of Object.entries(fields)) {
        const qk = mapFieldToQ[fname];
        if (!qk) continue;
        newAnswers[qk] = val;
      }
      respDoc.answers = newAnswers;
      respDoc.status = 'synced';
      respDoc.updatedAt = new Date();
      await respDoc.save();
      return res.json({ ok: true });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('webhook err', err.response?.data || err.message);
    return res.status(500).json({ ok:false });
  }
});

export default router;
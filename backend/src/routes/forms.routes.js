import express from'express';
const router = express.Router();
import requireAuth from '../middleware/requiredAuth.middleware.js';
import { createForm, getForm, submitForm, listResponses } from  "../controller/Form.controller.js"


router.post('/', requireAuth, createForm);
router.get('/:formId', getForm);
router.post('/:formId/submit', submitForm);
router.get('/:formId/responses', requireAuth, listResponses);

export default router;
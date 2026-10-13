const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');

// All email templates CRUD & actions
router.get('/', emailTemplateController.getAllTemplates);
router.get('/:key', emailTemplateController.getTemplateByKey);
router.put('/:key', emailTemplateController.updateTemplate);
router.post('/:key/toggle', emailTemplateController.toggleTemplate);
router.post('/:key/reset', emailTemplateController.resetTemplate);
router.post('/:key/test', emailTemplateController.sendTestEmail);

module.exports = router;

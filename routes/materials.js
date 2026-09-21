const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// Material CRUD routes
router.get('/', materialController.getAllMaterials);
router.post('/', materialController.createMaterial);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);
router.put('/:id/restore', materialController.restoreMaterial);

module.exports = router;

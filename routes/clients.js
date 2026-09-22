const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const { ensureUploadDir } = require('../utils/uploadStorage');

// Multer storage for client agreement images
const clientStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, ensureUploadDir('clients'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `agreement-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer storage for expense bill images
const expenseStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, ensureUploadDir('expenses'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `bill-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image and PDF files are allowed'), false);
  }
};

const clientUpload = multer({
  storage: clientStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}).fields([
  { name: 'agreementImage', maxCount: 1 },
  { name: 'agreementFile', maxCount: 1 }
]);

const expenseUpload = multer({
  storage: expenseStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}).fields([
  { name: 'billImage', maxCount: 1 },
  { name: 'billFile', maxCount: 1 }
]);

// Client Portal for authenticated clients
router.get('/portal/me', authMiddleware, clientController.getMyClientProject);

// Client CRUD
router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientUpload, clientController.createClient);
router.put('/:id', clientUpload, clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.put('/:id/restore', clientController.restoreClient);

// Resend credentials email
router.post('/:id/resend-credentials', clientController.resendClientCredentials);

// Milestone / checklist points
router.put('/:id/milestones', clientController.updateClientMilestones);

// Payments
router.post('/:id/payments', clientController.addClientPayment);
router.delete('/:id/payments/:paymentId', clientController.deleteClientPayment);
router.put('/:id/payments/:paymentId/restore', clientController.restoreClientPayment);

const siteMediaStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, ensureUploadDir('site-media'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const isVideo = file.mimetype.startsWith('video/');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${isVideo ? 'video' : 'img'}-${uniqueSuffix}${ext}`);
  }
});

const siteMediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const siteMediaUpload = multer({
  storage: siteMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: siteMediaFilter
}).fields([
  { name: 'mediaFile', maxCount: 20 },
  { name: 'mediaFiles', maxCount: 20 },
  { name: 'media', maxCount: 20 },
  { name: 'file', maxCount: 20 },
  { name: 'files', maxCount: 20 }
]);

// Expenses (materials & other)
router.post('/:id/expenses', expenseUpload, clientController.addClientExpense);
router.delete('/:id/expenses/:expenseId', clientController.deleteClientExpense);
router.put('/:id/expenses/:expenseId/restore', clientController.restoreClientExpense);

// Site Media (Photos & Videos)
router.post('/:id/media', siteMediaUpload, clientController.addSiteMedia);
router.delete('/:id/media/:mediaId', clientController.deleteSiteMedia);

// Labour & Mistri Management
const labourController = require('../controllers/labourController');
router.get('/:id/labour', labourController.getProjectLabourers);
router.post('/:id/labour', labourController.addLabourer);
router.put('/:id/labour/:labourId', labourController.updateLabourer);
router.delete('/:id/labour/:labourId', labourController.deleteLabourer);

// Labour Daily Haziri / Attendance
router.get('/:id/labour/attendance', labourController.getAttendanceByDate);
router.post('/:id/labour/attendance', labourController.saveDailyAttendance);

// Labour Wage Payments & WhatsApp Receipt
router.get('/:id/labour/payments', labourController.getLabourPayments);
router.post('/:id/labour/payments', labourController.addLabourPayment);
router.delete('/:id/labour/payments/:paymentId', labourController.deleteLabourPayment);

module.exports = router;


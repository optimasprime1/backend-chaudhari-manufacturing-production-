const express = require('express');
const router = express.Router();
const {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry
} = require('../controllers/enquiryController');
const { requireAdmin } = require('../middleware/adminAuth');

router.post('/', createEnquiry);
router.use(requireAdmin);
router.get('/', getAllEnquiries);
router.get('/:id', getEnquiryById);
router.put('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);

module.exports = router;

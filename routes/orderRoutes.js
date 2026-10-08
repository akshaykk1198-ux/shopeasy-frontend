const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, createRazorpayOrder, verifyPayment } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.post('/create-payment', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;
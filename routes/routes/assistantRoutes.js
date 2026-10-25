const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/assistantController');
const rateLimit = require('../middleware/rateLimit');

// 20 messages per 10 minutes per visitor
router.post('/', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), chat);

module.exports = router;
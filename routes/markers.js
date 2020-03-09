const express = require('express');
const router = express.Router();

// User model
const User = require('../models/User');

// Must tell this route to expect JSON in body
router.use(express.json())

// Login Page
router.post('/marker', (req, res) => {
    console.log("REQ ", req.body)
});

module.exports = router;
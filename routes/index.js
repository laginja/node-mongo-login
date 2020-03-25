const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureNotAuthenticated } = require('../auth/auth');

// Welcome Page
router.get('/', ensureNotAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    req.session.Auth = req.user;
    res.render('dashboard', {
        user: req.user
    })
}   
);

module.exports = router;
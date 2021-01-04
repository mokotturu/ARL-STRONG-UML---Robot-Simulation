const express = require('express');
const mongoose = require('mongoose');
const PathTracker = require('../models/PathTracker');
const router = express.Router();

// @description     simulation page
// @route           GET /
router.get('/', (req, res) => {
    res.render('index', {
        layout: false
    });
});

// @description     simulation page
// @route           POST /
router.post('/', (req, res) => {
    const track = new PathTracker(req.body);
    track.save(err => {
        if (err) return console.log(err);
    });
    res.send("post received 1");
});

// @description     survey page
// @route           GET /survey
router.get('/survey', (req, res) => {
    res.render('survey');
});

module.exports = router;

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
router.post('/', async (req, res) => {
    console.log(req.body);
    // console.log(req.headers['content-length']);
    try {
        const track = new PathTracker(req.body);
        await track.save();
    } catch (err) {
        console.log('err' + err);
        res.status(500).send(err);
    }
});

// @description     survey page
// @route           GET /survey
router.get('/survey', (req, res) => {
    res.render('survey');
});

// @description     survey page
// @route           POST /survey
router.post('/survey', (req, res) => {
    
});

module.exports = router;

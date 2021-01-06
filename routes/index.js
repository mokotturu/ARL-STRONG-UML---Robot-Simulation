const express = require('express');
const PathTracker = require('../models/PathTracker');
const router = express.Router();
var track;  // change later to a const in the try-catch; this is just for testing

// @description     index page
// @route           GET /
router.get('/', (req, res) => {
    res.render('index', {
        layout: false
    });
});

// @description     index page
// @route           POST /
router.post('/', async (req, res) => {
    
});

// @description     simulation page
// @route           GET /simulation
router.get('/simulation', (req, res) => {
    res.render('simulation', {
        layout: false
    });
});

// @description     simulation page
// @route           POST /simulation
router.post('/simulation', async (req, res) => {
    // console.log(req.body);
    // console.log(req.headers['content-length']);
    try {
        track = new PathTracker(req.body);
        await track.save();
    } catch (err) {
        console.log('err' + err);
        res.status(500).send(err);
    }
});

// @description     stats page
// @route           GET /stats
router.get('/stats', (req, res) => {
    res.json(track);
});

// @description     stats page
// @route           POST /stats
router.post('/stats', (req, res) => {
    
});

module.exports = router;

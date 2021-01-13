const express = require('express');
const PathTracker = require('../models/PathTracker');
const router = express.Router();
var track;  // change later to a const in the try-catch; this is just for testing

express().set('trust proxy', true);

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
    try {
        track = new PathTracker({
            humanData: req.body.humanData,
            agentData: req.body.agentData,
            decisions: req.body.decisions,
            obstacles: req.body.obstacles
        });
        await track.save();
    } catch (err) {
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

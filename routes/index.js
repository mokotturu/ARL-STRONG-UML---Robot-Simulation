const express = require('express');
const PathTracker = require('../models/PathTracker');
const router = express.Router();
const uuid = require('uuid');

router.get('/user/:uuid', (req, res) => {
    res.send(uuid.v4());
});

// @description     index page
// @route           GET /
router.get('/', (req, res) => {
    res.render('index', {
        title: 'ARL STRONG UML | Home'
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
        var track = new PathTracker({
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
    // console.log(track);
    res.render('stats', {
        title: 'ARL STRONG UML | Stats'
    });
});

// @description     stats page
// @route           POST /stats
router.post('/stats', (req, res) => {
    
});

// @description     declined page
// @route           GET /declined
router.get('/declined', (req, res) => {
    res.render('declined', {
        title: 'ARL STRONG UML | Declined'
    });
});

// @description     survey-1 page
// @route           GET /survey-1
router.get('/survey-1', (req, res) => {
    res.render('survey-1', {
        title: 'ARL STRONG UML | Survey 1',
        layout: 'survey.hbs'
    });
});

// @description     survey-1-submit
// @route           POST /survey-1-submit
router.post('/survey-1-submit', (req, res) => {
    console.log(req.body);
    res.redirect('/survey-2');
});

// @description     survey-2 page
// @route           GET /survey-2
router.get('/survey-2', (req, res) => {
    res.render('survey-2', {
        title: 'ARL STRONG UML | Survey 2',
        layout: 'survey.hbs'
    });
});

module.exports = router;

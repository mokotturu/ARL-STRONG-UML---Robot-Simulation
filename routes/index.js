const express = require('express');
const SimulationResult = require('../models/SimulationResult');
const router = express.Router();
const uuid = require('uuid');

router.get('/user/:uuid', (req, res) => {
    res.send(uuid.v4());
});

router.get('/', (req, res) => {
    res.render('index', { title: 'ARL STRONG UML | Home' });
});

router.get('/simulation', (req, res) => {
    res.render('simulation', { layout: false });
});

router.post('/simulation/1', async (req, res) => {
    console.log(req.body);
    try {
        const result = new SimulationResult({
            uuid: req.body.uuid,
            section1: {
                movement: req.body.movement,
                human: req.body.human,
                agent1: req.body.agent1,
                agent2: req.body.agent2
            }
        });
        await result.save();
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.redirect(500, 'error/500');
    }
});

router.post('/simulation/2', async (req, res) => {
    console.log(req.body);
    try {
        const result = await SimulationResult.updateOne(
            { uuid: req.body.uuid },
            {
                section2: {
                    movement: req.body.movement,
                    human: req.body.human,
                    agent1: req.body.agent1,
                    agent2: req.body.agent2,
                },
                decisions: req.body.decisions,
                obstacles: req.body.obstacles
            }
        );
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.redirect(500, 'error/500');
    }
});

router.get('/thank-you', (req, res) => {
    res.render('thank-you', { title: 'ARL STRONG UML | Thank You' });
});

router.get('/declined', (req, res) => {
    res.render('declined', { title: 'ARL STRONG UML | Declined' });
});

router.get('/survey-1', (req, res) => {
    res.render('survey-1', {
        title: 'ARL STRONG UML | Survey 1',
        layout: 'survey.hbs'
    });
});

router.post('/survey-1-submit', async (req, res) => {
    console.log(req.body);
    try {
        await SimulationResult.findOneAndUpdate(
            { uuid: req.body.uuid },
            {
                survey1: {
                    reliable: req.body.reliable,
                    sincere: req.body.sincere,
                    capable: req.body.capable,
                    ethical: req.body.ethical,
                    predictable: req.body.predictable,
                    genuine: req.body.genuine,
                    skilled: req.body.skilled,
                    respectable: req.body.respectable,
                    counton: req.body.counton,
                    candid: req.body.candid,
                    competent: req.body.competent,
                    principled: req.body.principled,
                    consistent: req.body.consistent,
                    authentic: req.body.authentic,
                    meticulous: req.body.meticulous,
                    hasintegrity: req.body.hasintegrity
                },
                survey1Modified: new Date()
            }
        );
        res.redirect('/survey-2');
    } catch (err) {
        console.log(err);
        res.redirect(500, 'error/500');
    }
});

router.get('/survey-2', (req, res) => {
    res.render('survey-2', {
        title: 'ARL STRONG UML | Survey 2',
        layout: 'survey.hbs'
    });
});

router.post('/survey-2-submit', async (req, res) => {
    console.log(req.body);
    try {
        await SimulationResult.findOneAndUpdate(
            { uuid: req.body.uuid },
            {
                survey2: {
                    question1: req.body.question1,
                    question2: req.body.question2,
                    question3: req.body.question3,
                    question4: req.body.question4,
                },
                survey2Modified: new Date()
            }
        );
        res.redirect('/thank-you');
    } catch (err) {
        console.log(err);
        res.redirect(500, 'error/500');
    }
});

/* router.get('/error/400', (req, res) => {
    res.render('error/400', {
        title: 'ARL STRONG UML | Error 404'
    });
}); */

router.get('/error/500', (req, res) => {
    res.render('error/500', { title: 'ARL STRONG UML | Error 500' });
});

router.use((req, res, next) => {
    res.status(404);
    // res.redirect('error/404');
    res.render('error/400', {
        url: req.url,
        title: 'ARL STRONG UML | Error 404'
    });
    return;
});

module.exports = router;

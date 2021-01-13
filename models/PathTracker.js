const mongoose = require('mongoose');

const PathTrackerSchema = new mongoose.Schema({
    humanData: [],
    agentData: [],
    decisions: [],
    obstacles: [],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PathTracker', PathTrackerSchema);

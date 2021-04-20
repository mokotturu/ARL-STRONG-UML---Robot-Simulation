const mongoose = require('mongoose');

const SimulationResultSchema = new mongoose.Schema({
	uuid: String,
	map: Number,
	section1: {
		movement: [],
		humanTraversal: [],
		agent1Traversal: [],
		agent2Traversal: []
	},
	section2: {
		movement: [],
		humanTraversal: [],
		agent1Traversal: [],
		agent2Traversal: [],
		humanExplored: [],
		agent1Explored: [],
		agent2Explored: []
	},
	decisions: {
		agent1: [],
		agent2: []
	},
	obstacles: [],
	survey1: {
		reliable: Number,
		sincere: Number,
		capable: Number,
		ethical: Number,
		predictable: Number,
		genuine: Number,
		skilled: Number,
		respectable: Number,
		counton: Number,
		candid: Number,
		competent: Number,
		principled: Number,
		consistent: Number,
		authentic: Number,
		meticulous: Number,
		hasintegrity: Number
	},
	survey2: {
		question1: [],
		question2: [],
		question3: [],
		question4: []
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	survey1Modified: Date,
	survey2Modified: Date
});

module.exports = mongoose.model('SimulationResult', SimulationResultSchema);

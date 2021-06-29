const $mapContainer = $('#map-container');
const $map = $('#map');
const $timer = $('#timer');
const $popupModal = $("#popup-modal");
const $minimapImage = $("#minimap");
const $humanImage = $("#human-image");
const $botImage = $("#bot-image");
const $log = $('.tableItems');
const $dropdown = $('#maps');
const $progressbar = $('.background');
const $agentText = $('.agent-text');
const $prob = $('#prob');
const $hv_count = $('#hv_count');
//const $lowPMsg = $('#lowPMsg'); //Added first cue 
const $agentSnackbar = $('#agentSnackbar');
$.jCanvas.defaults.fromCenter = false;

var rows;
var columns;

const canvasWidth = $map.width();
const canvasHeight = $map.height();
var boxWidth;
var boxHeight;

const HUMAN_COLOR = "#3333ff";
const LIGHT_HUMAN_COLOR = "#9999ff";
const AGENT_COLOR = "#ce263e";
const LIGHT_AGENT_COLOR = "#ff9eae";
const TEAM_COLOR = "#ffff7f";
const LIGHT_TEAM_COLOR = "#ffff7f";
const WALL_COLOR = "black";
const TEMP_COLOR_1 = "#33ff70";
const LIGHT_TEMP_COLOR_1 = "#99ffb7";
const TEMP_COLOR_2 = "#ff8000";
const LIGHT_TEMP_COLOR_2 = "#ffbf7f";
const VICTIM_COLOR = "red";
const HAZARD_COLOR = "yellow";
const BLANK = "#e5e0e1";

/*Color given to obstacles that may have a higher
 chance of existing at a given location */
const HOT = "#ff05d7"; 

/*Color given to obstacles that may have a lower
 chance of existing at a given location */
const COLD = "#0295fe";

//Color for false negatives: orange

const FN = "#f77c05";


var grid = [];
var agent1Traversal = [];
var agent2Traversal = [];
var agent1Index = 0, agent2Index = 0, agentNum = 1;
var agent1Explored = new Set();
var agent2Explored = new Set();
var humanExplored = new Set();
var tempAgent1Explored = new Set();
var tempAgent2Explored = new Set();
var tempHumanExplored = new Set();
var uuid;
var data = [{ movement: [], human: [], agent1: [], agent2: [] }, { movement: [], human: [], agent1: [], agent2: [] }];
var obstacles = [];
var human, agent1, agent2;
var victim0, victim1, victim2, victim3, victim4, victim5, victim6, victim7, victim8, victim9, 
	hazard0, hazard1, hazard2, hazard3, hazard4, hazard5, hazard6, hazard7, hazard8, hazard9;
var mapPaths = [
	"src/data9.min.json",	//  0
	"src/data9.min.json",	//  1
	"src/data9.min.json",	//  2
	"src/data9.min.json",	//  3
	"src/data9.min.json",	//  4
	"src/data9.min.json",	//  5
	"src/data9.min.json",	//  6
	"src/data9.min.json",	//  7
	"src/data9.min.json",	//  8
	"src/data9.min.json",	//  9
	"src/data10.min.json",	// 10
	"src/data11.min.json",	// 11
	"src/data12.min.json",	// 12
	"src/data13.min.json",	// 13
	"src/data14.min.json"	// 14
];
var pathIndex = 10;
var currentPath = mapPaths[pathIndex];

var viewRadius = 9;
var count = 0, waitCount = 7, seconds = 0, timeout, startTime;
var eventListenersAdded = false, fullMapDrawn = false, pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0, half = 0, intervals = 10, duration = 10;
var log = { agent1: [], agent2: [] };

var victimMarker = new Image();
var hazardMarker = new Image();
victimMarker.src = 'img/victim-marker-big.png';
hazardMarker.src = 'img/hazard-marker-big.png';

var requests;
var currentReq = 0;

//NEW ADDITION 6/23/2021: Probability test distributions. NOT TO BE CONFUSED WITH CONFIDENCE INTERVALS A, B, C, etc

const dis_A = [0.5, 0.5, 0.5, 0.9, 0.9, 0.9, 0.5, 0.5, 0.5, 0.9]; 

/*NEW ADDITION 6/23/2021: False positive/false negative flags. Victim or hazard is either present, a false positive,
or a false negative 

0 = neutral (no false positives or false negatives)

1 = false positive 

2 = false negative

*/

const flag_A = [0, 2, 0, 0, 1, 0, 0, 0, 0, 0];


// UPDATE 6/26/2021:

//Added trust cues for agent 

const agentCues = [
"Agent 1 says: I know that I had so poor detection in a previous search.  My sensors were not working well, they are working better now.", 
"Agent 1 says: It might save you time not to integrate the map if I am not confident there is a victim in the search area",
"Agent 1 says: Checking for victims and hazards..."];



//confidence intervals

const i_A = [0.2, 0.4]; 
const i_B = [0.5,0.7];
const i_C = [0.8, 0.99];

$(document).ready(() => {
	

	
	startTime = new Date();
	uuid = sessionStorage.getItem('uuid');

	$('.body-container').css('visibility', 'hidden');
	$('.body-container').css('opacity', '0');
	$('.loader').css('visibility', 'visible');
	$('.loader').css('opacity', '1');

	createMap(currentPath, loop);

	//requestAnimationFrame(loop);
});

//MOVED THIS OUTSIDE OF createMap() on line 149, 6/25/2021

  function loop() {
		$('.loader').css('visibility', 'hidden');
		$('.body-container').css('visibility', 'visible');
		$('.body-container').css('opacity', '1');

		if (!eventListenersAdded) {
			// document arrow keys event listener
			$(document).on('keydown', e => {
				eventKeyHandlers(e);
			});
			eventListenersAdded = true;
		}

		//requestAnimationFrame(loop);

		// set speed
		
		//COMMENTED THIS OUT 6/25/2021
		
		/*
		if (++count < waitCount) {
			return;
		}

		count = 0;
		
		*/
		//Start by initializing the probability, flag and interval values
	
	    //selectProb(); //Set new probability for agent1 each time
			
        //selectFlag(); //Set new flag for agent 
	
	    //getConfInterval(); //Set confidence interval
	

		if (!pause) {
		
			if (intervalCount >= intervals) terminate();
			moveAgent1(agent1);
			// moveAgent2(agent2);
			// randomWalk(agent1);
			// randomWalk(agent2);
		}
		
		/*
		if (pause){
			//Added probability range and selection updater
			
			//At the beginning and every 2 rounds, change the confidence range 
			if (intervalCount % 2 == 0) getConfInterval();
			
            selectProb(); //Set new probability for agent1 each time
			
			selectFlag(); //Set new flag for object 

            agent1.o_count = 0; //Reset object count			
		}
		*/
	}
	
	
function union(setA, setB) {
	let _union = new Set(setA);
	for (let elem of setB) {
		_union.add(elem);
	}
	return _union;
}

function difference(setA, setB) {
	let _difference = new Set(setA);
	for (let elem of setB) {
		_difference.delete(elem);
	}
	return _difference;
}

function eventKeyHandlers(e) {
	switch (e.keyCode) {
		case 65:	// a
		case 37:	// left arrow key
		case 72:	// h
			e.preventDefault();
			if (Math.floor(grid[human.loc].x) != 1 && !grid[human.loc - rows].isWall) {
				human.loc -= rows;
				human.dir = 4;
				refreshMap();
				updateScrollingPosition(grid[human.loc]);
			}
			// console.log("Left", Math.round((performance.now()/1000) * 100)/100, human.loc);
			break;
		case 87:	// w
		case 38:	// up arrow key
		case 75:	// k
			e.preventDefault();
			if (Math.floor(grid[human.loc].y) != 1 && !grid[human.loc - 1].isWall) {
				--human.loc;
				human.dir = 1;
				refreshMap();
				updateScrollingPosition(grid[human.loc]);
			}
			// console.log("Up", Math.round((performance.now()/1000) * 100)/100, human.loc);
			break;
		case 68:	// d
		case 39:	// right arrow key
		case 76:	// l
			e.preventDefault();
			if (Math.floor(grid[human.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[human.loc + rows].isWall) {
				human.loc += rows;
				human.dir = 2;
				refreshMap();
				updateScrollingPosition(grid[human.loc]);
			}
			// console.log("Right", Math.round((performance.now()/1000) * 100)/100, human.loc);
			break;
		case 83:	// s
		case 40:	// down arrow key
		case 74:	// j
			e.preventDefault();
			if (Math.floor(grid[human.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[human.loc + 1].isWall) {
				++human.loc
				human.dir = 3;
				refreshMap();
				updateScrollingPosition(grid[human.loc]);
			}
			// console.log("Down", Math.round((performance.now()/1000) * 100)/100, human.loc);
			break;
		case 49:	// 1
			e.preventDefault();
			data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
			updateScrollingPosition(grid[agent1.loc]);
			// console.log("Shifted focus to agent", Math.round((performance.now()/1000) * 100)/100);
			break;
		case 50:	// 2
			e.preventDefault();
			data[half].movement.push({ key: e.key, t: Math.round((performance.now()/1000) * 100)/100 });
			updateScrollingPosition(grid[agent2.loc]);
		default:	// nothing
			break;
	}

	let tracker = { loc: human.loc, t: Math.round((performance.now()/1000) * 100)/100 };
	data[half].human.push(tracker);
	// console.log(tracker);
}

function terminate() {
	pause = true;
	clearInterval(timeout);

	$.ajax({
		url: "/simulation/2",
		type: "POST",
		data: JSON.stringify({
			uuid: uuid,
			movement: data[half].movement,
			humanTraversal: data[half].human,
			agent1Traversal: data[half].agent1,
			agent2Traversal: data[half].agent2,
			humanExplored: [...humanExplored],
			agent1Explored: [...agent1Explored],
			agent2Explored: [...agent2Explored],
			obstacles: obstacles,
			decisions: log
		}),
		contentType: "application/json; charset=utf-8",
		success: (data, status, jqXHR) => {
			console.log(data, status, jqXHR);
			window.location.href = "/survey-1";
		},
		error: (jqXHR, status, err) => {
			console.log(jqXHR, status, err);
			alert(err);
		}
	});
}

//Function selects a confidence range out of 3 possible ranges 

function getConfInterval(){

//var changeChoice = Math.floor(Math.random() * (4-1))+1; //Pick a number: 1 through 4 randomly

//Change the confidence interval if 2 is chosen 

//if (changeChoice == 2){

var choice = Math.floor(Math.random() * (3 - 1)) + 1; //Choose a number between 1 (inclusive) and 3 (inclusive)

//Set the confidence levels for the agent 
switch(choice) {
  case 1:
    agent1.conf[0] = i_C[0];
	agent1.conf[1] = i_C[1];
    break;
  case 2:
    agent1.conf[0] = i_B[0];
	agent1.conf[1] = i_B[1];
    
    break;
  case 3:
    agent1.conf[0] = i_A[0];
	agent1.conf[1] = i_A[1];
  
    break;
    
}
//}

}

function selectProb(){
	
	//NEW ADDITION 6/23/2021: Added a system to select probability by index of predefined array
	
	
	agent1.curr_prob = dis_A[intervalCount];
	
	//PREVIOUS ADDITION:
	
	//RANDOM VALUE SELECTOR
	//Run a while loop to run until a value has been selected between a min and max confidence level
	
	/*
	var cmax = agent1.conf[1];
	
	var cmin = agent1.conf[0];
	
	agent1.curr_prob = Math.random() * (cmax - cmin) + cmin; //Random gen * (max - min) + min
	*/
	 
}

//ADDITION 6/23/2021: Added flag selection function
function selectFlag(){

    
    agent1.flag = flag_A[intervalCount];
        

}

//ADDITION 6/23/2021: Added cue message selection function
function selectCue(){


//CUE MESSAGES
/* 0 = undertrust, 1 = overtrust, 3 = normal 
*/

//INTEGRATE DECISIONS 
/* 1 = integrate, 2 = decline */

	 
     if (agent1.curr_prob >= 0.9){
		 
		 switch(agent1.trust_ack){
		     case 2:
			 //Undertrust cue deployment
             $agentSnackbar.text(agentCues[0]);
             break;			 
		     
			 default:
			 
		    //Normal scanning message
		    $agentSnackbar.text(agentCues[2]);
		 }
	 } 

	
	//Overtrust cue deployment 
    else if (agent1.curr_prob <=0.5){
		
		switch(agent1.trust_ack){
		    case 1:
			//Overtrust cue deployment
			$agentSnackbar.text(agentCues[1]);
			break;
			
			default:
			//Normal scanning message
			$agentSnackbar.text(agentCues[2]);
		}
		
	}
}


function updateAgentProps(){

    //Added probability range and selection updater
			
	//At the beginning and every 2 rounds, change the confidence range 
			
	//if (intervalCount % 2 == 0) getConfInterval();
			
    selectProb(); //Set new probability for agent1 each time
			
    selectFlag(); //Set new flag for object 

    agent1.h_count = 0; //Reset hazard count
	
	agent1.v_count = 0; //Reset victim count

}


function chooseObColor(){
    
	//Obstacle gets hot pink color if high probability
    if (agent1.ob_color > 0.6){
	agent1.curr_ob.color = HOT;
	}
					
	//Obstacle gets blue color if low probability
	else if (agent1.ob_color < 0.6){
	agent1.curr_ob.color = COLD;
	}
	
}


function showExploredInfo() {
	if (agentNum == 1) {
		$humanImage.attr("src", $map.getCanvasImage());
		$botImage.attr("src", $map.getCanvasImage());
	}

	drawMarkers(obstacles);

	$(document).off();

	$popupModal.css('display', 'block'); 
	$popupModal.css('visibility', 'visible');
	$popupModal.css('opacity', '1');
	$minimapImage.attr("src", $map.getCanvasImage());

	$log.empty();

	if (agentNum == 1) {
		//Currently using global variable to grab data. Future uses will implement general argument for probability. 
        
		//Display probability of success if obstacles found or false negative occurs for P<=0.5
        if ( (agent1.curr_prob >0.5 && agent1.flag == 0) || (agent1.curr_prob <=0.5 && agent1.flag == 2)){		
		$prob.text('Agent 1 says: My sensors are working well right now. I am ' + (agent1.curr_prob*100).toPrecision(2) + '% confident that there is a victim or hazard in here.');
	
		}
		
		//Display probability of failure if no obstacles found or false positive occurs for P>0.5
		if ((agent1.curr_prob <=0.5 && agent1.flag == 0) || (agent1.curr_prob >0.5 && agent1.flag == 1)){
		$prob.text('Agent 1 says: My sensors are not working well right now. I am  '+  ( (agent1.curr_prob) * 100).toPrecision(2) + '% confident that there is a victim or hazard in here.');
		
		}
		
		$prob.css("background-color", AGENT_COLOR); //Set probability message color to agent color
		$prob.css("color", "white"); //Set text color of probability message to white
		
		//Display number of victims and hazards found
		
		$hv_count.text('Victims found by Agent 1: ' + agent1.v_count + '\n Hazards found by Agent 1: ' + agent1.h_count + '\n Search time remaining: ' + (100 - ((intervalCount+1) * duration)) + ' s');
	
		
		$agentText.toggleClass("changed", false);
		$agentText.css("color", "#99ffb7");
		$agentText.html(`Agent ${agentNum} explored area (green)
		<i class="fas fa-info-circle tooltip">
			<span class="tooltiptext">If there is no area highlighted in green, then the agent did not explore any new area.</span>
		</i>`);
		if (log.agent1[intervalCount - 1] != null) {
			log.agent1.forEach((data, i) => {
				if (data.trusted) {
					
					$log.append(`<p style='background-color: #99ffb7;'>${i + 1} - Integrated</p>`);
				} else { 
					
					$log.append(`<p style='background-color: #ff9eae;'>${i + 1} - Discarded</p>`);
				}
			});
		}
	} else if (agentNum == 2) {
		$agentText.toggleClass("changed", true);
		$agentText.css("color", "#ffbf7f");
		$agentText.html(`Agent ${agentNum} explored area (orange)
		<i class="fas fa-info-circle tooltip">
			<span class="tooltiptext">If there is no area highlighted in orange, then the agent did not explore any new area.</span>
		</i>`);
		log.agent2.forEach((data, i) => {
			if (data.trusted) {
				$log.append(`<p style='background-color: #99ffb7;'>${i + 1} - Integrated</p>`);
			} else {
				$log.append(`<p style='background-color: #ff9eae;'>${i + 1} - Discarded</p>`);
			}
		});
	}

	getSetBoundaries(tempHumanExplored, 0);
	if (agentNum == 1) getSetBoundaries(tempAgent1Explored, 1);
	else if (agentNum == 2) getSetBoundaries(tempAgent2Explored, 1);
	scaleImages();

	pause = true;
	clearInterval(timeout);

	setTimeout(() => { $popupModal.scrollTop(-10000) }, 500);
	setTimeout(() => { $log.scrollLeft(10000) }, 500);
}

// redraw the map and hide pop-up
function hideExploredInfo() {
	if (intervalCount == 5) {
		$.ajax({
			url: "/simulation/1",
			type: "POST",
			data: JSON.stringify({
				uuid: uuid,
				map: pathIndex,
				movement: data[half].movement,
				humanTraversal: data[half].human,
				agent1Traversal: data[half].agent1,
				agent2Traversal: data[half].agent2
			}),
			contentType: "application/json; charset=utf-8"
		});
		++half;
	}

	$map.clearCanvas();
	tempHumanExplored.forEach((key, item, set) => {
		draw(grid[item], 0);
	});

	agent1Explored.forEach(function(key, item, set) {
		draw(grid[item], 1);
	});
	
	tempAgent1Explored.clear();
	refreshMap();

	$(document).on('keydown', e => {
		eventKeyHandlers(e);
	});

	$popupModal.css('visibility', 'hidden');
	$popupModal.css('display', 'none');
	$popupModal.css('opacity', '0');
	$progressbar.css('width', `${Math.round(intervalCount*100/intervals)}%`);
	$progressbar.html(`<p>${Math.round(intervalCount*100/intervals)}%</p>`);
	clearInterval(timeout);
	timeout = setInterval(updateTime, 1000);
	pause = false;
	$agentSnackbar.addClass('show');
	//Run a number of cycles of animation defined in agentStackbar over 8 seconds  
	setTimeout(() => { $agentSnackbar.removeClass('show'); }, 8000);
}

function confirmExploredArea() {
	
	
    //NEW ADDITION 6/23/21: TRUST CUE CONDITIONAL TESTING
					
	agent1.trust_ack = 1; //Set trust for agent to trusted 
	
		
	selectCue();
	
	tempAgent1Explored.forEach(item => {
		grid[item].isAgentExplored = true;
		agent1Explored.add(item);
	});

	tempHumanExplored.forEach(item => {
		grid[item.isHumanExplored] = true;
		humanExplored.add(item);
	});



    

    //Update the obstacles for color 
	for (let i = 0; i < agent1.o_count; ++i){
		for (let j = 0; j < obstacles.length; ++j){
			/*Each time, compare the locations the agent found to 
			the locations of all obstacles on the map*/
			if (agent1.ob_locs[i].loc == obstacles[j].loc){
				/*Check the ID and change color back to original hazard and victim colors
				This will indicate an object has been found on the map */
				switch (obstacles[j].loc){
					case ("hazard"):
					
					//Check for false positives or false negatives (PHASE 1 6/25/2021)
					switch(flag_A[intervalCount]){
					
					//Neutral
					case 0: 
					obstacles[j].color = HAZARD_COLOR;
					obstacles[j].accepted = true;
					break;
					
					//False positive
					case 1:
					obstacles[j].color = LIGHT_TEAM_COLOR_1;
					obstacles[j].accepted = true;
					
					break;
					
					//False negative
					case 2:
					obstacles[j].color = FN;
					obstacles[j].accepted = true;
					
					}
					
					
					break;
					
					case ("victim"):
					//Check for false positives or false negatives (PHASE 1 6/25/2021)
					switch(flag_A[intervalCount]){
					
					//Neutral
					case 0: 
					obstacles[j].color = HAZARD_COLOR;
					obstacles[j].accepted = true;
					break;
					
					//False positive
					case 1:
					obstacles[j].color = LIGHT_TEAM_COLOR_1;
					obstacles[j].accepted = true;
					
					break;
					
					//False negative
					case 2:
					obstacles[j].color = FN;
					obstacles[j].accepted = true;
					
					}
				}
			}
		}
	}
		
	log.agent1.push({interval: intervalCount++, trusted: true});
	
	updateAgentProps();	//Update agent probability, flags, confidence interval
	
	hideExploredInfo();
}

function undoExploration() {
	
	agent1.trust_ack = 2; //Set lack of trust for agent
	
		
	selectCue();
	
	
	
	log.agent1.push({interval: intervalCount++, trusted: false});
	
	updateAgentProps();	//Update agent probability, flags, confidence interval
	
	
	hideExploredInfo();
	
	
}

function updateScrollingPosition(loc) {
	let x = loc.x * boxWidth;
	let y = loc.y * boxHeight;
	$mapContainer[0].scroll(x - $mapContainer.width()/2, y - $mapContainer.height()/2);
}

function updateTime() {
	++seconds;
	if (seconds % duration == 0) {
		seconds = 0;
		showExploredInfo();
	}
	$timer.text('Time elapsed: ' + seconds + 's');
}

// creates an array containing cells with x and y positions and additional details
function createMap(currentPath, cb) {
	grid = [];
	tempHumanExplored.clear();
	tempAgent1Explored.clear();
	agent1Explored.clear();
	agent2Explored.clear();
	log = { agent1: [], agent2: [] };
	$log.empty();
	agent1Index = 0, agent2Index = 0;

	// agent 1
	/* $.getJSON('src/details9.json', data => {
		$.each(data.traversal, (i, value) => {
			agent1Traversal.push({ x: value[0], y: value[1] });
		})
	}); */

	// agent 2
	/* $.getJSON('src/bnm9.json', data => {
		Object.entries(data).forEach(([key, value]) => {
			agent2Traversal.push({ cX: value.current_x, cY: value.current_y, vX: value.visited_x, vY: value.visited_y });
		});
	}); */

	// agent 1 human-like
	$.getJSON('src/data10_human2.json', data => {
		Object.entries(data).forEach(([key, value]) => {
			agent1Traversal.push({ current: value.current, explored: value.visited });
		});
	});

	$.getJSON(currentPath, data => {
		rows = data.dimensions[0].rows;
		columns = data.dimensions[0].columns;
		boxWidth = canvasWidth/rows;
		boxHeight = canvasHeight/columns;
		$.each(data.map, (i, value) => {
			grid.push({ x: value.x, y: value.y, isWall: value.isWall == "true", isHumanExplored: false, isAgentExplored: false });
		});
	}).fail(() => {
		alert("An error has occured.");
	}).done(() => {
		// data 9: 177414
		let tempLoc1 = agent1Traversal[agent1Index++].current;
		// let tempLoc2 = agent2Traversal[agent2Index++];
		human = { id: "human", loc: 131348, color: HUMAN_COLOR, dir: 1 };
		agent1 = { id: "agent1", loc: /* 131320 */tempLoc1[0][1] + tempLoc1[0][0]*columns, color: AGENT_COLOR, dir: 1, step: 1, stepsCovered: 0, minSteps: 7, maxSteps: 0, conf: i_A,curr_prob:dis_A[intervalCount], flag: flag_A[0], o_count:0, h_count:0, v_count:0, ob_color: "#0295fe", ob_locs:[],trust_ack:0 };
		
		// UPDATE 6/25/2021: Added curr_ob to keep track of current obstacle locations agent finds during each interval
		
		//Agent test 1
		victim0 = { id: "victim", loc: 89200, color: VICTIM_COLOR, isFound: false, accepted: false, fp: false, fn:false };
		
		victim1 = { id: "victim", loc: 147482, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 2
		victim2 = { id: "FNV", loc: 69151, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false};
		
		victim3 = { id: "victim", loc: 84339, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 3
		victim4 = { id: "victim", loc: 84190, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		victim5 = { id: "victim", loc: 193849, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 4
		victim6 = { id: "victim", loc: 64155, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		victim7 = { id: "victim", loc: 145639, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 5
		victim8 = { id: "FPV", loc: 74185, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		victim9 = { id: "victim", loc: 75719, color: VICTIM_COLOR, isFound: false, accepted: true, fp: false, fn:false };

        //Agent test 6
		hazard0 = { id: "hazard", loc: 74174, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		hazard1 = { id: "hazard", loc: 183849, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		
		hazard2 = { id: "hazard", loc: 141711, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 7
		hazard3 = { id: "hazard", loc: 61712, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 8
		hazard4 = { id: "hazard", loc: 69220, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		hazard5 = { id: "hazard", loc: 170831, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 9
		hazard6 = { id: "hazard", loc: 70230, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		hazard7 = { id: "hazard", loc: 174791, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		//Agent test 10
		hazard8 = { id: "hazard", loc: 71660, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		hazard9 = { id: "hazard", loc: 188702, color: HAZARD_COLOR, isFound: false, accepted: true, fp: false, fn:false };
		
		obstacles.push(victim0, victim1, victim2, victim3, victim4, victim5, victim6, victim7, victim8, victim9, hazard0, hazard1, hazard2, hazard3, hazard4, hazard5, hazard6, hazard7, hazard8, hazard9);

		spawn([human, agent1], 1);
		spawn(obstacles, 1);
		refreshMap();
        
		//console.log(agent1);
		
		console.log("Spawn", Math.round((performance.now()/1000) * 100)/100, human.loc);
		// console.log(uuid);
		// console.log("Spawn", Math.round((performance.now()/1000) * 100)/100, agent1.loc);
		// console.log("Spawn", Math.round((performance.now()/1000) * 100)/100, agent2.loc);

		let tracker = { loc: human.loc, t: Math.round((performance.now()/1000) * 100)/100 };
		data[half].human.push(tracker);
		// console.log(tracker);

		tracker = { loc: agent1.loc, t: Math.round((performance.now()/1000) * 100)/100 };
		data[half].agent1.push(tracker);
		// console.log(tracker);

		updateScrollingPosition(grid[human.loc]);
		timeout = setInterval(updateTime, 1000);
		cb(grid);
		
		//ADDED MANUAL AGENT TIMING INTERVAL IN 6/25/2021
		setInterval(loop, 109); //Have agent move a block every N milliseconds  
	});
}

function drawMarkers(members) {
	members.forEach(member => {
		if (member.id == "victim" && member.isFound) {
			$map.drawImage({
				source: 'img/victim-marker-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		} else if (member.id == "hazard" && member.isFound) {
			$map.drawImage({
				source: 'img/hazard-marker-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		}
		
		
		//NEW ADDITIONS 6/25/2021: false negative and false positive markers  for hazards and victims
		
		  else if ((member.id == "FPV" || member.id == "FPH") && member.isFound) {
			$map.drawImage({
				source: 'img/false-positive-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		
		}
		
		  else if ( (member.id == "FNV" || member.id == "FNH") && member.isFound) {
			$map.drawImage({
				source: 'img/false-negative-big.png',
				x: grid[member.loc].x*boxWidth + boxWidth/2 - victimMarker.width/2, y: grid[member.loc].y*boxHeight + boxHeight/2 - victimMarker.height
			});
		
		}
		
		
	});
}

// draw a square given a cell
// who: 0 - human, 1 - agent1, 2 - agent2
function draw(cell, who) {
	let lightColor = LIGHT_TEMP_COLOR_1, darkColor = TEMP_COLOR_1;
	if (who == 2) {
		lightColor = LIGHT_TEMP_COLOR_2;
		darkColor = TEMP_COLOR_2;
	}

	if (cell.isHumanExplored && !cell.isAgentExplored) {
		lightColor = LIGHT_HUMAN_COLOR;
		darkColor = HUMAN_COLOR;
	} else if (cell.isAgentExplored && !cell.isHumanExplored) {
		lightColor = LIGHT_AGENT_COLOR;
		darkColor = AGENT_COLOR;
	} else if (cell.isHumanExplored && cell.isAgentExplored) {
		lightColor = LIGHT_TEAM_COLOR;
		darkColor = TEAM_COLOR;
	}

	if (cell.isWall) {
		$map.drawRect({
			fillStyle: WALL_COLOR,
			strokeStyle: darkColor,
			strokeWidth: 1,
			cornerRadius: 2,
			x: cell.x*boxWidth, y: cell.y*boxHeight,
			width: boxWidth - 1, height: boxHeight - 1
		});
	} else {
		$map.drawRect({
			fillStyle: lightColor,
			x: cell.x*boxWidth, y: cell.y*boxHeight,
			width: boxWidth - 1, height: boxHeight - 1
		});
	}
}

// spawns the bot in its location
// size - scale factor
function spawn(members, size) {
	members.forEach(member => {
		if (member.id == "human") {
			$map.drawRect({
				fillStyle: member.color,
				x: grid[member.loc].x*boxWidth, y: grid[member.loc].y*boxHeight,
				width: (boxWidth - 1)*size, height: (boxHeight - 1)*size
			});
		} else if (member.id == "agent1" || member.id == "agent2") {
			$map.drawRect({
				fillStyle: member.color,
				x: grid[member.loc].x*boxWidth, y: grid[member.loc].y*boxHeight,
				width: (boxWidth - 1)*size, height: (boxHeight - 1)*size
			});

			if (member.id == "agent1") {
				$map.drawText({
					fromCenter: true,
					fillStyle: LIGHT_TEMP_COLOR_1,
					x: grid[member.loc].x*boxWidth + boxWidth/2, y: grid[member.loc].y*boxHeight + boxHeight/2,
					fontSize: boxWidth,
					fontFamily: 'Montserrat, sans-serif',
					text: member.id == 'agent1' ? '1' : '2'
				});
			} else {
				$map.drawText({
					fromCenter: true,
					fillStyle: LIGHT_TEMP_COLOR_2,
					x: grid[member.loc].x*boxWidth + boxWidth/2, y: grid[member.loc].y*boxHeight + boxHeight/2,
					fontSize: boxWidth,
					fontFamily: 'Montserrat, sans-serif',
					text: member.id == 'agent1' ? '1' : '2'
				});
			}
		} else if (member.id == "victim" && member.isFound) {
			$map.drawEllipse({
				fromCenter: true,
				fillStyle: member.color,
				x: grid[member.loc].x*boxWidth + boxWidth/2, y: grid[member.loc].y*boxHeight + boxHeight/2,
				width: (boxWidth - 1)*size, height: (boxHeight - 1)*size
			});
		} else if (member.id == "hazard" && member.isFound) {
			$map.drawPolygon({
				fromCenter: true,
				fillStyle: member.color,
				x: grid[member.loc].x*boxWidth + boxWidth/2, y: grid[member.loc].y*boxHeight + boxHeight/2,
				radius: ((boxWidth - 1)/2)*size,
				sides: 3
			});
		}
	});
}

// redraws the map and spawns the bots in their new location
function refreshMap() {
	// human surroundings
	let humanFOV = findLineOfSight(human);
	let humanFOVSet = new Set(humanFOV);	// convert array to set

	humanFOVSet.forEach(item => {
		grid[item].isHumanExplored = true;
		tempHumanExplored.add(item);

		draw(grid[item], 0);

		for (let i = 0; i < obstacles.length; ++i) {
			if (item == obstacles[i].loc) {
				obstacles[i].isFound = true;
			}
		}
	});

	// bot surroundings
	// agent 1
	// let agentFOV = findLineOfSight(agent1);
	/* let agentFOVSet = new Set(agentFOV);	// convert array to set

	agentFOVSet.forEach(item => {
		tempAgent1Explored.add(item);
		draw(grid[item], 1);

		for (let i = 0; i < obstacles.length; ++i) {
			if (item == obstacles[i].loc) {
				obstacles[i].isFound = true;
			}
		}
	}); */

	// AGENT 1 HUMAN LIKE
	let agentFOV = agent1Traversal[agent1Index - 1].explored;
	let agentFOVSet = new Set(agentFOV);

	agentFOVSet.forEach(item => {
		let thisCell = item[1] + item[0]*columns;
		let neighbours = [thisCell - 1, thisCell - 1 + columns, thisCell + columns, thisCell + columns + 1, thisCell + 1, thisCell - columns + 1, thisCell - columns, thisCell - columns - 1];

		tempAgent1Explored.add(thisCell);
		draw(grid[thisCell], 1);
		
		neighbours.forEach((data, i) => {
			if (grid[data].isWall) {
				tempAgent1Explored.add(data);
				draw(grid[data], 1);
			}
		});

		for (let i = 0; i < obstacles.length; ++i) {
			if (thisCell == obstacles[i].loc) {
				//Add to the temporary obstacle counter for the agent too
				//agent1.o_count++;
				if (obstacles[i].isFound == false){
				//Count how many victims and hazards were found by the agent
				    
					
					switch(obstacles[i].id){
				    
					//=============
					//HAZARD FOUND
					//=============
					
					
					case "hazard":
				    agent1.h_count++;
					
					
					agent1.o_count++;
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "hazard", loc: thisCell};
					
					console.log("GOT A HAZARD");
	                
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
					break;
				
				    //=============
				    //VICTIM FOUND
					//=============
				    case "victim":
				    agent1.v_count++;
					agent1.o_count++;
					
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "victim", loc: thisCell};
					
					console.log("GOT A VICTIM");
					
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
				    break;
					
					//===========================
					//FALSE POSITIVE VICTIM FOUND
					//===========================
					
					case "FPV":
				    //agent1.v_count++;
					agent1.o_count++;
					
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "FPV", loc: thisCell};
					
					console.log("GOT A VICTIM");
					
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
				    break;
					
					//===========================
					//FALSE POSITIVE HAZARD FOUND
					//===========================
					
					case "FPH":
				    //agent1.h_count++;
					agent1.o_count++;
					
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "FPH", loc: thisCell};
					
					console.log("GOT A HAZARD");
					
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
				    break;
					
					//===========================
					//FALSE NEGATIVE VICTIM FOUND
					//===========================
					
					case "FNV":
				    //agent1.v_count++;
					agent1.o_count++;
					
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "FNV", loc: thisCell};
					
					console.log("GOT A VICTIM");
					
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
				    break;
					
					//===========================
					//FALSE NEGATIVE HAZARD FOUND
					//===========================
					
					case "FNH":
				    //agent1.h_count++;
					agent1.o_count++;
					
					
					//Add obstacle type and location to list for agent1 to use 
					agent1.ob_locs[agent1.o_count - 1] = { id: "FNH", loc: thisCell};
					
					console.log("GOT A HAZARD");
					
					//Pick victim/hazard color
					chooseObColor();
					
					obstacles[i].color = agent1.ob_color;
					
				    break;
					
				    }
				}
				obstacles[i].isFound = true;
			}
		}
	});

	spawn([human, agent1], 1);
	spawn(obstacles, 1);

	// testing purposes
	/* if (tempAgent1Explored.size >= 49827) {
		pause = true;
		console.log(Math.round((performance.now()/1000) * 100)/100, count, tempAgent1Explored.size);
	} */
}

// 0 - human, 1 - bot
function getSetBoundaries(thisSet, who) {
	if (who == 1) {
		let setIterator = thisSet.values();
		let firstElement = setIterator.next().value;
		botLeft = grid[firstElement].x;
		botRight = grid[firstElement].x;
		botTop = grid[firstElement].y;
		botBottom = grid[firstElement].y;

		for (let i = setIterator.next().value; i != null; i = setIterator.next().value) {
			if (grid[i].x < botLeft) botLeft = grid[i].x;
			if (grid[i].x > botRight) botRight = grid[i].x;
			if (grid[i].y < botTop) botTop = grid[i].y;
			if (grid[i].y > botBottom) botBottom = grid[i].y;
		}
	} else {
		let setIterator = thisSet.values();
		let firstElement = setIterator.next().value;
		humanLeft = grid[firstElement].x;
		humanRight = grid[firstElement].x;
		humanTop = grid[firstElement].y;
		humanBottom = grid[firstElement].y;

		if (humanLeft == null) humanLeft = grid[firstElement].x;
		if (humanRight == null) humanRight = grid[firstElement].x;
		if (humanTop == null) humanTop = grid[firstElement].y;
		if (humanBottom == null) humanBottom = grid[firstElement].y;

		for (let i = setIterator.next().value; i != null; i = setIterator.next().value) {
			if (grid[i].x < humanLeft) humanLeft = grid[i].x;
			if (grid[i].x > humanRight) humanRight = grid[i].x;
			if (grid[i].y < humanTop) humanTop = grid[i].y;
			if (grid[i].y > humanBottom) humanBottom = grid[i].y;
		}
	}
}

// random walk
function moveAgent1(agent) {
	let tempPrevLoc = agent1Traversal[agent1Index - 1].current;
	let tempLoc = agent1Traversal[agent1Index++].current;
	agent.loc = tempLoc[0][1] + tempLoc[0][0]*columns;

	draw(grid[tempPrevLoc[0][1] + tempPrevLoc[0][0]*columns], 0);
	refreshMap();

	let tracker = { loc: agent.loc, t: Math.round((performance.now()/1000) * 100)/100 };
	data[half].agent1.push(tracker);
}

function moveAgent2(agent) {
	/* let tempLoc = agent2Traversal[agent2Index++];
	agent.loc = tempLoc.cY + tempLoc.cX*columns;

	refreshMap();

	let tracker = { loc: agent.loc, t: Math.round((performance.now()/1000) * 100)/100 };
	data[half].agent2.push(tracker); */

	let tempLoc = agent2Traversal[agent2Index++];
	agent.loc = tempLoc.current[0][1] + tempLoc.current[0][0]*columns;

	refreshMap();

	let tracker = { loc: agent.loc, t: Math.round((performance.now()/1000) * 100)/100 };
	data[half].agent2.push(tracker);
}

function randomWalk(agent) {
	let minSteps = agent.minSteps;
	let maxSteps = agent.maxSteps;
	let step = agent.step;
	switch (agent.dir) {
		case 1:
			if (agent.stepsCovered > 0 && Math.floor(grid[agent.loc].y) != 1 && !grid[agent.loc - step*columns].isWall) {
				grid[agent.loc].isExplored = true;
				agent.loc -= step*columns;
				--agent.stepsCovered;
				refreshMap();
			} else {
				agent.stepsCovered = Math.floor(Math.random() * maxSteps) + minSteps;
				agent.dir = Math.random() < Math.random() ? 4 : 2;
			}
			break;
		case 2:
			if (agent.stepsCovered > 0 && Math.floor(grid[agent.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[agent.loc + step].isWall) {
				grid[agent.loc].isExplored = true;
				agent.loc += step;
				--agent.stepsCovered;
				refreshMap();
			} else {
				agent.stepsCovered = Math.floor(Math.random() * maxSteps) + minSteps;
				agent.dir = Math.random() < Math.random() ? 1 : 3;
			}
			break;
		case 3:
			if (agent.stepsCovered > 0 && Math.floor(grid[agent.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[agent.loc + step*columns].isWall) {
				grid[agent.loc].isExplored = true;
				agent.loc += step*columns;
				--agent.stepsCovered;
				refreshMap();
			} else {
				agent.stepsCovered = Math.floor(Math.random() * maxSteps) + minSteps;
				agent.dir = Math.random() < Math.random() ? 2 : 4;
			}
			break;
		case 4:
			if (agent.stepsCovered > 0 && Math.floor(grid[agent.loc].x) != 1 && !grid[agent.loc - step].isWall) {
				grid[agent.loc].isExplored = true;
				agent.loc -= step;
				--agent.stepsCovered;
				refreshMap();
			} else {
				agent.stepsCovered = Math.floor(Math.random() * maxSteps) + minSteps;
				agent.dir = Math.random() < Math.random() ? 3 : 1;
			}
			break;
		default:
			// nothing
			break;
	}
	
	let tracker = { loc: agent.loc, t: Math.round((performance.now()/1000) * 100)/100 };
	if (agent.id == "agent1") data[half].agent1.push(tracker);
	else if (agent.id == "agent2") data[half].agent2.push(tracker);
	// console.log(tracker);
}

function scaleImages() {
	let botWidth = columns/(botRight - botLeft + 5) * 100;
	let botHeight = rows/(botBottom - botTop + 5) * 100;
	let humanWidth = columns/(humanRight - humanLeft + 5) * 100;
	let humanHeight = rows/(humanBottom - humanTop + 5) * 100;

	botWidth = (botWidth < 100) ? 100 : botWidth;
	botHeight = (botHeight < 100) ? 100 : botHeight;

	humanWidth = (humanWidth < 100) ? 100 : humanWidth;
	humanHeight = (humanHeight < 100) ? 100 : humanHeight;

	if (botWidth > botHeight) {
		$botImage.attr("width", botHeight + "%");
		$botImage.attr("height", botHeight + "%");
	} else {
		$botImage.attr("width", botWidth + "%");
		$botImage.attr("height", botWidth + "%");
	}

	if (humanWidth > humanHeight) {
		$humanImage.attr("width", humanHeight + "%");
		$humanImage.attr("height", humanHeight + "%");
	} else {
		$humanImage.attr("width", humanWidth + "%");
		$humanImage.attr("height", humanWidth + "%");
	}
	
	$botImage.parent()[0].scroll((botLeft + (botRight - botLeft + 1)/2)*($botImage.width()/columns) - $('.explored').width()/2, ((botTop + (botBottom - botTop + 1)/2)*($botImage.height()/rows)) - $('.explored').height()/2);
	$humanImage.parent()[0].scroll((humanLeft + (humanRight - humanLeft + 1)/2)*($humanImage.width()/columns) - $('.explored').width()/2, ((humanTop + (humanBottom - humanTop + 1)/2)*($humanImage.height()/rows)) - $('.explored').height()/2);
}

function findLineOfSight(bot) {
	let thisSurroundings = [[], [], [], []];
	let centerX = grid[bot.loc].x;
	let centerY = grid[bot.loc].y;
	let i = 0, j = 0;

	// quadrant 1
	for (let y = centerY; y >= centerY - viewRadius; --y) {
		for (let x = centerX; x <= centerX + viewRadius; ++x) {
			thisSurroundings[0].push({x: i, y: j, loc: y + x*rows});
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	// quadrant 2
	for (let y = centerY; y >= centerY - viewRadius; --y) {
		for (let x = centerX; x >= centerX - viewRadius; --x) {
			thisSurroundings[1].push({x: i, y: j, loc: y + x*rows});
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	// quadrant 3
	for (let y = centerY; y <= centerY + viewRadius; ++y) {
		for (let x = centerX; x >= centerX - viewRadius; --x) {
			thisSurroundings[2].push({x: i, y: j, loc: y + x*rows});
			++i;
		}
		i = 0;
		++j;
	}

	i = 0, j = 0;

	//quadrant 4
	for (let y = centerY; y <= centerY + viewRadius; ++y) {
		for (let x = centerX; x <= centerX + viewRadius; ++x) {
			thisSurroundings[3].push({x: i, y: j, loc: y + x*rows});
			++i;
		}
		i = 0;
		++j;
	}

	return castRays(thisSurroundings);
}

// arr has quadrant one ([0]), quadrant two ([1]), quadrant three ([2]), quadrant four ([3]).
function castRays(arr) {
	let mySurroundings = [];
	// quadrant 1
	for (let i = viewRadius; i < arr[0].length; i += viewRadius + 1) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[0][0], arr[0][i], 1, arr[0]));
	}
	for (let i = arr[0].length - viewRadius - 1; i < arr[0].length - 1; ++i) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[0][0], arr[0][i], 1, arr[0]));
	}

	// quadrant 2
	for (let i = viewRadius; i < arr[1].length; i += viewRadius + 1) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
	}
	for (let i = arr[1].length - viewRadius - 1; i < arr[1].length - 1; ++i) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
	}

	// quadrant 3
	for (let i = viewRadius; i < arr[2].length; i += viewRadius + 1) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
	}
	for (let i = arr[2].length - viewRadius - 1; i < arr[2].length - 1; ++i) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
	}

	// quadrant 4
	for (let i = viewRadius; i < arr[3].length; i += viewRadius + 1) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
	}
	for (let i = arr[3].length - viewRadius - 1; i < arr[3].length - 1; ++i) {
		mySurroundings = mySurroundings.concat(bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
	}

	return mySurroundings;
}

function getCell(x, y, grid) {
	for (let i = 0; i < grid.length; ++i) {
		if (grid[i].x == x && grid[i].y == y) return grid[i];
	}
	return null;
}

function bresenhams(cell1, cell2, quad, thisGrid) {
	let x1 = cell1.x, y1 = cell1.y, x2 = cell2.x, y2 = cell2.y;

	let dx = x2 - x1, dy = y2 - y1;
	let m = dy/dx;
	let p;

	let arr = [];
	arr.push(getCell(x1, y1, thisGrid).loc);
	if (m >= 0 && m <= 1) {
		p = (2*dy) - dx;
		while (x1 < x2) {
			if (p < 0) {
				++x1;
				p += 2*dy;
				arr.push(getCell(x1, y1, thisGrid).loc)
				if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2*(dy - dx);
				arr.push(getCell(x1, y1, thisGrid).loc);
				if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
			}
		}
	} else if (m > 1) {
		p = (2*dx) - dy;
		while (y1 < y2) {
			if (p < 0) {
				++y1;
				p += 2*dx;
				arr.push(getCell(x1, y1, thisGrid).loc);
				if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
			} else {
				++x1;
				++y1;
				p += 2*(dx - dy);
				arr.push(getCell(x1, y1, thisGrid).loc);
				if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
			}
		}
	}
	// console.log(cell1, cell2, arr, thisGrid);
	return arr;
}

/* $(window).on('beforeunload', e => {
	e.preventDefault();
	e.returnValue = 'Your progress will not be saved.';
	return "Your progress will not be saved.";
}); */

// takes the new grid size and modifies the map
function modifyMap() {
	let rowsInput = $('#rows').value;
	let columnsInput = $('#columns').value;
	if (!(isValidNumber(rowsInput) && isValidNumber(columnsInput))) {
		alert("Incorrect input. Please enter a positive integer.");
		return;
	}
	rows = parseInt(rowsInput);
	columns = parseInt(columnsInput);
	createMap();
	human.loc = getRandomLoc();
	agent1.loc = getRandomLoc();
	agent2.loc = getRandomLoc();
	refreshMap();
}

// sets the speed of the autonomous bot
function setSpeed() {
	let speed = $('speed').value;
	if (!isValidNumber(speed)) {
		alert("Incorrect input. Please enter a positive integer.");
		return;
	}
	waitCount = parseInt(speed);
}

// checks if the parameter is a valid positive integer
function isValidNumber(str) {
	return /^\s*\d+\s*$/.test(str);
}

// gets a random spawn location for the robot
function getRandomLoc(grid) {
	let botIndex;
	do {
		botIndex = Math.floor(Math.random() * grid.length);
	} while(grid[botIndex].isWall);
	return botIndex;
}

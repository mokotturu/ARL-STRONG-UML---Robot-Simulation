const $mapContainer = $('#map-container');
const $map = $('#map');
const $timer = $('#timer');
const $popupModal = $("#popup-modal");
const $minimapImage = $("#minimap");
const $humanImage = $("#human-image");
const $botImage = $("#bot-image");
const $log = $('.tableItems');
const $dropdown = $('#maps');
$.jCanvas.defaults.fromCenter = false;

var rows;
var columns;

const canvasWidth = $map.width();
const canvasHeight = $map.height();
var boxWidth;
var boxHeight;

const HUMAN_COLOR = "#3333ff";
const LIGHT_HUMAN_COLOR = "#9999ff";
const AGENT_COLOR = "#ff3d5d";
const LIGHT_AGENT_COLOR = "#ff9eae";
const TEAM_COLOR = "#ffff7f";
const LIGHT_TEAM_COLOR = "#ffff7f";
const CELL_COLOR = "black";
const EXPLORED_COLOR = "white";
const WALL_COLOR = "black";
const TEMP_COLOR = "#33ff70";
const LIGHT_TEMP_COLOR = "#99ffb7";
const VICTIM_COLOR = "red";
const HAZARD_COLOR = "yellow";

var grid = [];
var agent1Explored = new Set();
var agent2Explored = new Set();
var tempAgent1Explored = new Set();
var tempAgent2Explored = new Set();
var humanExplored = new Set();
var data = { humanData: [], agentData: { agent1: [], agent2: [] }, decisions: [], obstacles: [], uuid: null };
var human, agent1, agent2;
var victim1, victim2, hazard1, hazard2; // come back
var obstacles = [];
var mapPaths = ["src/sample-map.json", "src/data.json", "src/data1.json", "src/data3.json", "src/data4.json", "src/data6.json", "src/data7.json", "src/data8.json", "src/data9.min.json", "src/data10.json", "src/data11.json", "src/data12.json", "src/data13.json", "src/data14.json"];
var pathIndex = 8;
var currentPath = mapPaths[pathIndex];

var viewRadius = 7;
var count = 0;
var waitCount = 15;
var seconds = 0;
var timeout;
var eventListenersAdded = false;
var fullMapDrawn = false;
var pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0;
var log = [];
var startTime;

var victimMarker = new Image();
var hazardMarker = new Image();
victimMarker.src = 'img/victim-marker-big.png';
hazardMarker.src = 'img/hazard-marker-big.png';

$(document).ready(() => {
    startTime = new Date();
    data.uuid = sessionStorage.getItem('uuid');
    
    $('.body-container').css('visibility', 'hidden');
    $('.body-container').css('opacity', '0');
    $('.loader').css('visibility', 'visible');
    $('.loader').css('opacity', '1');

    createMap(currentPath, function loop() {
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

        requestAnimationFrame(loop);

        // set speed
        if (++count < waitCount) {
            return;
        }

        count = 0;

        if (!pause) {
            if (intervalCount > 10) terminate();
            randomWalk(agent1);
            randomWalk(agent2);
        }
    });

    requestAnimationFrame(loop);
});

function eventKeyHandlers(e) {
    switch (e.keyCode) {
        case 65:    // a
        case 37:    // left arrow key
        case 72:    // h
            e.preventDefault();
            if (Math.floor(grid[human.loc].x) != 1 && !grid[human.loc - rows].isWall) {
                human.loc -= rows;
                human.dir = 4;
                refreshMap();
                updateScrollingPosition(grid[human.loc]);
            }
            // console.log("Left", performance.now(), human.loc);
            break;
        case 87:    // w
        case 38:    // up arrow key
        case 75:    // k
            e.preventDefault();
            if (Math.floor(grid[human.loc].y) != 1 && !grid[human.loc - 1].isWall) {
                human.loc--;
                human.dir = 1;
                refreshMap();
                updateScrollingPosition(grid[human.loc]);
            }
            // console.log("Up", performance.now(), human.loc);
            break;
        case 68:    // d
        case 39:    // right arrow key
        case 76:    // l
            e.preventDefault();
            if (Math.floor(grid[human.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[human.loc + rows].isWall) {
                human.loc += rows;
                human.dir = 2;
                refreshMap();
                updateScrollingPosition(grid[human.loc]);
            }
            // console.log("Right", performance.now(), human.loc);
            break;
        case 83:    // s
        case 40:    // down arrow key
        case 74:    // j
            e.preventDefault();
            if (Math.floor(grid[human.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[human.loc + 1].isWall) {
                human.loc++;
                human.dir = 3;
                refreshMap();
                updateScrollingPosition(grid[human.loc]);
            }
            // console.log("Down", performance.now(), human.loc);
            break;
        case 49:    // 1
            e.preventDefault();
            updateScrollingPosition(grid[agent1.loc]);
            // console.log("Shifted focus to agent", performance.now());
            break;
        case 50:    // 2
            e.preventDefault();
            updateScrollingPosition(grid[agent2.loc]);
        default:    // nothing
            break;
    }

    let tracker = { loc: human.loc, timestamp: performance.now() };
    data.humanData.push(tracker);
    console.log(tracker);
}

function terminate() {
    pause = true;
    clearInterval(timeout);
    data.decisions = log;
    data.obstacles = obstacles;
    // console.log(data);
    $.post("/simulation", data, res => console.log(res))
    .fail(() => alert("POST failed"));
    window.location.href = "/survey-1";
}

function showExploredInfo() {
    $humanImage.attr("src", $map.getCanvasImage());
    $botImage.attr("src", $map.getCanvasImage());

    drawMarkers(obstacles);

    $(document).off();
    
    $popupModal.css('display', 'block');
    $popupModal.css('visibility', 'visible');
    $popupModal.css('opacity', '1');
    $minimapImage.attr("src", $map.getCanvasImage());

    if (log[intervalCount - 1] != null) {
        let chosenOption = (log[intervalCount - 1].trusted) ? "Integrated" : "Discarded";
        if (chosenOption == "Integrated") {
            $log.append(`<p style='background-color: #99ffb7;'>${intervalCount} - ${chosenOption}</p>`);
        } else {
            $log.append(`<p style='background-color: #ff9eae;'>${intervalCount} - ${chosenOption}</p>`);
        }
    }

    getSetBoundaries(humanExplored, 0);
    getSetBoundaries(tempAgent1Explored, 1);
    scaleImages();

    pause = true;
    clearInterval(timeout);

    setTimeout(() => { $popupModal.scrollTop(-10000) }, 500);
    setTimeout(() => { $log.scrollLeft(10000) }, 500);
}

// redraw the map and hide pop-up
function hideExploredInfo() {
    $map.clearCanvas();
    humanExplored.forEach((key, item, set) => {
        draw(grid[item]);
    });

    agent1Explored.forEach(function(key, item, set) {
        draw(grid[item]);
    });

    agent2Explored.forEach(function(key, item, set) {
        draw(grid[item]);
    });

    tempAgent1Explored.clear();
    tempAgent2Explored.clear();

    refreshMap();

    $(document).on('keydown', e => {
        eventKeyHandlers(e);
    });

    $popupModal.css('visibility', 'hidden');
    $popupModal.css('display', 'none');
    $popupModal.css('opacity', '0');
    clearInterval(timeout);
    timeout = setInterval(updateTime, 1000);
    pause = false;
}

function confirmExploredArea() {
    tempAgent1Explored.forEach(item => {
        grid[item].isAgentExplored = true;
        agent1Explored.add(item);
    });

    tempAgent2Explored.forEach(item => {
        grid[item].isAgentExplored = true;
        agent2Explored.add(item);
    });

    log.push({interval: intervalCount++, trusted: true});
    hideExploredInfo();
}

function undoExploration() {
    log.push({interval: intervalCount++, trusted: false});
    hideExploredInfo();
}

function updateScrollingPosition(loc) {
    let x = loc.x * boxWidth;
    let y = loc.y * boxHeight;
    $mapContainer[0].scroll(x - $mapContainer.width()/2, y - $mapContainer.height()/2);
}

function updateTime() {
    seconds++;
    if (seconds % 10 == 0) {
        seconds = 0;
        showExploredInfo();
    }
    $timer.text(seconds);
}

// creates an array containing cells with x and y positions and additional details
function createMap(currentPath, cb) {
    grid = [];
    humanExplored.clear();
    tempAgent1Explored.clear();
    agent1Explored.clear();
    agent2Explored.clear();
    log = [];
    $log.empty();

    $.getJSON(currentPath, data => {
        rows = data.dimensions[0].rows;
        columns = data.dimensions[0].columns;
        boxWidth = canvasWidth/rows;
        boxHeight = canvasHeight/columns;
        $.each(data.map, (i, value) => {
            grid.push({x: value.x, y: value.y, isWall: value.isWall == "true", isHumanExplored: false, isAgentExplored: false});
        });
    }).fail(() => {
        alert("An error has occured.");
    }).done(() => {
        human = { id: "human", loc: getRandomLoc(grid), color: HUMAN_COLOR, dir: 1 };
        agent1 = { id: "agent1", loc: getRandomLoc(grid), color: AGENT_COLOR, dir: 1, step: 1, stepsCovered: 0, minSteps: 10, maxSteps: 20 };
        agent2 = { id: "agent2", loc: getRandomLoc(grid), color: AGENT_COLOR, dir: 1, step: 1, stepsCovered: 0, minSteps: 7, maxSteps: 0 };
        victim1 = { id: "victim", loc: getRandomLoc(grid), color: VICTIM_COLOR, isFound: false };
        victim2 = { id: "victim", loc: getRandomLoc(grid), color: VICTIM_COLOR, isFound: false };
        hazard1 = { id: "hazard", loc: getRandomLoc(grid), color: HAZARD_COLOR, isFound: false };
        hazard2 = { id: "hazard", loc: getRandomLoc(grid), color: HAZARD_COLOR, isFound: false };
        obstacles.push(victim1, victim2, hazard1, hazard2);

        spawn([human, agent1, agent2, victim1, victim2, hazard1, hazard2], 1);

        refreshMap();

        console.log("Spawn", performance.now(), human.loc);
        console.log("Spawn", performance.now(), agent1.loc);
        console.log("Spawn", performance.now(), agent2.loc);
        
        let tracker = { loc: human.loc, timestamp: performance.now() };
        data.humanData.push(tracker);
        console.log(tracker);

        tracker = { loc: agent1.loc, timestamp: performance.now() };
        data.agentData.agent1.push(tracker);
        console.log(tracker);

        tracker = { loc: agent2.loc, timestamp: performance.now() };
        data.agentData.agent2.push(tracker);
        console.log(tracker);

        updateScrollingPosition(grid[human.loc]);
        timeout = setInterval(updateTime, 1000);

        cb(grid);
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
    });
}

// draw a square given a cell
function draw(cell) {
    let lightColor = LIGHT_TEMP_COLOR, darkColor = TEMP_COLOR;

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

            $map.drawText({
                fromCenter: true,
                fillStyle: LIGHT_TEMP_COLOR,
                x: grid[member.loc].x*boxWidth + boxWidth/2, y: grid[member.loc].y*boxHeight + boxHeight/2,
                fontSize: boxWidth,
                fontFamily: 'Montserrat, sans-serif',
                text: member.id == 'agent1' ? '1' : '2'
            });
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
    let humanFOVSet = new Set(humanFOV);    // convert array to set

    humanFOVSet.forEach(item => {
        grid[item].isHumanExplored = true;
        humanExplored.add(item);

        draw(grid[item]);

        for (let i = 0; i < obstacles.length; i++) {
            if (item == obstacles[i].loc) {
                obstacles[i].isFound = true;
            }
        }
    });

    // bot surroundings
    let agentFOV = findLineOfSight(agent1);
    let agentFOVSet = new Set(agentFOV);    // convert array to set

    agentFOVSet.forEach(item => {
        tempAgent1Explored.add(item);
        draw(grid[item]);

        for (let i = 0; i < obstacles.length; i++) {
            if (item == obstacles[i].loc) {
                obstacles[i].isFound = true;
            }
        }
    });
    
    agentFOV = findLineOfSight(agent2);
    agentFOVSet = new Set(agentFOV);    // convert array to set

    agentFOVSet.forEach(item => {
        tempAgent2Explored.add(item);
        draw(grid[item]);

        for (let i = 0; i < obstacles.length; i++) {
            if (item == obstacles[i].loc) {
                obstacles[i].isFound = true;
            }
        }
    });

    spawn([human, agent1, agent2, victim1, victim2, hazard1, hazard2], 1);
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

function randomWalk(agent) {
    let minSteps = agent.minSteps;
    let maxSteps = agent.maxSteps;
    let step = agent.step;
    switch (agent.dir) {
        case 1:
            if (agent.stepsCovered > 0 && Math.floor(grid[agent.loc].y) != 1 && !grid[agent.loc - step*columns].isWall) {
                grid[agent.loc].isExplored = true;
                agent.loc -= step*columns;
                agent.stepsCovered--;
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
                agent.stepsCovered--;
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
                agent.stepsCovered--;
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
                agent.stepsCovered--;
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
    
    let tracker = { loc: agent.loc, timestamp: performance.now() };
    if (agent.id == "agent1") data.agentData.agent1.push(tracker);
    else if (agent.id == "agent2") data.agentData.agent2.push(tracker);
    console.log(tracker);
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
    for (let y = centerY; y >= centerY - viewRadius; y--) {
        for (let x = centerX; x <= centerX + viewRadius; x++) {
            thisSurroundings[0].push({x: i, y: j, loc: y + x*rows});
            i++;
        }
        i = 0;
        j++;
    }

    i = 0, j = 0;

    // quadrant 2
    for (let y = centerY; y >= centerY - viewRadius; y--) {
        for (let x = centerX; x >= centerX - viewRadius; x--) {
            thisSurroundings[1].push({x: i, y: j, loc: y + x*rows});
            i++;
        }
        i = 0;
        j++;
    }

    i = 0, j = 0;

    // quadrant 3
    for (let y = centerY; y <= centerY + viewRadius; y++) {
        for (let x = centerX; x >= centerX - viewRadius; x--) {
            thisSurroundings[2].push({x: i, y: j, loc: y + x*rows});
            i++;
        }
        i = 0;
        j++;
    }

    i = 0, j = 0;

    //quadrant 4
    for (let y = centerY; y <= centerY + viewRadius; y++) {
        for (let x = centerX; x <= centerX + viewRadius; x++) {
            thisSurroundings[3].push({x: i, y: j, loc: y + x*rows});
            i++;
        }
        i = 0;
        j++;
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
    for (let i = arr[0].length - viewRadius - 1; i < arr[0].length - 1; i++) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[0][0], arr[0][i], 1, arr[0]));
    }

    // quadrant 2
    for (let i = viewRadius; i < arr[1].length; i += viewRadius + 1) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
    }
    for (let i = arr[1].length - viewRadius - 1; i < arr[1].length - 1; i++) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[1][0], arr[1][i], 2, arr[1]));
    }

    // quadrant 3
    for (let i = viewRadius; i < arr[2].length; i += viewRadius + 1) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
    }
    for (let i = arr[2].length - viewRadius - 1; i < arr[2].length - 1; i++) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[2][0], arr[2][i], 3, arr[2]));
    }

    // quadrant 4
    for (let i = viewRadius; i < arr[3].length; i += viewRadius + 1) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
    }
    for (let i = arr[3].length - viewRadius - 1; i < arr[3].length - 1; i++) {
        mySurroundings = mySurroundings.concat(bresenhams(arr[3][0], arr[3][i], 4, arr[3]));
    }

    return mySurroundings;
}

function getCell(x, y, grid) {
    for (let i = 0; i < grid.length; i++) {
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
                x1++;
                p += 2*dy;
                arr.push(getCell(x1, y1, thisGrid).loc)
                if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
            } else {
                x1++;
                y1++;
                p += 2*(dy - dx);
                arr.push(getCell(x1, y1, thisGrid).loc);
                if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
            }
        }
    } else if (m > 1) {
        p = (2*dx) - dy;
        while (y1 < y2) {
            if (p < 0) {
                y1++;
                p += 2*dx;
                arr.push(getCell(x1, y1, thisGrid).loc);
                if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
            } else {
                x1++;
                y1++;
                p += 2*(dx - dy);
                arr.push(getCell(x1, y1, thisGrid).loc);
                if (grid[getCell(x1, y1, thisGrid).loc].isWall) break;
            }
        }
    }
    // console.log(cell1, cell2, arr, thisGrid);
    return arr;
}

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

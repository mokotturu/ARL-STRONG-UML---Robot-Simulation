const $mapContainer = $('#map-container');
const ctx = $("#ma-container").get(0);
const $map = $('#map');
const $timer = $('#timer');
const $modal = $('#instructions-modal');
const $popupModal = $("#popup-modal");
const $btn = $('#instructions-button');
const $minimapImage = $("#minimap");
const $humanImage = $("#human-image");
const $botImage = $("#bot-image");
const $close = $('.close')[0];
const $log = $('.tableItems');
const $dropdown = $('#maps');
$.jCanvas.defaults.fromCenter = false;

var rows;
var columns;

const canvasWidth = $map.width();
const canvasHeight = $map.height();
var boxWidth;
var boxHeight;

const USER_BOT_COLOR = "#3333ff";
const LIGHT_USER_BOT_COLOR = "#9999ff";
const AUTO_BOT_COLOR = "#ff3d5d";
const LIGHT_AUTO_BOT_COLOR = "#ff9eae";
const TEAM_COLOR = "#ffff7f";
const LIGHT_TEAM_COLOR = "#ffff7f";
const CELL_COLOR = "black";
const EXPLORED_COLOR = "white";
const WALL_COLOR = "black";
const TEMP_COLOR = "#33ff70";
const LIGHT_TEMP_COLOR = "#99ffb7";
const VICTIM_COLOR = "red";
const HAZARD_COLOR = "yellow";

var grid;
var botExplored = new Set();
var tempBotExplored = new Set();
var humanExplored = new Set();
var data;
var userBot, autoBot;
var victim1, victim2, hazard1, hazard2; // come back
var obstacles;
var pathToGoal;
var mapPaths = ["src/sample-map.json", "src/data.json", "src/data1.json", "src/data3.json", "src/data4.json", "src/data6.json", "src/data7.json", "src/data8.json", "src/data9.json", "src/data10.json", "src/data11.json", "src/data12.json", "src/data13.json", "src/data14.json"];
var pathIndex = 8;
var currentPath = mapPaths[pathIndex];

var viewRadius = 7;
var count = 0;
var waitCount = 7;
var step = 0;
var seconds = 0;
var timeout;
var eventListenersAdded = false;
var pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0;
var log = [];
var startTime;

$(document).ready(function() {
    startTime = new Date();

    /* $.post("/", { data: "idk what to put here" }, data => console.log(data))
    .fail(() => alert("post failed")); */
    
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
            $(document).on('keydown', function(e) {
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

        if (!pause && step < pathToGoal.length - 1) {
            autoBot.loc = pathToGoal[step++].loc;
            refreshMap();
            
            let tracker = { loc: autoBot.loc, timestamp: performance.now() };
            data.agentData.push(tracker);
            console.log(tracker);
        }
    });

    requestAnimationFrame(loop);
});

$(window).on("load", function() {
    $.each(mapPaths, function(i, path) {
        $dropdown.append($('<option></option>').val(i).html(path));
    });
    $dropdown.prop('selectedIndex', pathIndex);
});

$("#maps").change(function() {
    currentPath = $("#maps option:selected").text();
    $map.clearCanvas();
    clearInterval(timeout);
    createMap(currentPath);
    toggleModal();
});

function eventKeyHandlers(e) {
    switch (e.keyCode) {
        case 65:    // a
        case 37:    // left arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != 1 && !grid[userBot.loc - rows].isWall) {
                userBot.loc -= rows;
                userBot.dir = 4;
                refreshMap();
                updateScrollingPosition(grid[userBot.loc]);
            }
            // console.log("Left", performance.now(), userBot.loc);
            break;
        case 87:    // w
        case 38:    // up arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != 1 && !grid[userBot.loc - 1].isWall) {
                userBot.loc--;
                userBot.dir = 1;
                refreshMap();
                updateScrollingPosition(grid[userBot.loc]);
            }
            // console.log("Up", performance.now(), userBot.loc);
            break;
        case 68:    // d
        case 39:    // right arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[userBot.loc + rows].isWall) {
                userBot.loc += rows;
                userBot.dir = 2;
                refreshMap();
                updateScrollingPosition(grid[userBot.loc]);
            }
            // console.log("Right", performance.now(), userBot.loc);
            break;
        case 83:    // s
        case 40:    // down arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[userBot.loc + 1].isWall) {
                userBot.loc++;
                userBot.dir = 3;
                refreshMap();
                updateScrollingPosition(grid[userBot.loc]);
            }
            // console.log("Down", performance.now(), userBot.loc);
            break;
        case 67:    // c
            e.preventDefault();
            updateScrollingPosition(grid[autoBot.loc]);
            // console.log("Shifted focus to agent", performance.now());
            break;
        default:    // nothing
            break;
    }

    let tracker = { loc: userBot.loc, timestamp: performance.now() };
    data.humanData.push(tracker);
    console.log(tracker);
}

function toggleModal() {
    if ($modal.css('display') == 'none') $modal.css('display', 'block');
    else $modal.css('display', 'none');
}

function closeModal() {
    $modal.css('display', 'none');
}

function terminate() {
    pause = true;
    clearInterval(timeout);
    data.decisions = log;
    data.obstacles = obstacles;
    // console.log(data);
    $.post("/simulation", data, res => console.log(res))
    .fail(() => alert("POST failed"));
    window.location.href = "/stats";
}

function showExploredInfo() {
    spawn(obstacles, 10);

    $(document).off();
    
    $popupModal.css('display', 'block');
    $popupModal.css('visibility', 'visible');
    $popupModal.css('opacity', '1');
    $minimapImage.attr("src", $map.getCanvasImage());
    $humanImage.attr("src", $map.getCanvasImage());
    $botImage.attr("src", $map.getCanvasImage());

    if (log[intervalCount - 1] != null) {
        let chosenOption = (log[intervalCount - 1].trusted) ? "Integrated" : "Discarded";
        if (chosenOption == "Integrated") {
            $log.append(`<p style='background-color: #99ffb7;'>${intervalCount} - ${chosenOption}</p>`);
        } else {
            $log.append(`<p style='background-color: #ff9eae;'>${intervalCount} - ${chosenOption}</p>`);
        }
    }

    getSetBoundaries(humanExplored, 0);
    getSetBoundaries(tempBotExplored, 1);
    scaleImages();

    pause = true;
    clearInterval(timeout);

    setTimeout(() => { $popupModal.scrollTop(-10000) }, 500);
    setTimeout(() => { $log.scrollLeft(10000) }, 500);
}

// redraw the map and hide pop-up
function hideExploredInfo() {
    $map.clearCanvas();
    humanExplored.forEach(function(key, item, set) {
        draw(grid[item]);
    });

    botExplored.forEach(function(key, item, set) {
        draw(grid[item]);
    });

    tempBotExplored.clear();

    refreshMap();

    $(document).on('keydown', function(e) {
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
    tempBotExplored.forEach(item => {
        grid[item].isBotExplored = true;
        botExplored.add(item);
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
    data = {humanData: [], agentData: [], decisions: [], obstacles: []};
    humanExplored.clear();
    tempBotExplored.clear();
    botExplored.clear();
    log = [];
    $log.empty();
    step = 0;
    pathToGoal = [];
    obstacles = [];


    $.getJSON(currentPath, data => {
        rows = data.dimensions[0].rows;
        columns = data.dimensions[0].columns;
        boxWidth = canvasWidth/rows;
        boxHeight = canvasHeight/columns;
        $.each(data.map, (i, value) => {
            grid.push({x: value.x, y: value.y, loc: i, f: 0, g: 0, h: 0, isWall: value.isWall == "true", parent: null, isHumanExplored: false, isBotExplored: false});
        });
    }).fail(() => {
        alert("An error has occured.");
    }).done(() => {
        let userBotLoc = getRandomLoc(grid);
        let autoBotLoc = getRandomLoc(grid);
        let humanNeighbors = findNeighbours(grid, grid[userBotLoc]);
        for (let i = 0; i < humanNeighbors.length; i++) {
            if (!humanNeighbors[i].isWall) autoBotLoc = humanNeighbors[i].loc;
        }
        userBot = {id: "human", loc: userBotLoc, color: USER_BOT_COLOR, dir: 1};
        autoBot = {id: "agent", loc: autoBotLoc, color: AUTO_BOT_COLOR, dir: 1};
        victim1 = {id: "victim", loc: getRandomLoc(grid), color: VICTIM_COLOR, isFound: false};
        victim2 = {id: "victim", loc: getRandomLoc(grid), color: VICTIM_COLOR, isFound: false};
        hazard1 = {id: "hazard", loc: getRandomLoc(grid), color: HAZARD_COLOR, isFound: false};
        hazard2 = {id: "hazard", loc: getRandomLoc(grid), color: HAZARD_COLOR, isFound: false};
        obstacles.push(victim1, /* victim2, */ hazard1, hazard2);

        spawn([userBot, autoBot, victim1, victim2, hazard1, hazard2], 1);

        console.log("Spawn", performance.now(), userBot.loc);
        console.log("Spawn", performance.now(), autoBot.loc);
        
        let tracker = { loc: userBot.loc, timestamp: performance.now() };
        data.humanData.push(tracker);
        console.log(tracker);

        tracker = { loc: autoBot.loc, timestamp: performance.now() };
        data.agentData.push(tracker);
        console.log(tracker);

        updateScrollingPosition(grid[userBot.loc]);
        timeout = setInterval(updateTime, 1000);

        pathToGoal = search(grid, autoBot, victim1);

        cb(grid);
    });
}

// draw a square given a cell
function draw(cell) {
    let lightColor = LIGHT_TEMP_COLOR, darkColor = TEMP_COLOR;

    if (cell.isHumanExplored && !cell.isBotExplored) {
        lightColor = LIGHT_USER_BOT_COLOR;
        darkColor = USER_BOT_COLOR;
    } else if (cell.isBotExplored && !cell.isHumanExplored) {
        lightColor = LIGHT_AUTO_BOT_COLOR;
        darkColor = AUTO_BOT_COLOR;
    } else if (cell.isHumanExplored && cell.isBotExplored) {
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
    let bot;
    for (let i = 0; i < members.length; i++) {
        bot = members[i]
        if (bot.id == "human" || bot.id == "agent") {
            $map.drawRect({
                fillStyle: bot.color,
                x: grid[bot.loc].x*boxWidth, y: grid[bot.loc].y*boxHeight,
                width: (boxWidth - 1)*size, height: (boxHeight - 1)*size
            });
        } else if (bot.id == "victim" && bot.isFound) {
            $map.drawEllipse({
                fromCenter: true,
                fillStyle: bot.color,
                x: grid[bot.loc].x*boxWidth + boxWidth/2, y: grid[bot.loc].y*boxHeight + boxHeight/2,
                width: (boxWidth - 1)*size, height: (boxHeight - 1)*size
            });
        } else if (bot.id == "hazard" && bot.isFound) {
            $map.drawPolygon({
                fromCenter: true,
                fillStyle: bot.color,
                x: grid[bot.loc].x*boxWidth + boxWidth/2, y: grid[bot.loc].y*boxHeight + boxHeight/2,
                radius: ((boxWidth - 1)/2)*size,
                sides: 3
            });
        }
    }
}

// redraws the map and spawns the bots in their new location
function refreshMap() {
    // human surroundings
    let humanFOV = findLineOfSight(userBot);
    let humanFOVSet = new Set(humanFOV);    // convert array to set
    // console.log(humanFOV.length, humanFOVSet.size)

    humanFOVSet.forEach(item => {
        grid[item].isHumanExplored = true;
        humanExplored.add(item);

        draw(grid[item]);

        for (let j = 0; j < obstacles.length; j++) {
            if (item == obstacles[j].loc) {
                obstacles[j].isFound = true;
            }
        }
    });

    // bot surroundings
    let botFOV = findLineOfSight(autoBot);
    let botFOVSet = new Set(botFOV);    // convert array to set

    botFOVSet.forEach(item => {
        tempBotExplored.add(item);
        draw(grid[item]);

        for (let j = 0; j < obstacles.length; j++) {
            if (item == obstacles[j].loc) {
                obstacles[j].isFound = true;
            }
        }
    });

    for (let i = 0; i < pathToGoal.length; i++) {
        let cell = pathToGoal[i];
        $map.drawRect({
            fillStyle: 'yellow',
            x: cell.x*boxWidth, y: cell.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
        });
    }

    spawn([userBot, autoBot, victim1, victim2, hazard1, hazard2], 1);
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

function search(grid, start, goal) {
    let openList = [];
    let closedList = [];
    openList.push(start);

    while (openList.length > 0) {
        // get lowest F
        let lowestF = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].f < openList[lowestF].f) lowestF = i;
        }
        let currentNode = openList[lowestF];

        // end case - return successful path
        if (currentNode.loc == goal.loc) {
            let current = currentNode;
            let ret = [];
            while (current.parent) {
                ret.push(current);
                current = current.parent;
            }
            return ret.reverse();
        }

        // normal case - move currentNode from open to closed, process each of its neighbours
        openList.splice(openList.indexOf(currentNode), 1);
        closedList.push(currentNode);
        let neighbours = findNeighbours(grid, currentNode);

        for (let i = 0; i < neighbours.length; i++) {
            let neighbour = neighbours[i];
            if (closedList.indexOf(neighbour) != -1 || neighbour.isWall) {
                continue;
            }

            // g score is the shortest distance from start to current node
            // we need to check id the path we have arrived at this neighbour is the shortest one we have seen yet
            let gScore = currentNode.g + 1;
            let gScoreIsBest = false;

            if (openList.indexOf(neighbour) == -1) {
                // This is the first time we have arrived at this node, so it must be the best
                // Also, we need to take the h (heuristic) score since we haven't done so yet
                gScoreIsBest = true;
                neighbour.h = heuristic(neighbour, goal);
                openList.push(neighbour);
            } else if (gScore < neighbour.g) {
                // We have alread seen the node, but the last time it had a worse g score (distance from start)
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                // Found an optimal path (so far) to this node. Store info on how we got here
                neighbour.parent = currentNode;
                neighbour.g = gScore;
                neighbour.f  = neighbour.g + neighbour.h;
            }
        }
    }

    // No result was found
    return [];
}

// top, bottom, left, right
function findNeighbours(grid, node) {
    let ret = [];
    let loc = node.loc;

    if (!(loc - rows < 0)) {
        ret.push(grid[loc - rows]);
    }
    if (!(loc - 1 < 0)) {
        ret.push(grid[loc - 1]);
    }
    if (!(loc + rows > grid.length - 1)) {
        ret.push(grid[loc + rows]);
    }
    if (!(loc + 1 > grid.length - 1)) {
        ret.push(grid[loc + 1]);
    }

    return ret;
}

function heuristic(start, dest) {
    // Manhattan distance
    let pos0 = grid[start.loc];
    let pos1 = grid[dest.loc]
    let d1 = Math.abs(pos1.x - pos0.x);
    let d2 = Math.abs(pos1.y - pos0.y);
    return d1 + d2;
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
    userBot.loc = getRandomLoc();
    autoBot.loc = getRandomLoc();
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

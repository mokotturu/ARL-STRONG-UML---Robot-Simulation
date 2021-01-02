var canvas = document.getElementById("map");
var context = canvas.getContext("2d");

context.canvas.width = window.innerWidth/3;
context.canvas.height = window.innerWidth/3;

var rows = 30;
var columns = 30;

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var boxWidth;
var boxHeight;

const CELL_COLOR = "black";
const USER_BOT_COLOR = "blue";
const AUTO_BOT_COLOR = "red";
const EXPLORED_COLOR = "white";

var map = [];
var bots = [];

var count = 0;
var waitCount = 4;

createMap();
drawMap();

var userBot = {loc: getRandomLoc(), color: USER_BOT_COLOR, dir: 1};
var autoBot = {loc: getRandomLoc(), color: AUTO_BOT_COLOR, dir: 1};
bots.push(userBot, autoBot);

spawnBot(userBot);
spawnBot(autoBot);

// auto bot movement
function loop() {
  requestAnimationFrame(loop);

  // set speed
  if (++count < waitCount) {
    return;
  }

  count = 0;

  switch (autoBot.dir) {
    case 1:
      if (Math.floor(map[autoBot.loc].y) != 1 && !map[autoBot.loc - columns].isWall && !map[autoBot.loc - columns].isOccupied) {
        map[autoBot.loc].isOccupied = !map[autoBot.loc].isOccupied;
        map[autoBot.loc].isExplored = true;
        autoBot.loc -= columns;
        refreshMap();
      } else {
        autoBot.dir = Math.random() < Math.random() ? 4 : 2;
      }
      break;
    case 2:
      if (Math.floor(map[autoBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !map[autoBot.loc + 1].isWall && !map[autoBot.loc + 1].isOccupied) {
        map[autoBot.loc].isOccupied = !map[autoBot.loc].isOccupied;
        map[autoBot.loc].isExplored = true;
        autoBot.loc++;
        refreshMap();
      } else {
        autoBot.dir = Math.random() < Math.random() ? 1 : 3;
      }
      break;
    case 3:
      if (Math.floor(map[autoBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !map[autoBot.loc + columns].isWall && !map[autoBot.loc + columns].isOccupied) {
        map[autoBot.loc].isOccupied = !map[autoBot.loc].isOccupied;
        map[autoBot.loc].isExplored = true;
        autoBot.loc += columns;
        refreshMap();
      } else {
        autoBot.dir = Math.random() < Math.random() ? 2 : 4;
      }
      break;
    case 4:
      if (Math.floor(map[autoBot.loc].x) != 1 && !map[autoBot.loc - 1].isWall && !map[autoBot.loc - 1].isOccupied) {
        map[autoBot.loc].isOccupied = !map[autoBot.loc].isOccupied;
        map[autoBot.loc].isExplored = true;
        autoBot.loc--;
        refreshMap();
      } else {
        autoBot.dir = Math.random() < Math.random() ? 3 : 1;
      }
      break;
    default:
      // nothing
      break;
  }
}

// creates an array containing cells with x and y positions and additional details
function createMap() {
  map = [];
  boxWidth = canvasWidth/columns - 2;
  boxHeight = canvasHeight/rows - 2;
  for (let y = 1; y < canvasHeight; y += boxHeight + 2) {
    for (let x = 1; x < canvasWidth; x += boxWidth + 2) {
      map.push({x: x, y: y, isWall: Math.random() < 0.1, isOccupied: false, isExplored: false});  // 10% chance that a cell will be a wall during initialization
    }
  }
  console.log(map);
}

// renders the map on the screen
function drawMap() {
  map.forEach(item => {
    if (item.isExplored && !item.isWall) {
      context.fillStyle = EXPLORED_COLOR;
      context.fillRect(item.x, item.y, boxWidth, boxHeight);
    } else if (!item.isExplored && !item.isWall) {
      context.fillStyle = CELL_COLOR;
      context.fillRect(item.x, item.y, boxWidth, boxHeight);
    }
  });
}

// spawns the bot in its location
function spawnBot(bot) {
  console.log(bot);
  context.fillStyle = bot.color;
  context.fillRect(map[bot.loc].x, map[bot.loc].y, boxWidth, boxHeight);
  map[bot.loc].isOccupied = true;
}

// redraws the map and spawns the bots in their new location
function refreshMap() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  drawMap();
  spawnBot(userBot);
  spawnBot(autoBot);
}

// takes the new grid size and modifies the map
function modifyMap() {
  let rowsInput = document.getElementById("rows").value;
  let columnsInput = document.getElementById("columns").value
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
  let speed = document.getElementById("speed").value;
  if (!isValidNumber(speed)) {
    alert("Incorrect input. Please enter a positive integer.");
    return;
  }
  waitCount = parseInt(speed);
}

// creates/removes wall on the clicked cell
function createWall(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;

  let walledCellX = (x - (x % (canvasWidth/columns)));
  let walledCellY = (y - (y % (canvasHeight/rows)));

  let i = 0;
  i = Math.round((walledCellX/(canvasWidth/columns)) + columns*(walledCellY/(canvasHeight/rows)));
  console.log(walledCellX, walledCellY, i);

  if (!map[i].isOccupied) {
    map[i].isWall = !map[i].isWall;
    refreshMap();
  }
}

// checks if the parameter is a valid positive integer
function isValidNumber(str) {
  return /^\s*\d+\s*$/.test(str);
}

// gets a raondom spawn location for the robot
function getRandomLoc() {
  let botIndex;
  do {
    botIndex = Math.floor(Math.random() * map.length);
  } while(map[botIndex].isWall && map[botIndex].isOccupied);
  return botIndex;
}

// document arrow keys event listener
document.addEventListener('keydown', function(e) {
  if (e.keyCode === 37) {
    e.preventDefault();
    if (Math.floor(map[userBot.loc].x) != 1 && !map[userBot.loc - 1].isWall && !map[userBot.loc - 1].isOccupied) {
      map[userBot.loc].isOccupied = !map[userBot.loc].isOccupied;
      userBot.loc--;
      userBot.dir = 4;
      refreshMap();
    }
  } else if (e.keyCode === 38) {
    e.preventDefault();
    if (Math.floor(map[userBot.loc].y) != 1 && !map[userBot.loc - columns].isWall && !map[userBot.loc - columns].isOccupied) {
      map[userBot.loc].isOccupied = !map[userBot.loc].isOccupied;
      userBot.loc -= columns;
      userBot.dir = 1;
      refreshMap();
    }
  } else if (e.keyCode === 39) {
    e.preventDefault();
    if (Math.floor(map[userBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !map[userBot.loc + 1].isWall && !map[userBot.loc + 1].isOccupied) {
      map[userBot.loc].isOccupied = !map[userBot.loc].isOccupied;
      userBot.loc++;
      userBot.dir = 2;
      refreshMap();
    }
  } else if (e.keyCode === 40) {
    e.preventDefault();
    if (Math.floor(map[userBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !map[userBot.loc + columns].isWall && !map[userBot.loc + columns].isOccupied) {
      map[userBot.loc].isOccupied = !map[userBot.loc].isOccupied;
      userBot.loc += columns;
      userBot.dir = 3;
      refreshMap();
    }
  }
});

// canvas onclick event listener
canvas.addEventListener("click", function(e) {
  createWall(canvas, e);
});

requestAnimationFrame(loop);

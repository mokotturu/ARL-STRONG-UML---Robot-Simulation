var canvas = document.getElementById("map");
var context = canvas.getContext("2d");

var rows = 30;
var columns = 30;

let canvasWidth = canvas.width;
let canvasHeight = canvas.height;
let boxWidth;
let boxHeight;

var cellColor = "black";
var botColor = "blue";

var map = [];

createMap();
drawMap();
var bot = map[Math.floor(Math.random() * map.length)];
spawnBot(bot.x, bot.y);

// creates an array containing cells with x and y positions and wall details
function createMap() {
  map = [];
  boxWidth = canvasWidth/columns - 2;
  boxHeight = canvasHeight/rows - 2;
  for (let y = 1; y < canvasHeight; y += boxHeight + 2) {
    for (let x = 1; x < canvasWidth; x += boxWidth + 2) {
      map.push({x: x, y: y, isWall: Math.random() < 0.1});  // 10% chance that a cell will be a wall
    }
  }
  console.log(map);
}

// renders the map on the screen
function drawMap() {
  context.fillStyle = cellColor;
  map.forEach(item => {
    if (!item.isWall) context.fillRect(item.x, item.y, boxWidth, boxHeight);
  });
}

// spawns the bot in the specified location
function spawnBot(x, y) {
  console.log(bot);
  context.fillStyle = botColor;
  context.fillRect(x, y, boxWidth, boxHeight);
}

// redraws the map and spawns the bot in its new location
function refreshMap() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  drawMap();
  spawnBot(bot.x, bot.y);
}

// takes the new grid size and modifies the map
function modifyMap() {
  let rowsInput = document.getElementById("rows").value;
  let columnsInput = document.getElementById("columns").value
  if (!(isValidNumber(rowsInput) && isValidNumber(columnsInput))) {
    alert("Incorrect input. Please enter a positive integer.");
    return;
  }
  rows = parseInt(document.getElementById("rows").value);
  columns = parseInt(document.getElementById("columns").value);
  createMap();
  bot = map[Math.floor(Math.random() * map.length)];
  refreshMap();
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

  map[i].isWall = !map[i].isWall;
  refreshMap();
}

// checks if the parameter is a valid positive integer
function isValidNumber(str) {
  return /^\s*\d+\s*$/.test(str);
}

// event listener - arrow keys
document.addEventListener('keydown', function(e) {
  if (e.which === 37) {
    e.preventDefault();
    if (Math.floor(bot.x) != 1 && !map[map.indexOf(bot) - 1].isWall) {
      bot = map[map.indexOf(bot) - 1];
      refreshMap();
    }
  } else if (e.which === 38) {
    e.preventDefault();
    if (Math.floor(bot.y) != 1 && !map[map.indexOf(bot) - columns].isWall) {
      bot = map[map.indexOf(bot) - columns];
      refreshMap();
    }
  } else if (e.which === 39) {
    e.preventDefault();
    if (Math.floor(bot.x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !map[map.indexOf(bot) + 1].isWall) {
      bot = map[map.indexOf(bot) + 1];
      refreshMap();
    }
  } else if (e.which === 40) {
    e.preventDefault();
    if (Math.floor(bot.y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !map[map.indexOf(bot) + columns].isWall) {
      bot = map[map.indexOf(bot) + columns];
      refreshMap();
    }
  }
});

// event listener - onclick
canvas.addEventListener("click", function(e) {
  createWall(canvas, e);
});

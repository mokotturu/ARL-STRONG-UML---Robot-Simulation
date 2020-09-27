var canvas = document.getElementById("map");
var context = canvas.getContext("2d");

var columns = 50;
var rows = 50;

let canvasWidth = canvas.width;
let canvasHeight = canvas.height;
let boxWidth = canvasWidth/columns - 2;
let boxHeight = canvasHeight/rows - 2;

var cellColor = "black";
var botColor = "blue";

var map = [];

createMap();
drawMap();
var bot = map[Math.floor(Math.random() * map.length)];
spawnBot(bot.x, bot.y);

function createMap() {
  for (let y = 1; y < canvasHeight; y += boxHeight + 2) {
    for (let x = 1; x < canvasWidth; x += boxWidth + 2) {
      map.push({x: x, y: y, isWall: Math.random() < 0.1});  // 10% chance that a cell will be a wall
    }
  }
  console.log(map);
}

function drawMap() {
  context.fillStyle = cellColor;
  map.forEach(item => {
    if (!item.isWall) context.fillRect(item.x, item.y, boxWidth, boxHeight);
  });

}

function spawnBot(x, y) {
  console.log(bot);
  context.fillStyle = botColor;
  context.fillRect(x, y, boxWidth, boxHeight);
}

function refreshMap() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  drawMap();
  spawnBot(bot.x, bot.y);
}

function createWall(canvas, e) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;

  let walledCellX = (x - (x % (canvasWidth/columns)) + 1);
  let walledCellY = (y - (y % (canvasHeight/rows)) + 1);

  let i = 0;
  while ((map[i].x != walledCellX) || (map[i].y != walledCellY)) i++;

  map[i].isWall = true;

  refreshMap();
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode');
}

document.addEventListener('keydown', function(e) {
  if (e.which === 37) {
    e.preventDefault();
    if (bot.x != 1 && !map[map.indexOf(bot) - 1].isWall) {
      bot = map[map.indexOf(bot) - 1];
      refreshMap();
    }
  } else if (e.which === 38) {
    e.preventDefault();
    if (bot.y != 1 && !map[map.indexOf(bot) - columns].isWall) {
      bot = map[map.indexOf(bot) - columns];
      refreshMap();
    }
  } else if (e.which === 39) {
    e.preventDefault();
    if (bot.x != (1 + (columns - 1) * (canvasWidth / columns)) && !map[map.indexOf(bot) + 1].isWall) {
      bot = map[map.indexOf(bot) + 1];
      refreshMap();
    }
  } else if (e.which === 40) {
    e.preventDefault();
    if (bot.y != (1 + (rows - 1) * (canvasHeight / rows)) && !map[map.indexOf(bot) + columns].isWall) {
      bot = map[map.indexOf(bot) + columns];
      refreshMap();
    }
  }
});

canvas.addEventListener("click", function(e) {
  createWall(canvas, e);
});

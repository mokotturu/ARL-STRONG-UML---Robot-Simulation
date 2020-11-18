var $mapContainer = $('#map-container');
var $map = $('#map');
var $timer = $('#timer');
var $modal = $('#instructions-modal');
var $btn = $('#instructions-button');
var $close = $('.close')[0];
$.jCanvas.defaults.fromCenter = false;

var rows;
var columns;

var canvasWidth = $map.width();
var canvasHeight = $map.height();
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
const TEMP_COLOR = "#7f33ff";
const LIGHT_TEMP_COLOR = "#bf99ff";

var grid = [];
var surroundings = [];
var botExplored = [];
var userBot, autoBot;
var mapPaths = ["src/sample-map.json", "src/data.json", "src/data1.json", "src/data3.json", "src/data4.json", "src/data6.json", "src/data7.json", "src/data8.json", "src/data9.json", "src/data10.json", "src/data11.json", "src/data12.json", "src/data13.json", "src/data14.json"];
var currentPath = mapPaths[8];

var count = 0;
var waitCount = 5;
var steps = 0;
var totalSteps = 7;
var seconds = 0;
var eventListenersAdded = false;
var fullMapDrawn = false;

$(document).ready(function() {
  createMap(currentPath, function loop() {
    if (!eventListenersAdded) {
      // document arrow keys event listener
      $(document).on('keydown', function(e) {
        switch (e.keyCode) {
          case 37:  // left arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != 1 && !grid[userBot.loc - rows].isWall) {
              userBot.loc -= rows;
              userBot.dir = 4;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 38:  // up arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != 1 && !grid[userBot.loc - 1].isWall) {
              userBot.loc--;
              userBot.dir = 1;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 39:  // right arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[userBot.loc + rows].isWall) {
              userBot.loc += rows;
              userBot.dir = 2;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 40:  // down arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[userBot.loc + 1].isWall) {
              userBot.loc++;
              userBot.dir = 3;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 83:
            e.preventDefault();
            updateScrollingPosition(grid[autoBot.loc]);
            break;
          default:  // nothing
            break;
        }
      });
      eventListenersAdded = true;
    }

    requestAnimationFrame(loop);

    // set speed
    if (++count < waitCount) {
      return;
    }

    count = 0;

    switch (autoBot.dir) {
      case 1:
        if (steps > 0 && Math.floor(grid[autoBot.loc].y) != 1 && !grid[autoBot.loc - columns].isWall) {
          grid[autoBot.loc].isExplored = true;
          autoBot.loc -= columns;
          steps--;
          refreshMap();
        } else {
          if (steps == 0) steps = Math.floor(Math.random() * totalSteps);
          autoBot.dir = Math.random() < Math.random() ? 4 : 2;
        }
        break;
      case 2:
        if (steps > 0 && Math.floor(grid[autoBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[autoBot.loc + 1].isWall) {
          grid[autoBot.loc].isExplored = true;
          autoBot.loc++;
          steps--;
          refreshMap();
        } else {
          if (steps == 0) steps = Math.floor(Math.random() * totalSteps);
          autoBot.dir = Math.random() < Math.random() ? 1 : 3;
        }
        break;
      case 3:
        if (steps > 0 && Math.floor(grid[autoBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[autoBot.loc + columns].isWall) {
          grid[autoBot.loc].isExplored = true;
          autoBot.loc += columns;
          steps--;
          refreshMap();
        } else {
          if (steps == 0) steps = Math.floor(Math.random() * totalSteps);
          autoBot.dir = Math.random() < Math.random() ? 2 : 4;
        }
        break;
      case 4:
        if (steps > 0 && Math.floor(grid[autoBot.loc].x) != 1 && !grid[autoBot.loc - 1].isWall) {
          grid[autoBot.loc].isExplored = true;
          autoBot.loc--;
          steps--;
          refreshMap();
        } else {
          if (steps == 0) steps = Math.floor(Math.random() * totalSteps);
          autoBot.dir = Math.random() < Math.random() ? 3 : 1;
        }
        break;
      default:
        // nothing
        break;
    }
    // console.log(steps);
  });
  requestAnimationFrame(loop);
  // });
});

$(window).on("load", function() {
  var dropdown = $('#maps');
  $.each(mapPaths, function(i, path) {
    dropdown.append($('<option></option>').val(i).html(path));
  });
});

$("#maps").change(function() {
  currentPath = $("#maps option:selected").text();
  $map.clearCanvas();
  createMap(currentPath);
});

function toggleModal() {
  if ($modal.css('display') == 'none') $modal.css('display', 'block');
  else $modal.css('display', 'none');
}

function closeModal() {
  $modal.css('display', 'none');
}

function updateScrollingPosition(loc) {
  let x = loc.x * boxWidth;
  let y = loc.y * boxHeight;
  $mapContainer.scrollLeft(x - $mapContainer.width()/2);
  $mapContainer.scrollTop(y - $mapContainer.height()/2);
}

function updateTime() {
  seconds++;
  if (seconds % 10 == 0) {
    seconds = 0;
    showExplored();
    /* if (confirm("Do you trust the agent explored region?")) */ drawExplored();
    botExplored = [];
  }
  $timer.text(seconds);
}

// creates an array containing cells with x and y positions and additional details
function createMap(currentPath, cb) {
  grid = [];

  $.getJSON(currentPath, function(data) {
    rows = data.dimensions[0].rows;
    columns = data.dimensions[0].columns;
    boxWidth = canvasWidth/rows;
    boxHeight = canvasHeight/columns;
    $.each(data.map, function(i, value) {
      grid.push({x: value.x, y: value.y, isWall: value.isWall == "true", isHumanExplored: false, isBotExplored: false, isExplored: value.isExplored == "true", isInSight: false});
    });
  }).fail(function() {
    alert("An error has occured.");
  }).done(function() {
    userBot = {id: "human", loc: getRandomLoc(grid), color: USER_BOT_COLOR, dir: 1};
    autoBot = {id: "agent", loc: getRandomLoc(grid), color: AUTO_BOT_COLOR, dir: 1};

    findLineOfSight(userBot);
    drawMap(grid);

    spawnBot(userBot);
    spawnBot(autoBot);

    updateScrollingPosition(grid[userBot.loc]);
    setInterval(updateTime, 1000);

    cb(grid);
  });
}

// renders the map on the screen
function drawMap(grid1) {
  /* if (!fullMapDrawn) {
    let item = grid[0];
    for (let i = 0; i < grid.length; i++) {
      item = grid[i];
      if (!item.isWall) {
        if (item.isInSight) {
          $map.drawRect({
            fillStyle: 'grey',
            x: item.x*boxWidth, y: item.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
          });
        }/*  else if (item.isExplored) {
          $map.drawRect({
            fillStyle: 'yellow',
            x: item.x*boxWidth, y: item.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
          });
        }  else {
          $map.drawRect({
            fillStyle: CELL_COLOR,
            x: item.x*boxWidth, y: item.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
          });
        }
      }
    }
    fullMapDrawn = true;
  } */
  
  let cell;
  for (let i = 0; i < surroundings.length; i++) {
    cell = grid[surroundings[i]];
    if (cell.isHumanExplored && !cell.isBotExplored) {
      if (cell.isInSight && cell.isWall) {
        $map.drawRect({
          fillStyle: WALL_COLOR,
          strokeStyle: USER_BOT_COLOR,
          strokeWidth: 1,
          cornerRadius: 2,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      } else if (cell.isInSight && !cell.isWall) {
        $map.drawRect({
          fillStyle: LIGHT_USER_BOT_COLOR,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      }
    } else if (cell.isBotExplored && cell.isHumanExplored) {
      if (cell.isInSight && cell.isWall) {
        $map.drawRect({
          fillStyle: WALL_COLOR,
          strokeStyle: TEAM_COLOR,
          strokeWidth: 1,
          cornerRadius: 2,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      } else if (cell.isInSight && !cell.isWall) {
        $map.drawRect({
          fillStyle: LIGHT_TEAM_COLOR,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      }
    }
  }
}

function drawExplored() {
  let cell;
  for (let i = 0; i < botExplored.length; i++) {
    cell = grid[botExplored[i]];
    if (cell.isBotExplored && !cell.isHumanExplored) {
      if (cell.isInSight && cell.isWall) {
        $map.drawRect({
          fillStyle: WALL_COLOR,
          strokeStyle: AUTO_BOT_COLOR,
          strokeWidth: 1,
          cornerRadius: 2,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      } else if (cell.isInSight && !cell.isWall) {
        $map.drawRect({
          fillStyle: LIGHT_AUTO_BOT_COLOR,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      }
    } else if (cell.isBotExplored && cell.isHumanExplored) {
      if (cell.isInSight && cell.isWall) {
        $map.drawRect({
          fillStyle: WALL_COLOR,
          strokeStyle: TEAM_COLOR,
          strokeWidth: 1,
          cornerRadius: 2,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      } else if (cell.isInSight && !cell.isWall) {
        $map.drawRect({
          fillStyle: LIGHT_TEAM_COLOR,
          x: cell.x*boxWidth, y: cell.y*boxHeight,
          width: boxWidth - 1, height: boxHeight - 1
        });
      }
    }
  }
  // console.log(botExplored);
}

function showExplored() {
  let tempBotExplored = botExplored;
  
}

// spawns the bot in its location
function spawnBot(bot) {
  if (true/* grid[bot.loc].isInSight */) {
    $map.drawRect({
      fillStyle: bot.color,
      x: grid[bot.loc].x*boxWidth, y: grid[bot.loc].y*boxHeight,
      width: boxWidth - 1, height: boxHeight - 1
    });
  }
}

// redraws the map and spawns the bots in their new location
function refreshMap() {
  surroundings = findLineOfSight(userBot);
  refreshBotExplored();
  drawMap(grid);
  spawnBot(userBot);
  spawnBot(autoBot);
}

function refreshBotExplored() {
  let botSurroundings = findLineOfSight(autoBot);
  for (let i = 0; i < botSurroundings.length; i++) {
    if (!botExplored.includes(botSurroundings[i])) {
      botExplored.push(botSurroundings[i]);
    }
  }
}

// find line of sight
function findLineOfSight(bot) {
  /* for (let i = 0; i < surroundings.length; i++) {
    grid[surroundings[i]].isInSight = false;
  } */
  let surroundings = [];
  for (let x = grid[bot.loc].x - 2; x <= grid[bot.loc].x + 2; x++) {
    for (let y = grid[bot.loc].y - 2; y <= grid[bot.loc].y + 2; y++) {
      surroundings.push(y + x*(rows));
      grid[y + x*(rows)].isInSight = true;
    }
  }
  // console.log("surroudings", surroundings);

  surroundings = getVisibleArea(surroundings);

  for (let i = 0; i < surroundings.length; i++) {
    if (bot.id == "human") grid[surroundings[i]].isHumanExplored = true;
    else if (bot.id == "agent") grid[surroundings[i]].isBotExplored = true;
  }
  return surroundings;
}

function getVisibleArea(surroundings) {
  let item;
  let middle = grid[surroundings[Math.floor(surroundings.length/2)]];
  for (let i = 0; i < surroundings.length; i++) {
    item = surroundings[i];
    if (i != middle && !grid[item].isWall) {
      if (grid[item].x < middle.x && grid[item].y < middle.y) { // top left
        if (grid[item + rows + 1] != middle && (grid[item + 1].isWall || grid[item + rows].isWall || grid[item + rows + 1].isWall)) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y < middle.y) {  // top right
        if (grid[item - rows + 1] != middle && (grid[item + 1].isWall || grid[item - rows].isWall || grid[item - rows + 1].isWall)) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x < middle.x && grid[item].y > middle.y) {  // bottom left
        if (grid[item + rows - 1] != middle && (grid[item - 1].isWall || grid[item + rows - 1].isWall || grid[item + rows].isWall)) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y > middle.y) {  // bottom right
        if (grid[item - rows - 1] != middle && (grid[item - 1].isWall || grid[item - rows].isWall || grid[item - rows - 1].isWall)) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x < middle.x) { // left
        if (grid[item + rows].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x > middle.x) { // right
        if (grid[item - rows].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y < middle.y) { // top
        if (grid[item + 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y > middle.y) { // bottom
        if (grid[item - 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      }
    } else {
      if (grid[item].x < middle.x && grid[item].y < middle.y) { // top left
        if ((grid[item + 1].isWall || grid[item + rows].isWall) && grid[item + rows + 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y < middle.y) {  // top right
        if ((grid[item + 1].isWall || grid[item - rows].isWall) && grid[item - rows + 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x < middle.x && grid[item].y > middle.y) {  // bottom left
        if ((grid[item - 1].isWall || grid[item + rows].isWall) && grid[item + rows - 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y > middle.y) {  // bottom right
        if ((grid[item - 1].isWall || grid[item - rows].isWall) && grid[item - rows - 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x < middle.x) { // left
        if (grid[item + rows].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x > middle.x) { // right
        if (grid[item - rows].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y < middle.y) { // top
        if (grid[item + 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y > middle.y) { // bottom
        if (grid[item - 1].isWall) {
          if (!grid[item].isExplored) {
            grid[item].isInSight = false;
          }
        } else grid[item].isExplored = true;
      }
    }
  }
  return surroundings;
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

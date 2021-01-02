var $mapContainer = $('#map-container');
var ctx = $("#ma-container").get(0);
var $map = $('#map');
var $timer = $('#timer');
var $modal = $('#instructions-modal');
var $popupModal = $("#popup-modal");
var $btn = $('#instructions-button');
var $minimapImage = $("#minimap");
var $humanImage = $("#human-image");
var $botImage = $("#bot-image");
var $close = $('.close')[0];
var $log = $('.tableItems');
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
const TEMP_COLOR = "#33ff70";
const LIGHT_TEMP_COLOR = "#99ffb7";

var grid = [];
var surroundings = [];
var tempBotExplored = [];
var botExplored = [];
var userBot, autoBot;
var mapPaths = ["src/sample-map.json", "src/data.json", "src/data1.json", "src/data3.json", "src/data4.json", "src/data6.json", "src/data7.json", "src/data8.json", "src/data9.json", "src/data10.json", "src/data11.json", "src/data12.json", "src/data13.json", "src/data14.json"];
var currentPath = mapPaths[8];

var count = 0;
var waitCount = 5;
var steps = 0;
var totalSteps = 7;
var seconds = 0;
var timeout;
var eventListenersAdded = false;
var fullMapDrawn = false;
var pause = false;
var humanLeft, humanRight, humanTop, humanBottom, botLeft, botRight, botTop, botBottom;
var intervalCount = 0;
var log = [];

$(document).ready(function() {
  createMap(currentPath, function loop() {
    if (!eventListenersAdded) {
      // document arrow keys event listener
      $(document).on('keydown', function(e) {
        switch (e.keyCode) {
          case 65:  // a
          case 37:  // left arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != 1 && !grid[userBot.loc - rows].isWall) {
              userBot.loc -= rows;
              userBot.dir = 4;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 87:  // w
          case 38:  // up arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != 1 && !grid[userBot.loc - 1].isWall) {
              userBot.loc--;
              userBot.dir = 1;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 68:  // d
          case 39:  // right arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].x) != Math.floor(1 + (columns - 1) * (canvasWidth / columns)) && !grid[userBot.loc + rows].isWall) {
              userBot.loc += rows;
              userBot.dir = 2;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 83:  // s
          case 40:  // down arrow key
            e.preventDefault();
            if (Math.floor(grid[userBot.loc].y) != Math.floor(1 + (rows - 1) * (canvasHeight / rows)) && !grid[userBot.loc + 1].isWall) {
              userBot.loc++;
              userBot.dir = 3;
              refreshMap();
              updateScrollingPosition(grid[userBot.loc]);
            }
            break;
          case 67:  // c
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

    if (!pause) {
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
    }
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

function showExploredInfo() {
  let cell;
  for (let i = 0; i < tempBotExplored.length; i++) {
    cell = grid[tempBotExplored[i]];
    if (cell.tempBotExplored && !cell.isHumanExplored) {
      if (cell.tempInSight && cell.isWall) {
        $map.drawRect({
            layer: true,
            name: 'temporary',
            fillStyle: WALL_COLOR,
            strokeStyle: TEMP_COLOR,
            strokeWidth: 1,
            cornerRadius: 2,
            x: cell.x*boxWidth, y: cell.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
        });
      } else if (cell.tempInSight && !cell.isWall) {
        $map.drawRect({
            layer: true,
            name: 'temporary',
            fillStyle: LIGHT_TEMP_COLOR,
            x: cell.x*boxWidth, y: cell.y*boxHeight,
            width: boxWidth - 1, height: boxHeight - 1
        });
      }
    }
  }

  $popupModal.css('visibility', 'visible');  // changed here
  $popupModal.css('opacity', 1); // changed here
  $minimapImage.attr("src", $map.getCanvasImage());
  $humanImage.attr("src", $map.getCanvasImage());
  $botImage.attr("src", $map.getCanvasImage());

  if (log[intervalCount - 1] != null) {
    let chosenOption = (log[intervalCount - 1].trusted) ? "Integrated" : "Discarded";
    if (chosenOption == "Integrated") {
      $log.append("<p style='background-color: #99ffb7;'>Interval " + intervalCount + "<br>" + chosenOption + "</p>");
    } else {
      $log.append("<p style='background-color: #ff9eae;'>Interval " + intervalCount + "<br>" + chosenOption + "</p>");
    }
  }
  
  scaleImages();

  pause = true;
  clearInterval(timeout);
  
  /* $map.addLayer({
    type: 'function',
    name: 'temporary',
    fn: function(ctx) {
      for (let i = 0; i < tempBotExplored.length; i++) {
        cell = grid[tempBotExplored[i]];
        if (cell.isBotExplored && !cell.isHumanExplored) {
          if (cell.isInSight && cell.isWall) {
            ctx.fillStyle = WALL_COLOR;
            ctx.strokeStyle = TEMP_COLOR;
            // ctx.roundRect(ctx, cell.x*boxWidth, cell.y*boxHeight, boxWidth - 1, boxHeight - 1, 2, true, true);
            ctx.beginPath();
            ctx.moveTo(cell.x*boxWidth + 2, cell.y*boxHeight);
            ctx.lineTo(cell.x*boxWidth + boxWidth - 1 - 2, cell.y*boxHeight);
            ctx.quadraticCurveTo(cell.x*boxWidth + boxWidth - 1, cell.y*boxHeight, cell.x*boxWidth + boxWidth - 1, cell.y*boxHeight + 2);
            ctx.lineTo(cell.x*boxWidth + boxWidth - 1, cell.y*boxHeight + boxHeight - 1 - 2);
            ctx.quadraticCurveTo(cell.x*boxWidth + boxWidth - 1, cell.y*boxHeight + boxHeight - 1, cell.x*boxWidth + boxWidth - 1 - 2, cell.y*boxHeight + boxHeight - 1);
            ctx.lineTo(cell.x*boxWidth + 2, cell.y*boxHeight + boxHeight - 1);
            ctx.quadraticCurveTo(cell.x*boxWidth, cell.y*boxHeight + boxHeight - 1, cell.x*boxWidth, cell.y*boxHeight + boxHeight - 1 - 2);
            ctx.lineTo(cell.x*boxWidth, cell.y*boxHeight + 2);
            ctx.quadraticCurveTo(cell.x*boxWidth, cell.y*boxHeight, cell.x*boxWidth + 2, cell.y*boxHeight);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // ctx.fillRect(cell.x*boxWidth, cell.y*boxHeight, boxWidth - 1, boxHeight - 1);
          } else if (cell.isInSight && !cell.isWall) {
            ctx.fillStyle = LIGHT_TEMP_COLOR;
            ctx.fillRect(cell.x*boxWidth, cell.y*boxHeight, boxWidth - 1, boxHeight - 1);
          }
        }
      }
    }
  }).drawLayers(); */
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

function hideExploredInfo() {
  $popupModal.css('visibility', 'visible'); //  changed here
  $popupModal.css('opacity', 0); //  changed here
  // drawMap();
  drawExplored();
  botExplored = [];
  tempBotExplored = [];
}

function confirmExploredArea() {
  let cell;
  for (let i = 0; i < tempBotExplored.length; i++) {
    cell = grid[tempBotExplored[i]];
    // cell.isExplored = true;
    cell.isBotExplored = true;
    cell.isInSight = true;
  }
  botExplored = tempBotExplored;
  log.push({interval: intervalCount++, trusted: true});
  hideExploredInfo();
  timeout = setInterval(updateTime, 1000);
  pause = false;
}

function undoExploration() {
  let cell;
  for (let i = 0; i < tempBotExplored; i++) {
    cell = grid[tempBotExplored[i]];
    cell.isExplored = false;
    cell.tempInSight = false;
    cell.tempBotExplored = false;
    cell.isBotExplored = false;
  }
  botExplored = tempBotExplored;
  /* for (let i = 0; i < tempBotExplored.length; i++) {
    cell = grid[tempBotExplored[i]];
    $map.clearCanvas({
      x: cell.x*boxWidth - 1, y: cell.y*boxHeight - 1,
      width: boxWidth + 1, height: boxHeight + 1
    });
  } */
  // $map.removeLayer('temporary').drawLayers();
  log.push({interval: intervalCount++, trusted: false});
  hideExploredInfo();
  timeout = setInterval(updateTime, 1000);
  pause = false;
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
    /* setTimeout(function() {
      if (confirm("Do you trust the agent explored region?")) confirmExploredArea();
    }, 1000); */
    /* if (confirm("Do you trust the agent explored region?")) 
      confirmExploredArea(); */
    //} else {
    //  undoExploration();
    //}
    // $popupModal.css('display', 'none');

    // drawExplored();
    /* botExplored = [];
    tempBotExplored = []; */
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
      grid.push({x: value.x, y: value.y, isWall: value.isWall == "true", isHumanExplored: false, isBotExplored: false, isExplored: value.isExplored == "true", isInSight: false, tempBotExplored: false, tempInSight: false});
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
    timeout = setInterval(updateTime, 1000);

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
  drawMap(grid);
  refreshBotExplored();
  spawnBot(userBot);
  spawnBot(autoBot);
  getSetBoundaries(surroundings, 0);
}

function refreshBotExplored() {
  let botSurroundings = findLineOfSight(autoBot);
  for (let i = 0; i < botSurroundings.length; i++) {
    if (!tempBotExplored.includes(botSurroundings[i])) {
      tempBotExplored.push(botSurroundings[i]);
    }
  }
  getSetBoundaries(tempBotExplored, 1);
}

function getSetBoundaries(arr, who) {
  if (who == 1) {
    botLeft = grid[arr[0]].x;
    botRight = grid[arr[0]].x;
    botTop = grid[arr[0]].y;
    botBottom = grid[arr[0]].y;

    for (let i = 1; i < arr.length; i++) {
      if (grid[arr[i]].x < botLeft) botLeft = grid[arr[i]].x;
      if (grid[arr[i]].x > botRight) botRight = grid[arr[i]].x;
      if (grid[arr[i]].y < botTop) botTop = grid[arr[i]].y;
      if (grid[arr[i]].y > botBottom) botBottom = grid[arr[i]].y;
    }
  } else {
    if (humanLeft == null) humanLeft = grid[arr[0]].x;
    if (humanRight == null) humanRight = grid[arr[0]].x;
    if (humanTop == null) humanTop = grid[arr[0]].y;
    if (humanBottom == null) humanBottom = grid[arr[0]].y;

    for (let i = 1; i < arr.length; i++) {
      if (grid[arr[i]].x < humanLeft) humanLeft = grid[arr[i]].x;
      if (grid[arr[i]].x > humanRight) humanRight = grid[arr[i]].x;
      if (grid[arr[i]].y < humanTop) humanTop = grid[arr[i]].y;
      if (grid[arr[i]].y > humanBottom) humanBottom = grid[arr[i]].y;
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

// find line of sight
function findLineOfSight(bot) {
  /* for (let i = 0; i < surroundings.length; i++) {
    grid[surroundings[i]].isInSight = false;
  } */
  let surroundings = [];
  if (bot.id == "human") {
    for (let x = grid[bot.loc].x - 2; x <= grid[bot.loc].x + 2; x++) {
      for (let y = grid[bot.loc].y - 2; y <= grid[bot.loc].y + 2; y++) {
        surroundings.push(y + x*(rows));
        grid[y + x*(rows)].isInSight = true;
      }
    }

    surroundings = getVisibleArea(surroundings);

    for (let i = 0; i < surroundings.length; i++) {
      grid[surroundings[i]].isHumanExplored = true;
    }
  } else if (bot.id == "agent") {
    for (let x = grid[bot.loc].x - 2; x <= grid[bot.loc].x + 2; x++) {
      for (let y = grid[bot.loc].y - 2; y <= grid[bot.loc].y + 2; y++) {
        surroundings.push(y + x*(rows));
        grid[y + x*(rows)].tempInSight = true;
      }
    }

    surroundings = getBotExploredArea(surroundings);

    for (let i = 0; i < surroundings.length; i++) {
      grid[surroundings[i]].tempBotExplored = true;
    }
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

function getBotExploredArea(surroundings) {
  let item;
  let middle = grid[surroundings[Math.floor(surroundings.length/2)]];
  for (let i = 0; i < surroundings.length; i++) {
    item = surroundings[i];
    if (i != middle && !grid[item].isWall) {
      if (grid[item].x < middle.x && grid[item].y < middle.y) { // top left
        if (grid[item + rows + 1] != middle && (grid[item + 1].isWall || grid[item + rows].isWall || grid[item + rows + 1].isWall)) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y < middle.y) {  // top right
        if (grid[item - rows + 1] != middle && (grid[item + 1].isWall || grid[item - rows].isWall || grid[item - rows + 1].isWall)) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x < middle.x && grid[item].y > middle.y) {  // bottom left
        if (grid[item + rows - 1] != middle && (grid[item - 1].isWall || grid[item + rows - 1].isWall || grid[item + rows].isWall)) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y > middle.y) {  // bottom right
        if (grid[item - rows - 1] != middle && (grid[item - 1].isWall || grid[item - rows].isWall || grid[item - rows - 1].isWall)) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x < middle.x) { // left
        if (grid[item + rows].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x > middle.x) { // right
        if (grid[item - rows].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y < middle.y) { // top
        if (grid[item + 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y > middle.y) { // bottom
        if (grid[item - 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      }
    } else {
      if (grid[item].x < middle.x && grid[item].y < middle.y) { // top left
        if ((grid[item + 1].isWall || grid[item + rows].isWall) && grid[item + rows + 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y < middle.y) {  // top right
        if ((grid[item + 1].isWall || grid[item - rows].isWall) && grid[item - rows + 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x < middle.x && grid[item].y > middle.y) {  // bottom left
        if ((grid[item - 1].isWall || grid[item + rows].isWall) && grid[item + rows - 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x > middle.x && grid[item].y > middle.y) {  // bottom right
        if ((grid[item - 1].isWall || grid[item - rows].isWall) && grid[item - rows - 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x < middle.x) { // left
        if (grid[item + rows].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].y == middle.y && grid[item].x > middle.x) { // right
        if (grid[item - rows].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y < middle.y) { // top
        if (grid[item + 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
      } else if (grid[item].x == middle.x && grid[item].y > middle.y) { // bottom
        if (grid[item - 1].isWall) {
          if (!grid[item].tempBotExplored) {
            grid[item].tempInSight = false;
          }
        } else grid[item].tempBotExplored = true;
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

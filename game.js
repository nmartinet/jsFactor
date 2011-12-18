/*
  before checking store old board
  compare both
  if diff recheck
  continue until ==


  add constants

  Draw active disk centered


*/

var DISK_SPRITE     =   'img/Sphere.png',
    BOARD_SPRITE 	  =   'img/Grid.png',
    RADIUS          =   60,
    DROP_TOP        =   50,
    BOARD_TOP       =   120,
    BOARD_LEFT      =   50,
    BOARD_HEIGHT    =   420,
    BOARD_WIDTH     =   420,
    CANVAS_HEIGHT   =   600,
    CANVAS_WIDTH    =   600;


window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function AssetManager() {
  this.successCount = 0;
  this.errorCount = 0;
  this.cache = {};
  this.downloadQueue = [];
}
AssetManager.prototype.queueDownload = function(path) {
  this.downloadQueue.push(path);
}
AssetManager.prototype.downloadAll = function(callback) {
  if (this.downloadQueue.length === 0 && this.soundsQueue.length === 0) {
    callback();
  }

  for (var i = 0; i < this.downloadQueue.length; i++) {
    var path = this.downloadQueue[i];
    var img = new Image();
    var that = this;
    img.addEventListener("load", function() {
      console.log(this.src + ' is loaded');
      that.successCount += 1;
      if (that.isDone()) {
        callback();
      }
    }, false);
    img.addEventListener("error", function() {
      that.errorCount += 1;
      if (that.isDone()) {
        callback();
      }
    }, false);
    img.src = path;
    this.cache[path] = img;
  }
}
AssetManager.prototype.getAsset = function(path) {
  return this.cache[path];
}
AssetManager.prototype.isDone = function() {
  return (this.downloadQueue.length == this.successCount + this.errorCount);
}

function Animation(spriteSheet, frameWidth, frameDuration, loop) {
  this.spriteSheet = spriteSheet;
  this.frameWidth = frameWidth;
  this.frameDuration = frameDuration;
  this.frameHeight= this.spriteSheet.height;
  this.totalTime = (this.spriteSheet.width / this.frameWidth) * this.frameDuration;
  this.elapsedTime = 0;
  this.loop = loop;
}
Animation.prototype.drawFrame = function(tick, ctx, x, y, scaleBy) {
  var scaleBy = scaleBy || 1;
  this.elapsedTime += tick;
  if (this.loop) {
    if (this.isDone()) {
      this.elapsedTime = 0;
    }
  } else if (this.isDone()) {
    return;
  }
  var index = this.currentFrame();
  var locX = x - (this.frameWidth/2) * scaleBy;
  var locY = y - (this.frameHeight/2) * scaleBy;
  ctx.drawImage(this.spriteSheet,
                index*this.frameWidth, 0,  // source from sheet
                this.frameWidth, this.frameHeight,
                locX, locY,
                this.frameWidth*scaleBy,
                this.frameHeight*scaleBy);
}
Animation.prototype.currentFrame = function() {
  return Math.floor(this.elapsedTime / this.frameDuration);
}
Animation.prototype.isDone = function() {
  return (this.elapsedTime >= this.totalTime);
}

function Timer() {
  this.gameTime = 0;
  this.maxStep = 0.05;
  this.wallLastTimestamp = 0;
}
Timer.prototype.tick = function() {
  var wallCurrent = Date.now();
  var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
  this.wallLastTimestamp = wallCurrent;

  var gameDelta = Math.min(wallDelta, this.maxStep);
  this.gameTime += gameDelta;
  return gameDelta;
}

function GameEngine() {
  this.entities = [];
  this.ctx = null;
  this.click = null;
  this.mouse = null;
  this.timer = new Timer();
  this.surfaceWidth = null;
  this.surfaceHeight = null;
  this.halfSurfaceWidth = null;
  this.halfSurfaceHeight = null;
}
GameEngine.prototype.init = function(ctx) {
  console.log('game initialized');
  this.ctx = ctx;
  this.surfaceWidth = this.ctx.canvas.width;
  this.surfaceHeight = this.ctx.canvas.height;
  this.halfSurfaceWidth = this.surfaceWidth/2;
  this.halfSurfaceHeight = this.surfaceHeight/2;
  this.startInput();
}
GameEngine.prototype.start = function() {
  console.log("starting game");
  var that = this;
  (function gameLoop() {
    that.loop();
    requestAnimFrame(gameLoop, that.ctx.canvas);
  })();
}
GameEngine.prototype.startInput = function() {
  var getXandY = function(e) {
    var x =  e.clientX ;
    var y = e.clientY ;
    return {x: x, y: y};
  }

  var that = this;

  this.ctx.canvas.addEventListener("click", function(e) {
    that.click = getXandY(e);
    e.stopPropagation();
    e.preventDefault();
    console.log(that.click);
  }, false);

  this.ctx.canvas.addEventListener("mousemove", function(e) {
    that.mouse = getXandY(e);
  }, false);
}
GameEngine.prototype.addEntity = function(entity) {
  this.entities.push(entity);
}
GameEngine.prototype.draw = function(callback) {
  this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.ctx.save();
	this.ctx.translate(0, 0);

  for (var i = 0; i < this.entities.length; i++) {
    this.entities[i].draw(this.ctx);
  }
  if (callback) {
    callback(this);
  }
  this.ctx.restore();
}
GameEngine.prototype.update = function() {
  var entitiesCount = this.entities.length;

  for (var i = 0; i < entitiesCount; i++) {
    var entity = this.entities[i];

    if (!entity.removeFromWorld) {
      entity.update();
    }
  }

  for (var i = this.entities.length-1; i >= 0; --i) {
    if (this.entities[i].removeFromWorld) {
      this.entities.splice(i, 1);
    }
  }
}
GameEngine.prototype.loop = function() {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
}

function Entity(game, x, y, v) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
    return this;
}
Entity.prototype.update = function() {
}
Entity.prototype.draw = function(ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.closePath();
    }
}
Entity.prototype.drawSpriteCentered = function(ctx) {
  ctx.drawImage(this.sprite, this.x, this.y);
}
Entity.prototype.outsideScreen = function() {
    return (this.x > this.game.halfSurfaceWidth || this.x < -(this.game.halfSurfaceWidth) ||
        this.y > this.game.halfSurfaceHeight || this.y < -(this.game.halfSurfaceHeight));
}
Entity.prototype.rotateAndCache = function(image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.rotate(angle + Math.PI/2);
    offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

function CalcCoord(c, r){
  return {x: (BOARD_LEFT + (c * RADIUS)),
          y: (((r + 1) * RADIUS) + (CANVAS_HEIGHT - (BOARD_HEIGHT + BOARD_TOP)   )    )};
}

function getDropCol(game){
  var x = game.mouse.x;
  var col = 0;

  if(x < BOARD_LEFT ){
    col = 0;
  }else if(x > (BOARD_LEFT + BOARD_WIDTH)){
    col = 6;
  }else{
    col = Math.floor((x - BOARD_LEFT) / RADIUS);
  }

  return col;

}


function Board(game) {
    Entity.call(this, game, BOARD_LEFT , BOARD_TOP);
    this.sprite = ASSET_MANAGER.getAsset(BOARD_SPRITE);
}
Board.prototype = new Entity();
Board.prototype.constructor = Board;
Board.prototype.draw = function(ctx) {
    ctx.drawImage(this.sprite, this.x , this.y);
}
Board.prototype.addDisk = function(x, y) {
    return this.game.addEntity();
}
Board.prototype.setupBoard = function() {
  this.board = [];
  for(var c = 0; c < 7; c++){
    this.board[c] = [];
    for(var r = 0; r < 7; r++){
      var pos = CalcCoord(c, r);
      this.board[c][r] = new Disk(this.game, pos.x, pos.y,  Math.floor((Math.random() * 7) + 1 ));
      this.game.addEntity(this.board[c][r]);
    }
  }
}
Board.prototype.checkBoard = function(){
//add check for gray disks and erosion
  _(this.board).each(function(c){
    var columnSize = _.compact(c).length;
      _(c).each(function(disk){
      if(disk != null){
        if(disk.val == columnSize){
          disk.flagged = true;
        }
      }
    })
  })

  for(var c = 0; c < 7; c++){
    for(var r = 0; r < 7; r++){
      if (this.board[c][r] != null) {
        var val = this.board[c][r].val;
        var row = 1;

        if(c != 6){
          var i = c + 1;
          while(i <= 6 && this.board[i][r] != null){
            row++;
            i++;
          }
        }

        if(c != 0){
          i = c - 1;
          while(i >= 0 && this.board[i][r] != null){
            row++;
            i--;
          }
        }

        if(this.board[c][r].val == row){
          this.board[c][r].flagged = true;
        }

      }
    }
  }
}
Board.prototype.clearFlagged = function(){
//add erosion fro gray disks
  for(var c = 0; c < 7; c++){
    for(var r = 0; r < 7; r++){
      if(this.board[c][r] != null){
        if(this.board[c][r].flagged == true){
          this.board[c][r].removeFromWorld = true
          this.board[c][r] = null;
        }
      }
    }
  }

  for(var c = 0; c < 7; c++){
    var tmpCol = _.compact(this.board[c]);

    for(r = 0; r < 7; r++){
      if(tmpCol[r] != null){
        this.board[c][r] = tmpCol[r];
        var pos = CalcCoord(c, r);
        this.board[c][r].y = pos.y;
      }else{
        this.board[c][r] = null;
      }
    }

  }


}
Board.prototype.dropDisk = function(col, val){
  if(this.board[col].count != 6){

    console.log("Column:  ", col);

    var row = _.compact(this.board[col]).length;

    console.log("Row:  ", row);

    if(row == -1){
      row = 0;
    }


    console.log("droppping");
    console.log(row);
    var pos = CalcCoord(col, row);
    this.board[col][row] = new Disk(this.game, pos.x, pos.y, val);
    this.game.addEntity(this.board[col][row]);

  }
}


function Disk(game, x, y, v) {
  Entity.call(this, game, x, y);
  this.val = v
  this.flagged = false;
  this.sprite = ASSET_MANAGER.getAsset(DISK_SPRITE);
}
Disk.prototype = new Entity();
Disk.prototype.constructor = Disk;
Disk.prototype.update =  function() {
    Entity.prototype.update.call(this);
}
Disk.prototype.draw = function(ctx){
  //add shift for spite sheet
  var y = ctx.canvas.height - this.y;
  ctx.drawImage(this.sprite, (this.val - 1) * RADIUS  , 0, RADIUS, RADIUS, this.x, y, RADIUS,RADIUS);
}

function ActiveDisk(game, v) {
  this.col = 6;
  if(game.mouse){
    this.col = getDropCol(game);
  }

  Entity.call(this, game, (this.col*RADIUS + BOARD_LEFT), DROP_TOP);
  this.val = v
  this.flagged = false;
  this.sprite = ASSET_MANAGER.getAsset(DISK_SPRITE);
}
ActiveDisk.prototype = new Entity();
ActiveDisk.prototype.constructor =ActiveDisk;
ActiveDisk.prototype.update =  function() {
  if  (this.game.mouse){
	  this.col = getDropCol(this.game);
	}
	this.x = this.col*RADIUS + BOARD_LEFT;
  Entity.prototype.update.call(this);
}
ActiveDisk.prototype.draw = function(ctx){
  ctx.drawImage(this.sprite, (this.val - 1) * RADIUS  , 0,RADIUS,RADIUS, this.x, this.y, RADIUS,RADIUS);
}

function jsFactor() {
	this.click = false;
	this.oldBoard = [];
  GameEngine.call(this);
}
jsFactor.prototype = new GameEngine();
jsFactor.prototype.constructor = jsFactor;
jsFactor.prototype.start = function() {

  //Create board & setup (remove already flagged disks
  this.board = new Board(this);
  this.addEntity(this.board);
  this.board.setupBoard();

  //Active disk - disk in dropdown area
  this.actDisk = new ActiveDisk(this, 5);
  this.addEntity(this.actDisk);

  GameEngine.prototype.start.call(this);
}
jsFactor.prototype.update = function() {
  this.oldBoard = [];
  this.freezeInput = true;

  //if on click drop board - Add more logic later on to check
  //if col already 7 high
  //Change active disk value
  if(this.click){
    this.board.dropDisk(this.actDisk.col, this.actDisk.val);
    this.actDisk.val =  Math.floor((Math.random() * 7) + 1 );
  }

  while(this.oldBoard != this.board.board){
    this.board.checkBoard();
    this.board.clearFlagged();
    this.oldBoard = this.board.board;
  }
  GameEngine.prototype.update.call(this);
  this.freezeInput = false;
}
jsFactor.prototype.draw = function() {
  GameEngine.prototype.draw.call(this);
}

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var game = new jsFactor();
var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload(BOARD_SPRITE);
ASSET_MANAGER.queueDownload(DISK_SPRITE);

ASSET_MANAGER.downloadAll(function() {
  game.init(ctx);
  game.start();
});

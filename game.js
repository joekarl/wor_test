"use strict";

// setup game stuffs
const canvasEl = document.getElementById('gameCanvas');
canvasEl.width = G.WIDTH;
canvasEl.height = G.HEIGHT;
const ctx2D = canvasEl.getContext('2d');

const gameState = {
  globalState: {
    // canvas
    canvas: {
      ctx2D: ctx2D,
      height: canvasEl.height,
      width: canvasEl.width,
    },
    input: new Input(),
    needToInitState: true,
    state: G.GAME_STATES.GAMEPLAY,
  },
  menuState: {

  },
  gamePlayState: {
    // general
    paused: false,
    // level info
    initLevel: true,
    level: -1,
    // entity info
    entities: new Array(9), // 6 enemies, 1 character, 1 dpad, 1 laser
    laserAvailable: true,
    warpTime: -1,
  }
};

function gameLoop() {

  if (gameState.globalState.needToInitState) {
    switch (gameState.globalState.state) {
      case G.GAME_STATES.GAMEPLAY:
        GAME_STATE_GAMEPLAY.init(gameState);
        break;
    }
    gameState.globalState.needToInitState = false;
  }

  // update the gamestate
  switch (gameState.globalState.state) {
    case G.GAME_STATES.GAMEPLAY:
      GAME_STATE_GAMEPLAY.update(gameState);
      break;
  }

  // draw the game
  ctx2D.fillStyle = "#000";
  ctx2D.fillRect(0, 0, canvasEl.width, canvasEl.height);

  switch (gameState.globalState.state) {
    case G.GAME_STATES.GAMEPLAY:
      GAME_STATE_GAMEPLAY.draw(gameState);
      break;
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);



GAME_STATE_GAMEPLAY = {
  init(gameState) {
    gameState.gamePlayState.paused = false;
    gameState.gamePlayState.initLevel = true;
    gameState.gamePlayState.level = 0;
    gameState.gamePlayState.entities = [];
    gameState.gamePlayState.laserAvailable = true;
    gameState.gamePlayState.warpTime = 0;
    gameState.gamePlayState.livesLeft = 3;

    gameState.gamePlayState.entities.push(makeDPad());
    const laser = makeLaser();
    gameState.gamePlayState.entities.push(laser);
    const player = makePlayer();
    gameState.gamePlayState.entities.push(player);

    gameState.gamePlayState.entities.push(makeEnemy());
    gameState.gamePlayState.entities.push(makeEnemy());
    gameState.gamePlayState.entities.push(makeEnemy());
    gameState.gamePlayState.entities.push(makeEnemy());
    gameState.gamePlayState.entities.push(makeEnemy());
    gameState.gamePlayState.entities.push(makeEnemy());
  },
  draw(gameState) {
    const entities = gameState.gamePlayState.entities;
    const level = LEVELS[gameState.gamePlayState.level];

    drawLevel(gameState);
    drawLives(gameState);
    entities.forEach(e => { if (!e.deadFlag) e.draw(gameState); });
  },
  update(gameState) {
    const entities = gameState.gamePlayState.entities;
    const level = LEVELS[gameState.gamePlayState.level];

    // init level
    if (gameState.gamePlayState.initLevel) {

    }

    // clean up entity state
    entities.forEach(e => {
      if (e.dyingFlag) {
        e.dyingTimeout -= 16;
        if (e.dyingTimeout < 0) {
          e.deadFlag = true;
          e.dyingFlag = false;
          e.creatingFlag = false;
        }
      }
      if (e.creatingFlag) {
        e.creatingFlag = false;
        e.deadFlag = false;
        e.dyingFlag = false;
        if (e.instantDeathFlag) {
          e.dyingTimeout = -1;
        } else {
          e.dyingTimeout = G.DYING_TIMEOUT;
        }
      }
    });

    tryFireLaser(gameState);
    simEntities(gameState);
    checkCollisions(gameState);

    if (gameState.gamePlayState.warpTimer > 0) {
      level[G.WARP_Y][1] = "1";
      level[G.WARP_Y][G.LEVEL_WIDTH - 2] = "3";
      gameState.gamePlayState.warpTimer -= 16;
    } else {
      level[G.WARP_Y][1] = "0";
      level[G.WARP_Y][G.LEVEL_WIDTH - 2] = "0";
    }
  }
};

function getEntityOfType(entities, type) {
  return entities.find(e => e.entityType == type);
}

function makeEnemy() {
  const entity = new Entity();
  entity.entityType = G.ENTITY_TYPES.ENEMY;
  entity.position = gridPositionToXY(new Vec2(getRandomInt(1, G.LEVEL_WIDTH - 2), getRandomInt(1, G.LEVEL_HEIGHT - 2)));
  entity.targetGridPoint = xyToGridPosition(entity.position);
  entity.simDungeonFlag = true;
  entity.deadFlag = true;
  entity.dyingFlag = false;
  entity.creatingFlag = true;
  entity.canWrapFlag = true;
  entity.speed = G.PLAYER_VEL;
  entity.bounds = new Rect(
    entity.position.x,
    entity.position.y,
    G.GRID_WIDTH - 2 * G.PLAYER_MARGIN,
    G.GRID_HEIGHT - 2 * G.PLAYER_MARGIN);
  return entity;
}

function makePlayer() {
  const entity = new Entity();
  entity.entityType = G.ENTITY_TYPES.PLAYER;
  entity.position = gridPositionToXY(new Vec2(G.LEVEL_WIDTH - 2, G.LEVEL_HEIGHT - 1));
  entity.targetGridPoint = xyToGridPosition(entity.position);
  entity.simDungeonFlag = true;
  entity.deadFlag = true;
  entity.dyingFlag = false;
  entity.creatingFlag = true;
  entity.canWrapFlag = true;
  entity.speed = G.PLAYER_VEL;
  entity.bounds = new Rect(
    entity.position.x,
    entity.position.y,
    G.GRID_WIDTH - 2 * G.PLAYER_MARGIN,
    G.GRID_HEIGHT - 2 * G.PLAYER_MARGIN);
  return entity;
}

function makeLaser() {
  const entity = new Entity();
  entity.entityType = G.ENTITY_TYPES.LASER;
  entity.position = gridPositionToXY(new Vec2(G.LEVEL_WIDTH - 2, G.LEVEL_HEIGHT - 1));
  entity.targetGridPoint = xyToGridPosition(entity.position);
  entity.simDungeonFlag = true;
  entity.deadFlag = true;
  entity.dyingFlag = false;
  entity.creatingFlag = false;
  entity.instantDeathFlag = true;
  entity.speed = G.LASER_VEL;
  entity.bounds = new Rect(
    entity.position.x,
    entity.position.y,
    -1, -1);
  return entity;
}

function makeDPad() {
  const entity = new Entity();
  entity.entityType = G.ENTITY_TYPES.DPAD;
  entity.deadFlag = true;
  entity.dyingFlag = false;
  entity.creatingFlag = true;
  entity.simDungeonFlag = false;
  return entity;
}

function tryFireLaser(gameState) {
  const laserAvailable = gameState.gamePlayState.laserAvailable;
  const input = gameState.globalState.input;
  const laser = getEntityOfType(gameState.gamePlayState.entities, G.ENTITY_TYPES.LASER);
  const player = getEntityOfType(gameState.gamePlayState.entities, G.ENTITY_TYPES.PLAYER);

  if (laserAvailable && input.isActive(G.KEY_BINDINGS.SPACE) > 0) {
    gameState.gamePlayState.laserAvailable = false;
    laser.creatingFlag = true;
    laser.position = player.position.copy();
    laser.facingDirection = player.facingDirection.copy();
    laser.targetGridPoint = player.targetGridPoint.copy();
    laser.bounds.width = laser.facingDirection.x != 0 ? G.LASER_LENGTH : G.LASER_THICKNESS;
    laser.bounds.height = laser.facingDirection.y != 0 ? G.LASER_LENGTH : G.LASER_THICKNESS;
  } else {
    gameState.gamePlayState.laserAvailable = (
      laser.deadFlag &&
      player.targetGridPoint &&
      !player.dyingFlag &&
      !player.deadFlag &&
      !player.creatingFlag &&
      input.isActive(G.KEY_BINDINGS.SPACE) < 0
    );
  }
}

function simEntities(gameState) {
  const entities = gameState.gamePlayState.entities;
  const level = LEVELS[gameState.gamePlayState.level];

  entities.forEach(entity => {
    entity.update(gameState);
    if (entity.deadFlag || entity.dyingFlag) {return;}
    if (!entity.simDungeonFlag) {return;}
    var dt = 1.0;
    const entityGridPos = xyToGridPosition(entity.position);
    const currentGridXY = gridPositionToXY(entityGridPos);

    if (entity.position.equal(currentGridXY)) {
      // we're at a junction, do something
      if (level[entity.targetGridPoint.y][entity.targetGridPoint.x] == "G") {
        // we hit the warp point
        if (entity.canWrapFlag) {
          if (entity.targetGridPoint.x == 0) {
            entity.targetGridPoint = new Vec2(G.LEVEL_WIDTH - 1, G.WARP_Y);
            entity.position = gridPositionToXY(entity.targetGridPoint);
            entity.targetGridPoint.x -= 1;
          } else if (entity.targetGridPoint.x == G.LEVEL_WIDTH - 1) {
            entity.targetGridPoint = new Vec2(0, G.WARP_Y);
            entity.position = gridPositionToXY(entity.targetGridPoint);
            entity.targetGridPoint.x += 1;
          }
          gameState.gamePlayState.warpTimer = G.WARP_TIMEOUT;
        } else {
          entity.dyingFlag = true;
        }
      } else {
        switch(entity.entityType) {
          case G.ENTITY_TYPES.LASER:
            if (canMoveTowardsGridPoint(entityGridPos, entity.facingDirection, level)) {
              entity.targetGridPoint = entity.targetGridPoint.add(entity.facingDirection);
            } else {
              entity.dyingFlag = true;
              return;
            }
            break;
          case G.ENTITY_TYPES.ENEMY:
            // we need to pick a new direction
            entity.targetGridPoint = pickRandomGridTarget(entity, level);
            break;
        }
      }
    }

    const targetXY = gridPositionToXY(entity.targetGridPoint);
    const dv = targetXY.sub(entity.position);
    const dvNormal = dv.copy();
    dvNormal.normalize();
    if (dv.y == 0 && Math.abs(dv.x) <= entity.speed) {
      dt = Math.abs(dv.x / entity.speed);
      entity.position = targetXY;
    } else if (dv.x == 0 && Math.abs(dv.y) <= entity.speed) {
      dt = Math.abs(dv.y / entity.speed);
      entity.position = targetXY;
    } else {
      entity.position.x += dt * dvNormal.x * entity.speed;
      entity.position.y += dt * dvNormal.y * entity.speed;
    }

    if (dvNormal.x != 0 || dvNormal.y != 0) {
      entity.facingDirection = dvNormal;
    }

    if (entity.bounds) {
      entity.bounds.x = entity.position.x;
      entity.bounds.y = entity.position.y;
    }
  });
}

function checkCollisions(gameState) {
  const entities = gameState.gamePlayState.entities;
  const laser = getEntityOfType(entities, G.ENTITY_TYPES.LASER);
  const player = getEntityOfType(entities, G.ENTITY_TYPES.PLAYER);
  const activeEnemies = entities.filter(e => {
    return e.entityType == G.ENTITY_TYPES.ENEMY &&
    e.deadFlag == false &&
    e.dyingFlag == false &&
    e.creatingFlag == false
  });

  var i, e;
  var collisionFound = false;

  if (!player.deadFlag && !player.dyingFlag && !player.creatingFlag) {
    for (i = 0; i < activeEnemies.length && !collisionFound; ++i) {
      var e = activeEnemies[i];
      if (e.bounds.makeMinkowskiSumWithRect(player.bounds).containsPoint(player.position)) {
        // collision
        player.dyingFlag = true;
        gameState.gamePlayState.livesLeft--;
        collisionFound = true;
        console.log("PLAYER COLLISION");
      }
    }
  }

  if (!laser.deadFlag && !laser.dyingFlag && !laser.creatingFlag) {
    collisionFound = false;
    for (i = 0; i < activeEnemies.length && !collisionFound; ++i) {
      var e = activeEnemies[i];
      if (e.bounds.makeMinkowskiSumWithRect(laser.bounds).containsPoint(laser.position)) {
        // collision
        e.dyingFlag = true;
        laser.dyingFlag = true;
        // increment score
        collisionFound = true;
        console.log("LASER COLLISION");
      }
    }
  }
}

function calculatePlayerTargetGridPoint(desiredDirection, currentXY, level) {
  const currentGridPoint = xyToGridPosition(currentXY);
  const currentGridXY = gridPositionToXY(currentGridPoint);
  const directionToCurrentGridPoint = currentGridXY.sub(currentXY);
  directionToCurrentGridPoint.normalize();
  if (directionToCurrentGridPoint.equal(desiredDirection)) {
    // we're moving towards the center of our grid point
    // go ahead and move
    return currentGridPoint;
  } else {
    // we're moving away from our grid point
    // if we can do that then add our direction
    if (currentXY.equal(currentGridXY)) {
      // we're at the center, go for move in desired direction if allowed
      if (canMoveTowardsGridPoint(currentGridPoint, desiredDirection, level)) {
        return currentGridPoint.add(desiredDirection);
      }
    } else {
      // we're not in the center,
      // so we can only move if the direction we want to move
      // is the opposite of the direction to our current grid point
      if (desiredDirection.isInverse(directionToCurrentGridPoint)) {
        return currentGridPoint.add(desiredDirection);
      }
    }
  }
}

function pickRandomGridTarget(entity, level) {
  const gridPoint = xyToGridPosition(entity.position);
  const sameDirectionTargetGridPoint = gridPoint.add(entity.facingDirection);
  const direction = sameDirectionTargetGridPoint.sub(gridPoint);
  direction.normalize();
  var probability = 1;
  if (canMoveTowardsGridPoint(gridPoint, direction, level)) {
    probability = 5;
  }
  var newDirection = direction;
  if (getRandomInt(1, probability) >= probability - 1) {
    newDirection = randomDirection();
    while (!canMoveTowardsGridPoint(gridPoint, newDirection, level)) {
      newDirection = randomDirection();
    }
  }
  gridPoint.x += newDirection.x;
  gridPoint.y += newDirection.y;
  entity.facingDirection = newDirection;
  return gridPoint;
}

function Entity() {
  this.entityType = G.ENTITY_TYPES.UNKNOWN;
  this.deadFlag = true;
  this.dyingFlag = false;
  this.creatingFlag = true;
  this.simDungeonFlag = false;
  this.canWrapFlag = false;
  this.position = new Vec2(0, 0);
  this.targetGridPoint = new Vec2(0, 0);
  this.facingDirection = new Vec2(0, 0);
  this.speed = 0;
  this.dyingTimeout = 0;
  this.bounds = undefined; // implemented at instantiation time
}

Entity.prototype.update = function(gameState) {
  const input = gameState.globalState.input;
  const level = LEVELS[gameState.gamePlayState.level];

  switch(this.entityType) {
    case G.ENTITY_TYPES.PLAYER:

      if (this.deadFlag) {
        this.position = gridPositionToXY(new Vec2(G.LEVEL_WIDTH - 2, G.LEVEL_HEIGHT - 1));
        this.bounds.x = this.position.x;
        this.bounds.y = this.position.y;
        this.creatingFlag = true;
      }

      const leftKeyTime = [input.isActive(G.KEY_BINDINGS.LEFT), new Vec2(-1, 0)];
      const rightKeyTime = [input.isActive(G.KEY_BINDINGS.RIGHT), new Vec2(1, 0)];
      const upKeyTime = [input.isActive(G.KEY_BINDINGS.UP), new Vec2(0, -1)];
      const downKeyTime = [input.isActive(G.KEY_BINDINGS.DOWN), new Vec2(0, 1)];

      // if we're not moving short circuit
      if (leftKeyTime[0] < 0 &&
          rightKeyTime[0] < 0 &&
          upKeyTime[0] < 0 &&
          downKeyTime[0] < 0) {
        this.simDungeonFlag = false;
      } else {
        const sortedKeyTimes = [
          leftKeyTime,
          rightKeyTime,
          upKeyTime,
          downKeyTime
        ].sort((a, b) => b[0] - a[0]);

        this.simDungeonFlag = true;
        // try to set targetGridPoint using first direction
        this.targetGridPoint = calculatePlayerTargetGridPoint(sortedKeyTimes[0][1], this.position, level);
        if (!this.targetGridPoint && sortedKeyTimes[1][1] > 0) {
          // primary direction failed, try secondary direction
          this.targetGridPoint = calculatePlayerTargetGridPoint(sortedKeyTimes[1][1], this.position, level);
        }
        if (!this.targetGridPoint) {
          // all user initiated directions failed, try facing direction
          this.targetGridPoint = calculatePlayerTargetGridPoint(this.facingDirection, this.position, level);
        }
        if (!this.targetGridPoint) {
          // all options failed, don't move
          this.simDungeonFlag = false;
        }
      }
      break;
    case G.ENTITY_TYPES.ENEMY:
      /* noop */
      break;
    case G.ENTITY_TYPES.DPAD:
      /* noop */
      break;
  }
};

function drawLevel(gameState) {
  const level = LEVELS[gameState.gamePlayState.level];
  const ctx2D = gameState.globalState.canvas.ctx2D;

  ctx2D.save();

  ctx2D.strokeStyle = "#00F";
  ctx2D.lineWidth = 8;
  drawWalls(level, ctx2D);

  ctx2D.restore();
}

Entity.prototype.draw = function(gameState) {
  const ctx2D = gameState.globalState.canvas.ctx2D;
  const input = gameState.globalState.input;

  switch(this.entityType) {
    case G.ENTITY_TYPES.PLAYER:
      drawPlayer(this, ctx2D);
      break;
    case G.ENTITY_TYPES.ENEMY:
      drawEnemy(this, ctx2D);
      break;
    case G.ENTITY_TYPES.DPAD:
      drawDPad(this, input, ctx2D);
      break;
    case G.ENTITY_TYPES.LASER:
      drawLaser(this, ctx2D);
      break;
  }
};

function drawLaser(entity, ctx2D) {
  ctx2D.save();

  ctx2D.fillStyle = "#FF0";
  fillRect(entity.bounds, ctx2D);

  ctx2D.restore();
}

function drawPlayer(entity, ctx2D) {
  ctx2D.save();

  const gridPosition = xyToGridPosition(entity.position);
  const gridXY = gridPositionToXY(gridPosition);
  ctx2D.strokeStyle = "#F00";
  ctx2D.strokeRect(gridXY.x - G.HALF_GRID_WIDTH,
                   gridXY.y - G.HALF_GRID_HEIGHT,
                   G.GRID_WIDTH,
                   G.GRID_HEIGHT,
                   ctx2D);

  ctx2D.fillStyle = "#00F";
  fillRect(entity.bounds, ctx2D);

  ctx2D.strokeStyle = "#F00";
  drawLine(entity.position.x, entity.position.y,
           entity.position.x + entity.facingDirection.x * (G.HALF_GRID_WIDTH - G.PLAYER_MARGIN),
           entity.position.y + entity.facingDirection.y * (G.HALF_GRID_HEIGHT - G.PLAYER_MARGIN),
           ctx2D);

  ctx2D.restore();
}

function drawDPad(entity, input, ctx2D) {
  ctx2D.save();

  if (input.isActive(G.KEY_BINDINGS.LEFT) > 0) {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 1)';
  } else {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 0.5)';
  }
  ctx2D.fillRect(20, G.HEIGHT - 40, 20, 20);

  if (input.isActive(G.KEY_BINDINGS.RIGHT) > 0) {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 1)';
  } else {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 0.5)';
  }
  ctx2D.fillRect(60, G.HEIGHT - 40, 20, 20);

  if (input.isActive(G.KEY_BINDINGS.UP) > 0) {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 1)';
  } else {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 0.5)';
  }
  ctx2D.fillRect(40, G.HEIGHT - 60, 20, 20);

  if (input.isActive(G.KEY_BINDINGS.DOWN) > 0) {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 1)';
  } else {
    ctx2D.fillStyle = 'rgba(200, 200, 200, 0.5)';
  }
  ctx2D.fillRect(40, G.HEIGHT - 40, 20, 20);

  ctx2D.restore();
};

function drawEnemy(entity, ctx2D) {
  ctx2D.save();

  const gridPosition = xyToGridPosition(entity.position);
  const gridXY = gridPositionToXY(gridPosition);
  ctx2D.strokeStyle = "#F00";
  ctx2D.strokeRect(gridXY.x - G.HALF_GRID_WIDTH,
                   gridXY.y - G.HALF_GRID_HEIGHT,
                   G.GRID_WIDTH,
                   G.GRID_HEIGHT);

  ctx2D.fillStyle = "#0F0";
  fillRect(entity.bounds, ctx2D);

  ctx2D.strokeStyle = "#000";
  drawLine(entity.position.x, entity.position.y,
           entity.position.x + entity.facingDirection.x * (G.HALF_GRID_WIDTH - G.PLAYER_MARGIN),
           entity.position.y + entity.facingDirection.y * (G.HALF_GRID_HEIGHT - G.PLAYER_MARGIN),
           ctx2D);

  ctx2D.restore();
}

function xyToGridPosition(xy) {
  return new Vec2(Math.floor((xy.x - G.PADDING) / G.GRID_WIDTH),
                  Math.floor((xy.y - G.PADDING) / G.GRID_HEIGHT));
}

function gridPositionToXY(gridPosition) {
  return new Vec2(G.PADDING + gridPosition.x * G.GRID_WIDTH + G.HALF_GRID_WIDTH,
                  G.PADDING + gridPosition.y * G.GRID_HEIGHT + G.HALF_GRID_HEIGHT);
}

function drawWalls(level, ctx2D) {
  for (var y = 0; y < level.length; ++y) {
    for (var x = 0; x < level[y].length; ++x) {
      drawNode(new Vec2(x, y), level, ctx2D);
    }
  }
}

function drawLives(gameState) {
  const ctx2D = gameState.globalState.canvas.ctx2D;

  ctx2D.save();

  ctx2D.fillStyle = "#FF0";

  var lifePosition = new Vec2(G.LEVEL_WIDTH - 1, G.LEVEL_HEIGHT - 1);
  var i;
  var lifeXy;
  for (i = 0; i < gameState.gamePlayState.livesLeft; ++i) {
    lifXy = gridPositionToXY(lifePosition);
    ctx2D.fillRect(lifXy.x + G.PLAYER_MARGIN - G.HALF_GRID_WIDTH,
                   lifXy.y + G.PLAYER_MARGIN - G.HALF_GRID_HEIGHT,
                   G.GRID_WIDTH - 2 * G.PLAYER_MARGIN,
                   G.GRID_HEIGHT - 2 * G.PLAYER_MARGIN);
    lifePosition.y--;
  }

  ctx2D.restore();
}

function drawBorder(ctx2D) {
  drawLine(G.PADDING, G.PADDING, G.PADDING, G.HEIGHT - G.PADDING, ctx2D);
  drawLine(G.WIDTH - G.PADDING, G.PADDING, G.WIDTH - G.PADDING, G.HEIGHT - G.PADDING, ctx2D);
  drawLine(G.PADDING, G.PADDING, G.WIDTH - G.PADDING, G.PADDING, ctx2D);
  drawLine(G.PADDING, G.HEIGHT - G.PADDING, G.WIDTH - G.PADDING, G.HEIGHT - G.PADDING, ctx2D);
}

function drawNode(gridPosition, level, ctx2D) {
  const xy = gridPositionToXY(gridPosition);
  const blockedDirections = nodeBlockedDirections(gridPosition, level);
  blockedDirections.forEach(d => {
    ctx2D.save();
    switch(d) {
      case G.DIRECTION.LEFT:
        if ((gridPosition.x == 1 || gridPosition.x == G.LEVEL_WIDTH - 2) && gridPosition.y == G.WARP_Y) {
          ctx2D.strokeStyle = '#F00';
        }
        drawLine(xy.x - G.HALF_GRID_WIDTH, xy.y - G.HALF_GRID_HEIGHT,
                 xy.x - G.HALF_GRID_WIDTH, xy.y + G.GRID_HEIGHT - G.HALF_GRID_HEIGHT,
                 ctx2D);
        break;
      case G.DIRECTION.RIGHT:
        if ((gridPosition.x == 1 || gridPosition.x == G.LEVEL_WIDTH - 2) && gridPosition.y == G.WARP_Y) {
          ctx2D.strokeStyle = '#F00';
        }
        drawLine(xy.x + G.GRID_WIDTH - G.HALF_GRID_WIDTH, xy.y - G.HALF_GRID_HEIGHT,
                 xy.x + G.GRID_WIDTH - G.HALF_GRID_WIDTH, xy.y + G.GRID_HEIGHT - G.HALF_GRID_HEIGHT,
                 ctx2D);
        break;
      case G.DIRECTION.UP:
        drawLine(xy.x - G.HALF_GRID_WIDTH, xy.y - G.HALF_GRID_HEIGHT,
                 xy.x + G.GRID_WIDTH - G.HALF_GRID_WIDTH, xy.y - G.HALF_GRID_HEIGHT,
                 ctx2D);
        break;
      case G.DIRECTION.DOWN:
        drawLine(xy.x - G.HALF_GRID_WIDTH, xy.y + G.GRID_HEIGHT - G.HALF_GRID_HEIGHT,
                 xy.x + G.GRID_WIDTH - G.HALF_GRID_WIDTH, xy.y + G.GRID_HEIGHT - G.HALF_GRID_HEIGHT,
                 ctx2D);
        break;
    }
    ctx2D.restore();
  });
}

function fillRect(rect, ctx2D) {
  ctx2D.fillRect(
    rect.x - rect.halfWidth,
    rect.y - rect.halfHeight,
    rect.width,
    rect.height
  );
}

function strokeRect(rect, ctx2D) {
  ctx2D.strokeRect(
    rect.x - rect.halfWidth,
    rect.y - rect.halfHeight,
    rect.width,
    rect.height
  );
}

function drawLine(x1, y1, x2, y2, ctx2D) {
  ctx2D.beginPath();
  ctx2D.moveTo(x1, y1);
  ctx2D.lineTo(x2, y2);
  ctx2D.closePath();
  ctx2D.stroke();
}

/*
  util functions
*/
function nodeBlockedDirections(gridPosition, level) {
  const gridVal = level[gridPosition.y][gridPosition.x];
  switch(gridVal) {
    case "0":
      return [];
    case "1":
      return [
        G.DIRECTION.LEFT
      ];
    case "2":
      return [
        G.DIRECTION.DOWN
      ];
    case "3":
      return [
        G.DIRECTION.RIGHT
      ];
    case "4":
      return [
        G.DIRECTION.UP
      ];
    case "5":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.DOWN
      ];
    case "6":
      return [
        G.DIRECTION.RIGHT,
        G.DIRECTION.DOWN
      ];
    case "7":
      return [
        G.DIRECTION.RIGHT,
        G.DIRECTION.UP
      ];
    case "8":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.UP
      ];
    case "9":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.UP,
        G.DIRECTION.DOWN
      ];
    case "A":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.RIGHT,
        G.DIRECTION.DOWN
      ];
    case "B":
      return [
        G.DIRECTION.RIGHT,
        G.DIRECTION.UP,
        G.DIRECTION.DOWN
      ];
    case "C":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.RIGHT,
        G.DIRECTION.UP
      ];
    case "D":
      return [
        G.DIRECTION.UP,
        G.DIRECTION.DOWN
      ];
    case "E":
      return [
        G.DIRECTION.LEFT,
        G.DIRECTION.RIGHT
      ];
    case "F":
      return [];
    case "G":
      return [
        G.DIRECTION.UP,
        G.DIRECTION.DOWN
      ];
  }
}

function randomDirection() {
  const r = getRandomInt(0, 4);
  switch(r) {
    case 0:
      return new Vec2(-1, 0);
    case 1:
      return new Vec2(1, 0);
    case 2:
      return new Vec2(0, -1);
    case 3:
      return new Vec2(0, 1);
  }
}

function directionToString(dir) {
  switch(dir) {
    case DIRECTION.LEFT:
      return "LEFT";
    case DIRECTION.RIGHT:
      return "RIGHT";
    case DIRECTION.UP:
      return "UP";
    case DIRECTION.DOWN:
      return "DOWN";
  }
}

function canMoveTowardsGridPoint(currentGridPoint, directionVec, level) {
  const blockedDirections = nodeBlockedDirections(currentGridPoint, level);
  if (directionVec.x != 0) {
    switch (directionVec.x) {
      case -1:
        return (blockedDirections.indexOf(G.DIRECTION.LEFT) == -1);
      case 1:
        return (blockedDirections.indexOf(G.DIRECTION.RIGHT) == -1);
    }
  } else if (directionVec.y != 0) {
    switch (directionVec.y) {
      case -1:
        return (blockedDirections.indexOf(G.DIRECTION.UP) == -1);
      case 1:
        return (blockedDirections.indexOf(G.DIRECTION.DOWN) == -1);
    }
  } else {
    // we're not moving so yay!
    return true;
  }
}

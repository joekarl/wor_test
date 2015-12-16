G = {
  LEVEL_WIDTH: 9,
  LEVEL_HEIGHT: 7,
  PADDING: 30,
  LASER_THICKNESS: 4,
  LASER_LENGTH: 20,
  DIRECTION: {
    LEFT:  0,
    RIGHT: 1,
    UP:    2,
    DOWN:  3
  },
  PLAYER_MARGIN: 20,
  MAX_LIVES: 3,
  HEIGHT: 600,
  WIDTH: 800,
  WARP_TIMEOUT: 10000,
  DYING_TIMEOUT: 2000,
  WARP_Y: 2,
  KEY_BINDINGS: {
    UP:     38,
    DOWN:   40,
    LEFT:   37,
    RIGHT:  39,
    SPACE:  32
  },
  ENTITY_TYPES: {
    UNKNOWN: -1,
    PLAYER:   0,
    ENEMY:    1,
    DPAD:     2,
    LASER:    3,
  },
  GAME_STATES: {
    GAMEPLAY:    0,
    MENU:        1,
    HIGH_SCORES: 2,
    GAME_OVER:   3,
  }
};

G.GRID_WIDTH = (G.WIDTH /*canvas size*/ - 60 /*padding*/) / G.LEVEL_WIDTH;
G.GRID_HEIGHT = (G.HEIGHT /*canvas size*/ - 60 /*padding*/) / G.LEVEL_HEIGHT;
G.HALF_GRID_WIDTH = G.GRID_WIDTH / 2.0;
G.HALF_GRID_HEIGHT = G.GRID_HEIGHT / 2.0;
G.PLAYER_VEL = 0.02 * G.GRID_WIDTH;
G.LASER_VEL = 0.12 * G.GRID_WIDTH;

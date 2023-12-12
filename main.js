// Constants for key codes and game dimensions
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 800;

// Initial game state
const STATE = {
  x_pos: 0,
  y_pos: 0,
  move_right: false,
  move_left: false,
  shoot: false,
  lasers: [],
  enemyLasers: [],
  enemies: [],
  spaceship_width: 50,
  enemy_width: 50,
  cooldown: 0,
  enemy_columns: 8,
  enemy_rows: 5,
  enemy_cooldown: 0,
  gameOver: false,
};
let mouseX, mouseY;

// General purpose functions

// Set position of an element
function setPosition($element, x, y) {
  const element = $element instanceof jQuery ? $element.get(0) : $element;

  if (element) {
    element.style.transform = `translate(${x}px, ${y}px)`;
  } else {
    console.error("Invalid element");
  }
}

// Set size of an element
function setSize($element, width) {
  const element = $element instanceof jQuery ? $element.get(0) : $element;

  if (element) {
    $(element).css({
      width: `${width}px`,
      height: "auto",
    });
  } else {
    console.error("Invalid element");
  }
}

// Ensure a value is within bounds
function bound(x) {
  if (x >= GAME_WIDTH - STATE.spaceship_width) {
    STATE.x_pos = GAME_WIDTH - STATE.spaceship_width;
    return GAME_WIDTH - STATE.spaceship_width;
  }
  if (x <= 0) {
    STATE.x_pos = 0;
    return 0;
  } else {
    return x;
  }
}

// Check for collision between two rectangles
function collideRect(rect1, rect2) {
  return !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );
}

// Enemy

// Create an enemy at a specific position
// Create a new enemy at the specified position
function createEnemy($container, x, y) {
  // Create a new image element for the enemy
  const $enemy = $("<img>")
    .attr("src", "enemyship.png") // Set the image source
    .addClass("enemy"); // Add the 'enemy' class for styling
  $container.append($enemy); // Append the enemy image to the container

  // Set a random cooldown for shooting enemy lasers
  const enemy_cooldown = Math.floor(Math.random() * 100);

  // Create an enemy object to store its properties
  const enemy = { x, y, $enemy, enemy_cooldown };

  // Add the new enemy to the list of enemies in the game state
  STATE.enemies.push(enemy);

  // Set the size and position of the enemy
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x, y);
}

// Track time for enemy movement
let startTime = Date.now();

// Update the position of enemies
function updateEnemies($container) {
  if (STATE.gameOver) {
    // Don't move enemies if the game is over
    return;
  }

  const currentTime = Date.now();
  const timeElapsed = currentTime - startTime;
  const ticks = (timeElapsed - (timeElapsed % 1000)) / 1000;
  const dx = ticks % 14;
  const dy = (ticks - dx) / 14;
  if (dy > 12) {
    STATE.gameOver = true;
    return;
  }
  const enemies = STATE.enemies;
  for (const element of enemies) {
    const enemy = element;
    let a = enemy.x + dx * 40;
    let b = enemy.y + dy * 30;
    setPosition(enemy.$enemy, a, b);
    enemy.cooldown = Math.random() * 100 + 1;
    if (enemy.enemy_cooldown == 0) {
      createEnemyLaser($container, a, b);
      enemy.enemy_cooldown = Math.floor(Math.random() * 50) + 100;
    }
    enemy.enemy_cooldown -= 0.5;
  }
}

// Player

// Create the player at the initial position
function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = $("<img>").attr("src", "myship.png").addClass("player");
  $container.append($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

let isPlayerLaser = false;

// Update the player's position and handle shooting
function updatePlayer() {
  if (STATE.move_left) {
    STATE.x_pos -= 3;
  }
  if (STATE.move_right) {
    STATE.x_pos += 3;
  }
  if (STATE.shoot && STATE.cooldown == 0 && STATE.lasers.length === 0) {
    createLaser(
      $container,
      STATE.x_pos - STATE.spaceship_width / 2,
      STATE.y_pos
    );
    STATE.cooldown = 30;
  }
  const $player = $(".player")[0];
  setPosition($player, bound(STATE.x_pos), STATE.y_pos - 10);
  if (STATE.cooldown > 0) {
    STATE.cooldown -= 0.5;
  }
}

// Player Laser

// Create a laser at a specific position
function createLaser($container, x, y) {
  const $laser = $("<img>").attr("src", "laser.png").addClass("laser");

  $container.append($laser);
  const laser = { x, y, $laser };
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}

// Update the position of player lasers and handle collisions
function updateLaser($container) {
  const lasers = STATE.lasers;
  for (const element of lasers) {
    const laser = element;
    laser.y -= 2;
    if (laser.y < 0) {
      deleteLaser(lasers, laser, laser.$laser);
    }
    setPosition(laser.$laser, laser.x, laser.y);
    const laser_rectangle = laser.$laser[0].getBoundingClientRect();
    const enemies = STATE.enemies;
    for (const element of enemies) {
      const enemy = element;
      const enemy_rectangle = enemy.$enemy[0].getBoundingClientRect();
      if (collideRect(enemy_rectangle, laser_rectangle)) {
        deleteLaser(lasers, laser, laser.$laser);
        const index = enemies.indexOf(enemy);
        enemies.splice(index, 1);
        enemy.$enemy.remove();
      }
    }
  }
}

// Enemy Laser

// Create an enemy laser at a specific position
function createEnemyLaser($container, x, y) {
  const $enemyLaser = $("<img>")
    .attr("src", "enemyLaser.png")
    .addClass("enemyLaser");
  $container.append($enemyLaser);
  const enemyLaser = { x, y, $enemyLaser };
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

// Update the position of enemy lasers and handle collisions
function updateEnemyLaser($container) {
  const enemyLasers = STATE.enemyLasers;
  for (const element of enemyLasers) {
    const enemyLaser = element;
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle =
      enemyLaser.$enemyLaser[0].getBoundingClientRect();
    const spaceship_rectangle = $(".player").get(0)?.getBoundingClientRect();

    if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
      STATE.gameOver = true;
    }
    setPosition(
      enemyLaser.$enemyLaser,
      enemyLaser.x + STATE.enemy_width / 2,
      enemyLaser.y + 15
    );
  }
}

// Delete Laser

// Remove a laser from the game
function deleteLaser(lasers, laser, $laser) {
  const index = lasers.indexOf(laser);
  lasers.splice(index, 1);
  $laser.remove();
}

// Key Presses

// Event handler for keydown events
function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;
  }
}

// Event handler for keyup events
function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  }
}

// Main Update Function

// Update the game state and animations
function update() {
  updatePlayer();
  updateEnemies($container);
  updateLaser($container);
  updateEnemyLaser($container);

  window.requestAnimationFrame(update);

  if (STATE.gameOver) {
    $(".lose").css("display", "block");
  }
  if (STATE.enemies.length == 0) {
    $(".win").css("display", "block");
  }
}

// Create initial set of enemies
function createEnemies($container) {
  for (let i = 0; i < STATE.enemy_rows; i++) {
    for (let j = 0; j < STATE.enemy_columns; j++) {
      createEnemy($container, j * 80, i * 80);
    }
  }
}

// Initialize the Game

// Set up player, enemies, and event listeners
const $container = $(".main");
createPlayer($container);
createEnemies($container);

// Key Press Event Listeners
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);

// Start the game loop
update();

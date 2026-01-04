const classes = [
  {
    id: "elementalist",
    name: "Elementalist",
    desc: "Master of lightning and fire. Ranged bursts.",
    color: "cyan",
    stats: { hp: 120, damage: 8, speed: 2.2, range: 80 }
  },
  {
    id: "blood_knight",
    name: "Blood Knight",
    desc: "Leeches life, heavy hits.",
    color: "red",
    stats: { hp: 180, damage: 12, speed: 1.5, range: 40 }
  },
  {
    id: "shadow_warden",
    name: "Shadow Warden",
    desc: "Fast and elusive assassin.",
    color: "purple",
    stats: { hp: 100, damage: 10, speed: 2.8, range: 60 }
  }
];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const classSelectionEl = document.getElementById("class-selection");
const startBtn = document.getElementById("start");
const statsEl = document.getElementById("stats");
const logEl = document.getElementById("log");

let selectedClass = classes[0];
let gameRunning = false;
let player = null;
let enemies = [];
let keys = {};
let lastTime = 0;

function log(msg) {
  const p = document.createElement("div");
  p.textContent = msg;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function renderClassSelection() {
  classSelectionEl.innerHTML = "";
  classes.forEach((c) => {
    const card = document.createElement("div");
    card.className = "class-card" + (selectedClass.id === c.id ? " selected" : "");
    card.innerHTML = `<strong>${c.name}</strong><br>${c.desc}<br>HP: ${c.stats.hp} DMG: ${c.stats.damage}`;
    card.onclick = () => {
      selectedClass = c;
      renderClassSelection();
    };
    classSelectionEl.appendChild(card);
  });
}

function updateStats() {
  if (!player) return;
  statsEl.textContent = `Class: ${selectedClass.name} | HP: ${Math.max(0, Math.floor(player.hp))} | Enemies left: ${enemies.length}`;
}

function spawnEnemies(count = 6) {
  enemies = [];
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      hp: 40 + Math.random() * 30,
      speed: 1 + Math.random() * 0.6,
      color: "#7f5",
      radius: 12
    });
  }
}

function startGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    hp: selectedClass.stats.hp,
    damage: selectedClass.stats.damage,
    speed: selectedClass.stats.speed,
    range: selectedClass.stats.range,
    color: selectedClass.color,
    radius: 14
  };
  spawnEnemies();
  gameRunning = true;
  lastTime = performance.now();
  log(`Started as ${selectedClass.name}`);
  window.requestAnimationFrame(loop);
}

function handleInput(dt) {
  if (!player) return;
  const sp = player.speed * dt * 0.1;
  if (keys["w"]) player.y -= sp;
  if (keys["s"]) player.y += sp;
  if (keys["a"]) player.x -= sp;
  if (keys["d"]) player.x += sp;
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function attack() {
  if (!player) return;
  let target = null;
  let minDist = Infinity;
  for (const e of enemies) {
    const d = distance(player, e);
    if (d < minDist) {
      minDist = d;
      target = e;
    }
  }
  if (target && minDist <= player.range + target.radius) {
    target.hp -= player.damage;
    if (target.hp <= 0) {
      enemies = enemies.filter((en) => en !== target);
      log("Enemy slain!");
    }
  }
}

function enemyAI(dt) {
  if (!player) return;
  const spMult = dt * 0.05;
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    e.x += (dx / len) * e.speed * spMult;
    e.y += (dy / len) * e.speed * spMult;
    // damage player on contact
    if (distance(player, e) < player.radius + e.radius) {
      player.hp -= 0.2 * dt * 0.06; // slow drain
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw player
  if (player) {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // draw enemies
  enemies.forEach((e) => {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    // hp bar
    ctx.fillStyle = "#222";
    ctx.fillRect(e.x - 12, e.y - e.radius - 10, 24, 4);
    ctx.fillStyle = "#0f0";
    ctx.fillRect(e.x - 12, e.y - e.radius - 10, Math.max(0, (e.hp / 70) * 24), 4);
  });
}

function checkWinLose() {
  if (!player) return;
  if (player.hp <= 0) {
    gameRunning = false;
    log("You have fallen. Game Over.");
  } else if (enemies.length === 0) {
    gameRunning = false;
    log("All enemies cleared! Victory!");
  }
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameRunning) return;

  handleInput(dt);
  enemyAI(dt);
  draw();
  checkWinLose();
  updateStats();
  window.requestAnimationFrame(loop);
}

renderClassSelection();
updateStats();

startBtn.onclick = () => {
  if (gameRunning) return;
  startGame();
};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " " || e.key.toLowerCase() === "k") {
    attack();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

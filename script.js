
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

/* =========================
   ELEMENTOS
========================= */

const menu = document.getElementById("menu");
const gameOver = document.getElementById("gameOver");
const levelUp = document.getElementById("levelUp");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const healthBar = document.getElementById("healthBar");
const xpBar = document.getElementById("xpBar");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const levelText = document.getElementById("level");
const waveText = document.getElementById("wave");

const finalScore = document.getElementById("finalScore");
const finalCoins = document.getElementById("finalCoins");
const finalLevel = document.getElementById("finalLevel");
const finalTime = document.getElementById("finalTime");

const upgradeOptions = document.getElementById("upgradeOptions");

/* =========================
   CONTROLES
========================= */

const keys = {};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        dash();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    down: false
};

canvas.addEventListener("mousemove", e => {

    mouse.x = e.clientX;
    mouse.y = e.clientY;

});

canvas.addEventListener("mousedown", () => {
    mouse.down = true;
});

window.addEventListener("mouseup", () => {
    mouse.down = false;
});

/* =========================
   ESTADO DO JOGO
========================= */

let running = false;

let score = 0;
let coins = 0;

let level = 1;
let xp = 0;
let xpNeeded = 100;

let wave = 1;

let startTime = 0;

let lastTime = 0;

let spawnTimer = 0;
let shootTimer = 0;
let waveTimer = 0;

let shake = 0;

/* =========================
   JOGADOR
========================= */

const player = {

    x: canvas.width / 2,
    y: canvas.height / 2,

    radius: 20,

    speed: 300,

    health: 100,
    maxHealth: 100,

    damage: 25,

    fireRate: 220,

    bulletSpeed: 700,

    bullets: 1,

    dashPower: 600,

    dashCooldown: 1000,
    lastDash: 0

};

/* =========================
   ARRAYS
========================= */

let enemies = [];
let bullets = [];
let particles = [];
let coinsObjects = [];

/* =========================
   SONS
========================= */

const audio = new AudioContext();

function beep(frequency, duration = 0.05, volume = 0.04) {

    try {

        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.frequency.value = frequency;

        gain.gain.value = volume;

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.start();

        oscillator.stop(
            audio.currentTime + duration
        );

    } catch {}

}

/* =========================
   INICIAR
========================= */

function startGame() {

    if (audio.state === "suspended") {
        audio.resume();
    }

    running = true;

    score = 0;
    coins = 0;

    level = 1;
    xp = 0;
    xpNeeded = 100;

    wave = 1;

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    player.health = player.maxHealth;

    enemies = [];
    bullets = [];
    particles = [];
    coinsObjects = [];

    startTime = Date.now();

    menu.classList.add("hidden");
    gameOver.classList.add("hidden");

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}

/* =========================
   GAME OVER
========================= */

function endGame() {

    running = false;

    const time = Math.floor(
        (Date.now() - startTime) / 1000
    );

    finalScore.textContent = score;
    finalCoins.textContent = coins;
    finalLevel.textContent = level;
    finalTime.textContent = time;

    gameOver.classList.remove("hidden");

}

/* =========================
   MOVIMENTO
========================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(
            dx * dx + dy * dy
        );

        dx /= length;
        dy /= length;

        player.x += dx * player.speed * dt;
        player.y += dy * player.speed * dt;
    }

    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );

}

/* =========================
   DASH
========================= */

function dash() {

    if (!running) return;

    const now = Date.now();

    if (now - player.lastDash < player.dashCooldown) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    if (dx === 0 && dy === 0) return;

    const length = Math.sqrt(
        dx * dx + dy * dy
    );

    dx /= length;
    dy /= length;

    player.x += dx * player.dashPower;
    player.y += dy * player.dashPower;

    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );

    player.lastDash = now;

    createParticles(
        player.x,
        player.y,
        20,
        "#00eaff"
    );

    beep(600, 0.1, 0.08);

}

/* =========================
   TIRO
========================= */

function shoot() {

    const now = Date.now();

    if (
        !mouse.down ||
        now - shootTimer < player.fireRate
    ) {
        return;
    }

    shootTimer = now;

    const angle = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );

    for (let i = 0; i < player.bullets; i++) {

        const spread =
            (i - (player.bullets - 1) / 2) * 0.12;

        const a = angle + spread;

        bullets.push({

            x: player.x,
            y: player.y,

            vx: Math.cos(a) * player.bulletSpeed,
            vy: Math.sin(a) * player.bulletSpeed,

            radius: 5,

            damage: player.damage

        });

    }

    createParticles(
        player.x + Math.cos(angle) * 20,
        player.y + Math.sin(angle) * 20,
        5,
        "#ffff00"
    );

    beep(300, 0.04, 0.03);

}

/* =========================
   BALAS
========================= */

function updateBullets(dt) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const b = bullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (
            b.x < -50 ||
            b.x > canvas.width + 50 ||
            b.y < -50 ||
            b.y > canvas.height + 50
        ) {
            bullets.splice(i, 1);
        }

    }

}

/* =========================
   INIMIGOS
========================= */

function spawnEnemy() {

    const side = Math.floor(
        Math.random() * 4
    );

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -50;
    }

    if (side === 1) {
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
    }

    if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
    }

    if (side === 3) {
        x = -50;
        y = Math.random() * canvas.height;
    }

    const bossChance = Math.random();

    let type = "normal";

    if (wave >= 3 && bossChance < 0.12) {
        type = "tank";
    }

    if (wave >= 5 && bossChance < 0.06) {
        type = "fast";
    }

    let enemy;

    if (type === "tank") {

        enemy = {

            x,
            y,

            radius: 30,

            speed: 55 + wave * 2,

            health: 150 + wave * 30,

            maxHealth: 150 + wave * 30,

            damage: 20,

            type

        };

    } else if (type === "fast") {

        enemy = {

            x,
            y,

            radius: 14,

            speed: 170 + wave * 4,

            health: 40 + wave * 8,

            maxHealth: 40 + wave * 8,

            damage: 15,

            type

        };

    } else {

        enemy = {

            x,
            y,

            radius: 18,

            speed: 80 + wave * 4,

            health: 60 + wave * 12,

            maxHealth: 60 + wave * 12,

            damage: 10,

            type

        };

    }

    enemies.push(enemy);

}

/* =========================
   UPDATE INIMIGOS
========================= */

function updateEnemies(dt) {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (distance > 1) {

            enemy.x +=
                (dx / distance) *
                enemy.speed *
                dt;

            enemy.y +=
                (dy / distance) *
                enemy.speed *
                dt;

        }

        /* COLISÃO COM JOGADOR */

        if (
            distance <
            player.radius + enemy.radius
        ) {

            player.health -=
                enemy.damage * dt;

            shake = 5;

            if (player.health <= 0) {
                endGame();
            }

        }

    }

}

/* =========================
   COLISÃO BALAS
========================= */

function bulletCollisions() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const b = bullets[i];

        for (let j = enemies.length - 1; j >= 0; j--) {

            const enemy = enemies[j];

            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (
                distance <
                b.radius + enemy.radius
            ) {

                enemy.health -= b.damage;

                bullets.splice(i, 1);

                createParticles(
                    enemy.x,
                    enemy.y,
                    8,
                    "#ff4444"
                );

                if (enemy.health <= 0) {

                    score +=
                        enemy.type === "tank"
                            ? 100
                            : 20;

                    addXP(
                        enemy.type === "tank"
                            ? 40
                            : 15
                    );

                    if (Math.random() < 0.35) {

                        coinsObjects.push({

                            x: enemy.x,
                            y: enemy.y,

                            radius: 8

                        });

                    }

                    enemies.splice(j, 1);

                    beep(100, 0.06, 0.05);

                }

                break;
            }

        }

    }

}

/* =========================
   MOEDAS
========================= */

function updateCoins() {

    for (let i = coinsObjects.length - 1; i >= 0; i--) {

        const coin = coinsObjects[i];

        const dx = player.x - coin.x;
        const dy = player.y - coin.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (
            distance <
            player.radius + coin.radius
        ) {

            coins++;

            score += 10;

            coinsObjects.splice(i, 1);

            createParticles(
                coin.x,
                coin.y,
                10,
                "#ffd700"
            );

            beep(800, 0.08, 0.05);

        }

    }

}

/* =========================
   XP
========================= */

function addXP(amount) {

    xp += amount;

    if (xp >= xpNeeded) {

        xp -= xpNeeded;

        level++;

        xpNeeded =
            Math.floor(
                xpNeeded * 1.35
            );

        showLevelUp();

    }

}

/* =========================
   LEVEL UP
========================= */

function showLevelUp() {

    running = false;

    levelUp.classList.remove("hidden");

    upgradeOptions.innerHTML = "";

    const upgrades = [

        {
            icon: "⚔️",
            name: "Dano",
            description: "+10 de dano",
            action: () => {
                player.damage += 10;
            }
        },

        {
            icon: "❤️",
            name: "Vida",
            description: "+25 de vida máxima",
            action: () => {

                player.maxHealth += 25;
                player.health += 25;

            }
        },

        {
            icon: "⚡",
            name: "Velocidade",
            description: "+35 de velocidade",
            action: () => {
                player.speed += 35;
            }
        },

        {
            icon: "🔫",
            name: "Cadência",
            description: "Atira mais rápido",
            action: () => {
                player.fireRate =
                    Math.max(
                        60,
                        player.fireRate - 30
                    );
            }
        },

        {
            icon: "💥",
            name: "Multishot",
            description: "+1 projétil",
            action: () => {
                player.bullets++;
            }
        },

        {
            icon: "🚀",
            name: "Dash",
            description: "Dash mais forte",
            action: () => {
                player.dashPower += 150;
            }
        }

    ];

    upgrades
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .forEach(upgrade => {

            const div =
                document.createElement("div");

            div.className = "upgrade";

            div.innerHTML = `

                <div class="upgrade-icon">
                    ${upgrade.icon}
                </div>

                <h3>
                    ${upgrade.name}
                </h3>

                <p>
                    ${upgrade.description}
                </p>

            `;

            div.onclick = () => {

                upgrade.action();

                levelUp.classList.add("hidden");

                running = true;

                lastTime = performance.now();

                requestAnimationFrame(gameLoop);

            };

            upgradeOptions.appendChild(div);

        });

}

/* =========================
   PARTÍCULAS
========================= */

function createParticles(
    x,
    y,
    amount,
    color
) {

    for (let i = 0; i < amount; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            Math.random() *
            150 +
            50;

        particles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life: 0.5,

            color

        });

    }

}

/* =========================
   UPDATE PARTÍCULAS
========================= */

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }

    }

}

/* =========================
   ONDA
========================= */

function updateWave(dt) {

    waveTimer += dt;

    if (waveTimer >= 20) {

        wave++;

        waveTimer = 0;

        createParticles(
            player.x,
            player.y,
            30,
            "#7c4dff"
        );

        beep(150, 0.2, 0.08);

    }

}

/* =========================
   SPAWN
========================= */

function updateSpawner(dt) {

    spawnTimer += dt;

    const spawnDelay =
        Math.max(
            0.25,
            1.2 - wave * 0.06
        );

    if (spawnTimer >= spawnDelay) {

        spawnTimer = 0;

        spawnEnemy();

        if (Math.random() < wave * 0.02) {
            spawnEnemy();
        }

    }

}

/* =========================
   DESENHAR FUNDO
========================= */

function drawBackground() {

    ctx.fillStyle = "#05050d";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const gridSize = 50;

    ctx.strokeStyle =
        "rgba(100,100,180,0.08)";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);

        ctx.stroke();

    }

    for (
        let y = 0;
        y < canvas.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();

    }

}

/* =========================
   DESENHAR JOGADOR
========================= */

function drawPlayer() {

    const angle = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(angle);

    /* AURA */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius + 7,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,220,255,0.12)";

    ctx.fill();

    /* CORPO */

    ctx.beginPath();

    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -16);
    ctx.lineTo(-10, 16);

    ctx.closePath();

    ctx.fillStyle = "#00eaff";

    ctx.fill();

    ctx.strokeStyle = "#ffffff";

    ctx.stroke();

    /* ARMA */

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        5,
        -4,
        30,
        8
    );

    ctx.restore();

}

/* =========================
   DESENHAR INIMIGOS
========================= */

function drawEnemies() {

    enemies.forEach(enemy => {

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        if (enemy.type === "tank") {

            ctx.fillStyle = "#9c27b0";

        } else if (enemy.type === "fast") {

            ctx.fillStyle = "#ff9800";

        } else {

            ctx.fillStyle = "#e53935";

        }

        ctx.fill();

        ctx.strokeStyle = "#ffffff";

        ctx.lineWidth = 2;

        ctx.stroke();

        /* BARRA DE VIDA */

        const width =
            enemy.radius * 2;

        const health =
            enemy.health /
            enemy.maxHealth;

        ctx.fillStyle = "#222";

        ctx.fillRect(
            enemy.x - width / 2,
            enemy.y - enemy.radius - 10,
            width,
            5
        );

        ctx.fillStyle = "#4caf50";

        ctx.fillRect(
            enemy.x - width / 2,
            enemy.y - enemy.radius - 10,
            width * health,
            5
        );

    });

}

/* =========================
   DESENHAR BALAS
========================= */

function drawBullets() {

    bullets.forEach(b => {

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            b.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffff00";

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffff00";

        ctx.fill();

        ctx.shadowBlur = 0;

    });

}

/* =========================
   DESENHAR MOEDAS
========================= */

function drawCoins() {

    coinsObjects.forEach(coin => {

        ctx.beginPath();

        ctx.arc(
            coin.x,
            coin.y,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffd700";

        ctx.fill();

        ctx.strokeStyle = "#fff";

        ctx.stroke();

    });

}

/* =========================
   DESENHAR PARTÍCULAS
========================= */

function drawParticles() {

    particles.forEach(p => {

        ctx.globalAlpha =
            Math.max(0, p.life * 2);

        ctx.fillStyle = p.color;

        ctx.fillRect(
            p.x,
            p.y,
            4,
            4
        );

    });

    ctx.globalAlpha = 1;

}

/* =========================
   HUD
========================= */

function updateHUD() {

    healthBar.style.width =
        Math.max(
            0,
            player.health /
            player.maxHealth *
            100
        ) + "%";

    xpBar.style.width =
        Math.min(
            100,
            xp /
            xpNeeded *
            100
        ) + "%";

    scoreText.textContent = score;
    coinsText.textContent = coins;
    levelText.textContent = level;
    waveText.textContent = wave;

}

/* =========================
   LOOP PRINCIPAL
========================= */

function gameLoop(time) {

    if (!running) return;

    const dt =
        Math.min(
            (time - lastTime) / 1000,
            0.05
        );

    lastTime = time;

    updatePlayer(dt);

    shoot();

    updateBullets(dt);

    updateEnemies(dt);

    bulletCollisions();

    updateCoins();

    updateParticles(dt);

    updateSpawner(dt);

    updateWave(dt);

    updateHUD();

    draw();

    requestAnimationFrame(gameLoop);

}

/* =========================
   DESENHAR
========================= */

function draw() {

    ctx.save();

    if (shake > 0) {

        ctx.translate(
            Math.random() * shake - shake / 2,
            Math.random() * shake - shake / 2
        );

        shake *= 0.9;

        if (shake < 0.1) {
            shake = 0;
        }

    }

    drawBackground();

    drawCoins();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();

    ctx.restore();

}

/* =========================
   BOTÕES
========================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);

/* =========================
   COMEÇAR
========================= */

draw();


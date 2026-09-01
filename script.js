
/* =========================================================
   SHADOW SURVIVOR
   VERSION 2.0
========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================================
   UI
========================================================= */

const menu =
    document.getElementById("menu");

const gameUI =
    document.getElementById("gameUI");

const levelUp =
    document.getElementById("levelUp");

const gameOver =
    document.getElementById("gameOver");

const howToPlay =
    document.getElementById("howToPlay");

const bossUI =
    document.getElementById("bossUI");

const mobileControls =
    document.getElementById("mobileControls");


/* =========================================================
   BOTÕES
========================================================= */

document
    .getElementById("startButton")
    .onclick = startGame;


document
    .getElementById("restartButton")
    .onclick = startGame;


document
    .getElementById("menuButton")
    .onclick = returnToMenu;


document
    .getElementById("howButton")
    .onclick = () => {

        howToPlay.classList.remove(
            "hidden"
        );

    };


document
    .getElementById("closeHow")
    .onclick = () => {

        howToPlay.classList.add(
            "hidden"
        );

    };


/* =========================================================
   MELHOR SCORE
========================================================= */

let bestScore =
    Number(
        localStorage.getItem(
            "shadowSurvivorBest"
        )
    ) || 0;


document
    .getElementById("menuBestScore")
    .textContent = bestScore;


/* =========================================================
   CONTROLES
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    event => {

        keys[
            event.key.toLowerCase()
        ] = true;


        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            dash();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


/* =========================================================
   MOUSE
========================================================= */

const mouse = {

    x: canvas.width / 2,

    y: canvas.height / 2,

    down: false

};


canvas.addEventListener(
    "mousemove",
    event => {

        mouse.x =
            event.clientX;

        mouse.y =
            event.clientY;

    }
);


canvas.addEventListener(
    "mousedown",
    () => {

        mouse.down = true;

    }
);


window.addEventListener(
    "mouseup",
    () => {

        mouse.down = false;

    }
);


/* =========================================================
   ÁUDIO
========================================================= */

let audioContext;


function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }

}


function sound(
    frequency,
    duration = 0.05,
    volume = 0.025,
    type = "square"
) {

    if (!audioContext)
        return;


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type =
        type;

    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


/* =========================================================
   ESTADO
========================================================= */

let running = false;

let score = 0;

let coins = 0;

let wave = 1;

let level = 1;

let xp = 0;

let xpNeeded = 100;

let startTime = 0;

let lastFrame = 0;

let waveTimer = 0;

let spawnTimer = 0;

let shootTimer = 0;

let shake = 0;


/* =========================================================
   JOGADOR
========================================================= */

const player = {

    x: 0,

    y: 0,

    radius: 19,

    speed: 300,

    health: 100,

    maxHealth: 100,

    damage: 25,

    fireRate: 180,

    bulletSpeed: 750,

    bullets: 1,

    dashPower: 170,

    dashCooldown: 1000,

    lastDash: 0,

    shield: 0,

    regen: 0

};


/* =========================================================
   ARRAYS
========================================================= */

let enemies = [];

let bullets = [];

let particles = [];

let coinsObjects = [];

let floatingTexts = [];


/* =========================================================
   START
========================================================= */

function startGame() {

    initAudio();


    if (
        audioContext &&
        audioContext.state === "suspended"
    ) {

        audioContext.resume();

    }


    running = true;


    score = 0;

    coins = 0;

    wave = 1;

    level = 1;

    xp = 0;

    xpNeeded = 100;


    player.x =
        canvas.width / 2;

    player.y =
        canvas.height / 2;

    player.health =
        player.maxHealth;


    player.damage = 25;

    player.fireRate = 180;

    player.bullets = 1;

    player.speed = 300;

    player.shield = 0;

    player.regen = 0;


    enemies = [];

    bullets = [];

    particles = [];

    coinsObjects = [];

    floatingTexts = [];


    waveTimer = 0;

    spawnTimer = 0;


    startTime =
        Date.now();


    menu.classList.add(
        "hidden"
    );

    gameOver.classList.add(
        "hidden"
    );

    gameUI.classList.remove(
        "hidden"
    );


    mobileControls.classList.toggle(
        "hidden",
        window.innerWidth > 700
    );


    lastFrame =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   MENU
========================================================= */

function returnToMenu() {

    running = false;

    gameOver.classList.add(
        "hidden"
    );

    gameUI.classList.add(
        "hidden"
    );

    mobileControls.classList.add(
        "hidden"
    );

    menu.classList.remove(
        "hidden"
    );

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(dt) {

    let dx = 0;

    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    )
        dy--;


    if (
        keys["s"] ||
        keys["arrowdown"]
    )
        dy++;


    if (
        keys["a"] ||
        keys["arrowleft"]
    )
        dx--;


    if (
        keys["d"] ||
        keys["arrowright"]
    )
        dx++;


    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(dx, dy);


        dx /= length;

        dy /= length;


        player.x +=
            dx *
            player.speed *
            dt;


        player.y +=
            dy *
            player.speed *
            dt;


        createMovementParticles();

    }


    player.x = Math.max(
        player.radius,
        Math.min(
            canvas.width -
            player.radius,
            player.x
        )
    );


    player.y = Math.max(
        player.radius,
        Math.min(
            canvas.height -
            player.radius,
            player.y
        )
    );


    if (
        player.regen > 0 &&
        player.health <
        player.maxHealth
    ) {

        player.health +=
            player.regen *
            dt;

    }

}


/* =========================================================
   DASH
========================================================= */

function dash() {

    if (!running)
        return;


    const now =
        Date.now();


    if (
        now -
        player.lastDash <
        player.dashCooldown
    )
        return;


    let dx = 0;

    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    )
        dy--;


    if (
        keys["s"] ||
        keys["arrowdown"]
    )
        dy++;


    if (
        keys["a"] ||
        keys["arrowleft"]
    )
        dx--;


    if (
        keys["d"] ||
        keys["arrowright"]
    )
        dx++;


    if (
        dx === 0 &&
        dy === 0
    )
        return;


    const length =
        Math.hypot(dx, dy);


    dx /= length;

    dy /= length;


    for (
        let i = 0;
        i < 15;
        i++
    ) {

        createParticle(
            player.x,
            player.y,
            "#00f7ff"
        );

    }


    player.x +=
        dx *
        player.dashPower;


    player.y +=
        dy *
        player.dashPower;


    player.x =
        Math.max(
            player.radius,
            Math.min(
                canvas.width -
                player.radius,
                player.x
            )
        );


    player.y =
        Math.max(
            player.radius,
            Math.min(
                canvas.height -
                player.radius,
                player.y
            )
        );


    player.lastDash =
        now;


    shake = 8;


    sound(
        600,
        0.12,
        0.04,
        "sawtooth"
    );

}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    const now =
        Date.now();


    if (
        !mouse.down ||
        now -
        shootTimer <
        player.fireRate
    )
        return;


    shootTimer =
        now;


    const angle =
        Math.atan2(
            mouse.y -
            player.y,
            mouse.x -
            player.x
        );


    for (
        let i = 0;
        i < player.bullets;
        i++
    ) {

        const spread =
            (
                i -
                (player.bullets - 1) / 2
            ) *
            0.12;


        const a =
            angle +
            spread;


        bullets.push({

            x: player.x,

            y: player.y,

            vx:
                Math.cos(a) *
                player.bulletSpeed,

            vy:
                Math.sin(a) *
                player.bulletSpeed,

            radius: 5,

            damage:
                player.damage,

            life: 1.5

        });

    }


    sound(
        350,
        0.035,
        0.02
    );

}


/* =========================================================
   BULLETS
========================================================= */

function updateBullets(dt) {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx *
            dt;


        bullet.y +=
            bullet.vy *
            dt;


        bullet.life -=
            dt;


        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x >
                canvas.width + 100 ||
            bullet.y < -100 ||
            bullet.y >
                canvas.height + 100
        ) {

            bullets.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   SPAWN
========================================================= */

function spawnEnemy() {

    const side =
        Math.floor(
            Math.random() * 4
        );


    let x;

    let y;


    if (side === 0) {

        x =
            Math.random() *
            canvas.width;

        y = -60;

    }


    if (side === 1) {

        x =
            canvas.width + 60;

        y =
            Math.random() *
            canvas.height;

    }


    if (side === 2) {

        x =
            Math.random() *
            canvas.width;

        y =
            canvas.height + 60;

    }


    if (side === 3) {

        x = -60;

        y =
            Math.random() *
            canvas.height;

    }


    const roll =
        Math.random();


    let enemy;


    /* BOSS */

    if (
        wave % 5 === 0 &&
        roll < 0.10
    ) {

        enemy = {

            type: "boss",

            x,
            y,

            radius: 45,

            speed:
                45 + wave,

            health:
                1000 +
                wave * 180,

            maxHealth:
                1000 +
                wave * 180,

            damage: 35

        };

    }


    /* TANK */

    else if (
        wave >= 3 &&
        roll < 0.22
    ) {

        enemy = {

            type: "tank",

            x,
            y,

            radius: 28,

            speed:
                55 +
                wave * 2,

            health:
                180 +
                wave * 25,

            maxHealth:
                180 +
                wave * 25,

            damage: 22

        };

    }


    /* FAST */

    else if (
        wave >= 2 &&
        roll < 0.45
    ) {

        enemy = {

            type: "fast",

            x,
            y,

            radius: 13,

            speed:
                150 +
                wave * 5,

            health:
                45 +
                wave * 8,

            maxHealth:
                45 +
                wave * 8,

            damage: 15

        };

    }


    /* NORMAL */

    else {

        enemy = {

            type: "normal",

            x,
            y,

            radius: 18,

            speed:
                75 +
                wave * 4,

            health:
                65 +
                wave * 12,

            maxHealth:
                65 +
                wave * 12,

            damage: 12

        };

    }


    enemies.push(
        enemy
    );


    if (
        enemy.type === "boss"
    ) {

        bossUI.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ENEMY UPDATE
========================================================= */

function updateEnemies(dt) {

    for (
        let i =
            enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const dx =
            player.x -
            enemy.x;


        const dy =
            player.y -
            enemy.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance > 1
        ) {

            enemy.x +=
                dx /
                distance *
                enemy.speed *
                dt;


            enemy.y +=
                dy /
                distance *
                enemy.speed *
                dt;

        }


        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            if (
                player.shield <= 0
            ) {

                player.health -=
                    enemy.damage *
                    dt;

                shake = 4;

            }


            if (
                player.health <= 0
            ) {

                endGame();

                return;

            }

        }

    }

}


/* =========================================================
   COLLISIONS
========================================================= */

function handleCollisions() {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        for (
            let j =
                enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];


            const distance =
                Math.hypot(
                    bullet.x -
                        enemy.x,
                    bullet.y -
                        enemy.y
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;


                bullets.splice(
                    i,
                    1
                );


                createExplosion(
                    enemy.x,
                    enemy.y,
                    enemy.type ===
                        "boss"
                        ? 25
                        : 10
                );


                addFloatingText(
                    enemy.x,
                    enemy.y -
                        enemy.radius,
                    "-" +
                        Math.round(
                            bullet.damage
                        )
                );


                if (
                    enemy.health <= 0
                ) {

                    killEnemy(
                        enemy,
                        j
                    );

                }


                break;

            }

        }

    }

}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(
    enemy,
    index
) {

    let reward = 20;

    let experience = 15;


    if (
        enemy.type === "tank"
    ) {

        reward = 60;

        experience = 40;

    }


    if (
        enemy.type === "boss"
    ) {

        reward = 500;

        experience = 250;

        bossUI.classList.add(
            "hidden"
        );

        createExplosion(
            enemy.x,
            enemy.y,
            80
        );

        shake = 20;

        sound(
            80,
            0.5,
            0.08,
            "sawtooth"
        );

    }


    score += reward;


    addXP(
        experience
    );


    if (
        Math.random() <
        0.45
    ) {

        coinsObjects.push({

            x: enemy.x,

            y: enemy.y,

            radius: 9

        });

    }


    enemies.splice(
        index,
        1
    );


    sound(
        100,
        0.05,
        0.025
    );

}


/* =========================================================
   COINS
========================================================= */

function updateCoins() {

    for (
        let i =
            coinsObjects.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coinsObjects[i];


        const distance =
            Math.hypot(
                player.x -
                    coin.x,
                player.y -
                    coin.y
            );


        if (
            distance <
            player.radius +
            coin.radius
        ) {

            coins++;

            score += 10;


            coinsObjects.splice(
                i,
                1
            );


            addFloatingText(
                player.x,
                player.y - 30,
                "+🪙"
            );


            sound(
                850,
                0.08,
                0.04,
                "sine"
            );

        }

    }

}


/* =========================================================
   XP
========================================================= */

function addXP(amount) {

    xp += amount;


    if (
        xp >= xpNeeded
    ) {

        xp -= xpNeeded;

        level++;


        xpNeeded =
            Math.floor(
                xpNeeded * 1.3
            );


        showLevelUp();

    }

}


/* =========================================================
   LEVEL UP
========================================================= */

function showLevelUp() {

    running = false;


    levelUp.classList.remove(
        "hidden"
    );


    const upgrades = [

        {
            icon: "⚔️",

            name: "OVERCHARGE",

            description:
                "+15 de dano",

            action() {

                player.damage += 15;

            }

        },


        {
            icon: "❤️",

            name: "REINFORCE",

            description:
                "+30 de vida máxima",

            action() {

                player.maxHealth += 30;

                player.health += 30;

            }

        },


        {
            icon: "⚡",

            name: "SPEED CORE",

            description:
                "+40 velocidade",

            action() {

                player.speed += 40;

            }

        },


        {
            icon: "🔥",

            name: "RAPID FIRE",

            description:
                "Dispare 25% mais rápido",

            action() {

                player.fireRate =
                    Math.max(
                        50,
                        player.fireRate *
                        0.75
                    );

            }

        },


        {
            icon: "💥",

            name: "MULTISHOT",

            description:
                "+1 projétil por disparo",

            action() {

                player.bullets++;

            }

        },


        {
            icon: "🛡️",

            name: "ENERGY SHIELD",

            description:
                "Reduz dano recebido",

            action() {

                player.shield += 0.25;

            }

        },


        {
            icon: "💚",

            name: "NANOBOTS",

            description:
                "Regenera vida lentamente",

            action() {

                player.regen += 2;

            }

        }

    ];


    const selected =
        upgrades
            .sort(
                () =>
                    Math.random() -
                    0.5
            )
            .slice(0, 3);


    const container =
        document.getElementById(
            "upgradeOptions"
        );


    container.innerHTML = "";


    selected.forEach(
        upgrade => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "upgrade";


            element.innerHTML = `

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


            element.onclick = () => {

                upgrade.action();


                levelUp.classList.add(
                    "hidden"
                );


                running = true;


                lastFrame =
                    performance.now();


                requestAnimationFrame(
                    gameLoop
                );


                sound(
                    700,
                    0.15,
                    0.05,
                    "sine"
                );

            };


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   WAVE
========================================================= */

function updateWave(dt) {

    waveTimer += dt;


    if (
        waveTimer >= 20
    ) {

        wave++;

        waveTimer = 0;


        createExplosion(
            player.x,
            player.y,
            30
        );


        addFloatingText(
            player.x,
            player.y - 50,
            "WAVE " + wave
        );


        sound(
            180,
            0.25,
            0.06,
            "sawtooth"
        );

    }

}


/* =========================================================
   SPAWNER
========================================================= */

function updateSpawner(dt) {

    spawnTimer += dt;


    const delay =
        Math.max(
            0.25,
            1.1 -
                wave * 0.045
        );


    if (
        spawnTimer >= delay
    ) {

        spawnTimer = 0;


        spawnEnemy();


        if (
            Math.random() <
            Math.min(
                0.35,
                wave * 0.015
            )
        ) {

            spawnEnemy();

        }

    }

}


/* =========================================================
   PARTICLES
========================================================= */

function createParticle(
    x,
    y,
    color = "#00f7ff"
) {

    const angle =
        Math.random() *
        Math.PI *
        2;


    const speed =
        Math.random() *
        180 +
        30;


    particles.push({

        x,

        y,

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,

        life:
            Math.random() *
                0.5 +
            0.2,

        size:
            Math.random() *
                4 +
            2,

        color

    });

}


function createExplosion(
    x,
    y,
    amount = 15
) {

    const colors = [
        "#00f7ff",
        "#8b5cf6",
        "#ff2bd6",
        "#ffffff"
    ];


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        createParticle(
            x,
            y,
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ]
        );

    }

}


function createMovementParticles() {

    if (
        Math.random() >
        0.25
    )
        return;


    createParticle(
        player.x,
        player.y,
        "#00f7ff"
    );

}


/* =========================================================
   PARTICLE UPDATE
========================================================= */

function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];


        particle.x +=
            particle.vx *
            dt;


        particle.y +=
            particle.vy *
            dt;


        particle.vx *=
            0.97;


        particle.vy *=
            0.97;


        particle.life -=
            dt;


        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   FLOATING TEXT
========================================================= */

function addFloatingText(
    x,
    y,
    text
) {

    floatingTexts.push({

        x,

        y,

        text,

        life: 1

    });

}


function updateFloatingTexts(
    dt
) {

    for (
        let i =
            floatingTexts.length - 1;
        i >= 0;
        i--
    ) {

        const text =
            floatingTexts[i];


        text.y -=
            35 *
            dt;


        text.life -=
            dt;


        if (
            text.life <= 0
        ) {

            floatingTexts.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   DRAW BACKGROUND
========================================================= */

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            50,
            canvas.width / 2,
            canvas.height / 2,
            Math.max(
                canvas.width,
                canvas.height
            )
        );


    gradient.addColorStop(
        0,
        "#111b3d"
    );


    gradient.addColorStop(
        1,
        "#02040c"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* GRID */

    ctx.strokeStyle =
        "rgba(0,247,255,0.045)";


    ctx.lineWidth = 1;


    const size = 60;


    for (
        let x = 0;
        x < canvas.width;
        x += size
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < canvas.height;
        y += size
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }

}


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    const angle =
        Math.atan2(
            mouse.y -
                player.y,
            mouse.x -
                player.x
        );


    ctx.save();


    ctx.translate(
        player.x,
        player.y
    );


    ctx.rotate(
        angle
    );


    /* AURA */

    const aura =
        ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            45
        );


    aura.addColorStop(
        0,
        "rgba(0,247,255,0.25)"
    );


    aura.addColorStop(
        1,
        "rgba(0,247,255,0)"
    );


    ctx.fillStyle =
        aura;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* CORPO */

    ctx.beginPath();

    ctx.moveTo(
        27,
        0
    );

    ctx.lineTo(
        -15,
        -17
    );

    ctx.lineTo(
        -10,
        17
    );

    ctx.closePath();


    ctx.fillStyle =
        "#00eaff";


    ctx.shadowBlur =
        20;

    ctx.shadowColor =
        "#00eaff";


    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.stroke();


    /* ARMA */

    ctx.fillStyle =
        "#e8ffff";


    ctx.fillRect(
        5,
        -4,
        32,
        8
    );


    ctx.restore();


    /* SHIELD */

    if (
        player.shield > 0
    ) {

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius + 8,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "rgba(139,92,246,0.8)";


        ctx.lineWidth = 2;

        ctx.stroke();

    }

}


/* =========================================================
   DRAW ENEMIES
========================================================= */

function drawEnemies() {

    enemies.forEach(
        enemy => {

            let color =
                "#ff3158";


            if (
                enemy.type ===
                "fast"
            )
                color =
                    "#ff9d00";


            if (
                enemy.type ===
                "tank"
            )
                color =
                    "#9c5cff";


            if (
                enemy.type ===
                "boss"
            )
                color =
                    "#ff00b7";


            /* AURA */

            ctx.beginPath();


            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius + 8,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                color.replace(
                    ")",
                    ",0.08)"
                );


            ctx.fillStyle =
                color;


            ctx.globalAlpha =
                0.08;


            ctx.fill();


            ctx.globalAlpha = 1;


            /* BODY */

            ctx.beginPath();


            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                color;


            ctx.shadowBlur =
                enemy.type ===
                "boss"
                    ? 25
                    : 12;


            ctx.shadowColor =
                color;


            ctx.fill();


            ctx.shadowBlur = 0;


            ctx.strokeStyle =
                "rgba(255,255,255,0.8)";


            ctx.lineWidth = 2;

            ctx.stroke();


            /* EYE */

            ctx.beginPath();


            ctx.arc(
                enemy.x +
                    enemy.radius *
                    0.35,
                enemy.y -
                    enemy.radius *
                    0.25,
                Math.max(
                    3,
                    enemy.radius *
                        0.16
                ),
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#ffffff";


            ctx.fill();


            /* HP */

            const width =
                enemy.radius * 2;


            const hp =
                Math.max(
                    0,
                    enemy.health /
                        enemy.maxHealth
                );


            ctx.fillStyle =
                "rgba(0,0,0,0.6)";


            ctx.fillRect(
                enemy.x -
                    width / 2,
                enemy.y -
                    enemy.radius -
                    10,
                width,
                4
            );


            ctx.fillStyle =
                color;


            ctx.fillRect(
                enemy.x -
                    width / 2,
                enemy.y -
                    enemy.radius -
                    10,
                width * hp,
                4
            );

        }
    );

}


/* =========================================================
   DRAW BULLETS
========================================================= */

function drawBullets() {

    bullets.forEach(
        bullet => {

            ctx.beginPath();


            ctx.arc(
                bullet.x,
                bullet.y,
                bullet.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#ffffff";


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                "#00f7ff";


            ctx.fill();


            ctx.shadowBlur = 0;

        }
    );

}


/* =========================================================
   DRAW COINS
========================================================= */

function drawCoins() {

    coinsObjects.forEach(
        coin => {

            ctx.beginPath();


            ctx.arc(
                coin.x,
                coin.y,
                coin.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#ffe600";


            ctx.shadowBlur =
                15;


            ctx.shadowColor =
                "#ffe600";


            ctx.fill();


            ctx.shadowBlur = 0;


            ctx.fillStyle =
                "#7a5f00";


            ctx.font =
                "bold 10px Arial";


            ctx.textAlign =
                "center";


            ctx.textBaseline =
                "middle";


            ctx.fillText(
                "$",
                coin.x,
                coin.y
            );

        }
    );

}


/* =========================================================
   DRAW PARTICLES
========================================================= */

function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                Math.max(
                    0,
                    particle.life
                );


            ctx.fillStyle =
                particle.color;


            ctx.fillRect(
                particle.x,
                particle.y,
                particle.size,
                particle.size
            );

        }
    );


    ctx.globalAlpha = 1;

}


/* =========================================================
   DRAW FLOATING TEXT
========================================================= */

function drawFloatingTexts() {

    floatingTexts.forEach(
        item => {

            ctx.globalAlpha =
                Math.max(
                    0,
                    item.life
                );


            ctx.font =
                "bold 13px Arial";


            ctx.textAlign =
                "center";


            ctx.fillStyle =
                "#ffffff";


            ctx.fillText(
                item.text,
                item.x,
                item.y
            );

        }
    );


    ctx.globalAlpha = 1;

}


/* =========================================================
   HUD UPDATE
========================================================= */

function updateHUD() {

    const hp =
        Math.max(
            0,
            player.health
        );


    const healthPercent =
        hp /
        player.maxHealth *
        100;


    document
        .getElementById(
            "healthBar"
        )
        .style.width =
        healthPercent +
        "%";


    document
        .getElementById(
            "xpBar"
        )
        .style.width =
        Math.min(
            100,
            xp /
                xpNeeded *
                100
        ) +
        "%";


    document
        .getElementById(
            "healthText"
        )
        .textContent =
        Math.ceil(hp);


    document
        .getElementById(
            "maxHealthText"
        )
        .textContent =
        Math.ceil(
            player.maxHealth
        );


    document
        .getElementById(
            "level"
        )
        .textContent =
        level;


    document
        .getElementById(
            "score"
        )
        .textContent =
        score.toLocaleString(
            "pt-BR"
        );


    document
        .getElementById(
            "coins"
        )
        .textContent =
        "🪙 " + coins;


    document
        .getElementById(
            "wave"
        )
        .textContent =
        String(wave).padStart(
            2,
            "0"
        );


    const seconds =
        Math.floor(
            (Date.now() -
                startTime) /
                1000
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        seconds % 60;


    document
        .getElementById(
            "gameTime"
        )
        .textContent =
        String(minutes).padStart(
            2,
            "0"
        ) +
        ":" +
        String(secs).padStart(
            2,
            "0"
        );


    const boss =
        enemies.find(
            enemy =>
                enemy.type ===
                "boss"
        );


    if (boss) {

        document
            .getElementById(
                "bossBar"
            )
            .style.width =
            Math.max(
                0,
                boss.health /
                    boss.maxHealth *
                    100
            ) +
            "%";

    }

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.save();


    if (
        shake > 0
    ) {

        ctx.translate(
            Math.random() *
                shake -
                shake / 2,

            Math.random() *
                shake -
                shake / 2
        );


        shake *=
            0.9;


        if (
            shake < 0.1
        )
            shake = 0;

    }


    drawBackground();

    drawCoins();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();

    drawFloatingTexts();


    ctx.restore();

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(time) {

    if (!running)
        return;


    const dt =
        Math.min(
            0.05,
            (time -
                lastFrame) /
                1000
        );


    lastFrame =
        time;


    updatePlayer(dt);

    shoot();

    updateBullets(dt);

    updateEnemies(dt);

    handleCollisions();

    updateCoins();

    updateParticles(dt);

    updateFloatingTexts(dt);

    updateSpawner(dt);

    updateWave(dt);

    updateHUD();

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    running = false;


    const elapsed =
        Math.floor(
            (Date.now() -
                startTime) /
                1000
        );


    const minutes =
        Math.floor(
            elapsed / 60
        );


    const seconds =
        elapsed % 60;


    document
        .getElementById(
            "finalScore"
        )
        .textContent =
        score.toLocaleString(
            "pt-BR"
        );


    document
        .getElementById(
            "finalWave"
        )
        .textContent =
        wave;


    document
        .getElementById(
            "finalLevel"
        )
        .textContent =
        level;


    document
        .getElementById(
            "finalTime"
        )
        .textContent =
        String(minutes).padStart(
            2,
            "0"
        ) +
        ":" +
        String(seconds).padStart(
            2,
            "0"
        );


    const record =
        document.getElementById(
            "newRecord"
        );


    if (
        score > bestScore
    ) {

        bestScore =
            score;


        localStorage.setItem(
            "shadowSurvivorBest",
            bestScore
        );


        record.classList.remove(
            "hidden"
        );

    } else {

        record.classList.add(
            "hidden"
        );

    }


    gameOver.classList.remove(
        "hidden"
    );


    mobileControls.classList.add(
        "hidden"
    );


    sound(
        70,
        0.5,
        0.06,
        "sawtooth"
    );

}


/* =========================================================
   MOBILE CONTROLS
========================================================= */

document
    .querySelectorAll(
        ".joystick button"
    )
    .forEach(
        button => {

            const key =
                button.dataset.key;


            button.addEventListener(
                "touchstart",
                event => {

                    event.preventDefault();

                    keys[key] = true;

                }
            );


            button.addEventListener(
                "touchend",
                event => {

                    event.preventDefault();

                    keys[key] = false;

                }
            );

        }
    );


document
    .getElementById(
        "mobileDash"
    )
    .addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            dash();

        }
    );


/* =========================================================
   INITIAL DRAW
========================================================= */

draw();



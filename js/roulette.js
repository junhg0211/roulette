let roulette;
let ctx;
let result;
let infoList;

const WIDTH = 500, HEIGHT = 500;
const RADIUS = 200;
const FPS = 60;
let dpr;

let selected;
let weightSum;

let rouletteInfo = [];

let particles = [];

const rouletteColors = [
    [209, 36, 36], [237, 160, 36], [255, 225, 16], [77, 227, 23],
    [23, 227, 203], [23, 115, 227], [108, 23, 227], [227, 23, 138]];

function parseColor(color) {
    let r = color[0];
    let g = color[1];
    let b = color[2];
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

function getNewColor() {
    let result = parseColor(rouletteColors[rouletteInfo.length % rouletteColors.length]);
    return result;
}

let infoId = 1;
function addElement() {
    let li = document.createElement("li");

    let contentField = document.createElement("input");
    contentField.type = "text";
    contentField.placeholder = "내용";
    contentField.classList = ["form-control"];
    contentField.value = `항목 ${infoId}`;
    li.appendChild(contentField);
    infoId++;

    let weightField = document.createElement("input");
    weightField.type = "number";
    weightField.placeholder = "가중치";
    weightField.min = 0;
    weightField.value = 1;
    weightField.classList = ["form-control"];
    li.appendChild(weightField);

    let colorField = document.createElement("input");
    colorField.type = "color";
    colorField.value = getNewColor();
    colorField.classList = ["form-control"];
    colorField.style.display = "none";
    li.appendChild(colorField);

    let button = document.createElement("button");
    button.onclick = () => {infoList.removeChild(li); updateInfo();};
    button.innerText = "제거";
    button.classList = ["btn btn-outline-danger"];
    li.appendChild(button);

    infoList.insertBefore(li, infoList.firstChild);

    updateInfo();
}

function updateInfo() {
    rouletteInfo.length = 0;
    for (let i = 0; i < infoList.children.length; i++) {
        let child = infoList.children[i];

        let content = child.children[0].value;
        let color = child.children[2].value;
        let weight = parseFloat(child.children[1].value);
        rouletteInfo.push([content, color, weight]);
    }
}

function rotate(dt) {
    torque += dt;
    first = true;
}

function addParticle() {
    let direction = Math.random() * Math.PI * 2;
    let force = Math.random() * 3.5;
    let dx = Math.cos(direction) * force;
    let dy = Math.sin(direction) * force - 5;

    particles.push([WIDTH/2, 60, dx, dy, parseColor(rouletteColors[Math.floor(Math.random() * rouletteColors.length)])]);
}

function endSpin() {
    torque = 0;
    result.innerText = selected;
}

let rotated = 0;
let friction = 0.99;
let torque = 0;
let previousTorque = torque;
let previous = true;

let mouseX;
let mouseY;
let mouseClicked = false;
let previousClicked = mouseClicked;
let previousAngle;

function tick() {
    // --- mouse torque control
    let angle = Math.atan2(mouseY - HEIGHT/2, mouseX - WIDTH/2);

    angleDelta = angle - previousAngle;
    if (mouseClicked) {
        torque = angleDelta;
    }

    previousAngle = angle;
    previousClicked = mouseClicked;

    // --- spinning things
    previousTorque = torque;
    torque *= friction;

    let condition = Math.abs(torque) < 2e-4;

    if (condition && !previous && !mouseClicked) {
        endSpin();
        for (let i = 0; i < 50; i++) {
            addParticle();
        }
    } else if (!condition && previous) {
        result.innerText = "(돌아가는 중...)";
    }
    previous = condition;

    rotated = (rotated + torque + Math.PI*2) % (Math.PI*2);

    // --- calculate selected
    weightSum = 0;
    rouletteInfo.forEach(info => {
        weightSum += info[2];
    });

    let remains = rotated;
    for (let i = rouletteInfo.length-1; i >= 0; i--) {
        let info = rouletteInfo[i];

        let delta = info[2]/weightSum * Math.PI*2;
        remains -= delta;

        if (remains < 0) {
            selected = info[0];
            break;
        }
    }

    // --- particles
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];

        particle[3] += 0.2;
        particle[0] += particle[2];
        particle[1] += particle[3]

        if (particle[1] > HEIGHT) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function render() {
    ctx.clearRect(0, 0, WIDTH * dpr, HEIGHT * dpr);

    let halfWidth = WIDTH * dpr / 2;
    let halfHeight = HEIGHT * dpr / 2;

    // --- draw roulette
    let been = 0;
    ctx.font = `${dpr}rem Pretendard`;
    ctx.lineWidth = 5;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    rouletteInfo.forEach(info => {
        let angle = info[2]/weightSum * 2*Math.PI;
        let startAngle = rotated + been - Math.PI*0.5;
        let endAngle = rotated + been + angle - Math.PI*0.5;
        been += angle;

        ctx.fillStyle = info[1];
        ctx.beginPath();
        ctx.moveTo(halfWidth, halfHeight);
        ctx.arc(halfWidth, halfHeight, RADIUS*dpr, startAngle, endAngle);
        ctx.fill();
    });

    rouletteInfo.forEach(info => {
        let angle = info[2]/weightSum * 2*Math.PI;
        let startAngle = rotated + been - Math.PI*0.5;
        let endAngle = rotated + been + angle - Math.PI*0.5;
        been += angle;

        let ta = (startAngle + endAngle) / 2;
        let tx = halfWidth + Math.cos(ta) * RADIUS*dpr * 0.8;
        let ty = halfHeight + Math.sin(ta) * RADIUS*dpr * 0.8;
        ctx.textStyle = "Pretendard JP";
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.strokeText(info[0], tx, ty);
        ctx.fillText(info[0], tx, ty);
    });

    // --- draw pin
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(halfWidth, 60*dpr);
    ctx.lineTo(halfWidth - 5*dpr, 40*dpr);
    ctx.lineTo(halfWidth + 5*dpr, 40*dpr);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.fillText(selected, halfWidth, 30*dpr);

    // --- draw torque gauge
    if (!mouseClicked) {
        let gaugeLength = (Math.log(Math.abs(torque)) - Math.log(2e-4)) * 10 * dpr;
        ctx.fillStyle = "red";
        ctx.fillRect(WIDTH * dpr - dpr*50, HEIGHT * dpr - gaugeLength - 50*dpr, dpr * 10, gaugeLength);
    }

    // --- particles
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];

        ctx.fillStyle = particle[4];
        ctx.fillRect(particle[0] * dpr, particle[1] * dpr, 10, 10);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    roulette = document.querySelector("#roulette");
    ctx = roulette.getContext('2d');
    result = document.querySelector("#result");
    infoList = document.querySelector("#info");

    resize();

    setInterval(() => {
        tick();
        render();
    }, 1000 / FPS);

    addElement();

    infoList.addEventListener('keyup', updateInfo);
    infoList.addEventListener('keydown', updateInfo);
    infoList.addEventListener('change', updateInfo);

    roulette.addEventListener('mousemove', e => {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    });

    window.addEventListener('mousedown', e => {
        if (e.button === 0 && Math.hypot(WIDTH/2 - mouseX, HEIGHT/2 - mouseY) <= RADIUS) {
            mouseClicked = true;
        }
    });

    window.addEventListener('mouseup', e => {
        if (e.button === 0) {
            mouseClicked = false;

            if (torque === 0)
                endSpin();
        }
    });
});

function resize() {
    dpr = window.devicePixelRatio;

    roulette.width = dpr * WIDTH;
    roulette.height = dpr * HEIGHT;
}
window.addEventListener('resize', resize);

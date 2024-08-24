const minWidth = 1000;
const aspectRatio = 6.5;

let start = 1791;
let end = 1827;
let nYears = end - start + 1;
const radius = 0.0025

const dotsPosition = 0.85;

const beginMiddle = 1804;
const beginLate = 1815;

const Type = Object.freeze({
    KEYBOARD: "Keyboard",
    CHAMBER: "Chamber",
    ORCHESTRAL: "Orchestral",
    VOCAL: "Vocal",
    STAGE: "Stage",
    CONCERTO: "Concerto",
    STRING_QUARTET: "Quartet",
    PIANO_CHAMBER: "Piano Chamber",
    SYMPHONY: "Symphony",
    PIANO_SONATA: "Sonata",
    SERENADE: "Serenade",
    STRING_QUINTET: "String Quintet",
    PIANO_CONCERTO: "Piano Concerto",
    VIOLIN_SONATA: "Violin Sonata"
    // OTHER: "",
});
const defaultType = Type.OTHER;
const colors = {
    [Type.KEYBOARD]: "crimson",
    [Type.CHAMBER]: "green",
    [Type.ORCHESTRAL]: "yellow",
    [Type.VOCAL]: "blue",
    [Type.STAGE]: "purple",
    [Type.CONCERTO]: "orange",
    [Type.STRING_QUARTET]: "mediumblue",
    [Type.PIANO_CHAMBER]: "darkcyan",
    [Type.SYMPHONY]: "black",
    [Type.PIANO_SONATA]: "crimson",
    [Type.SERENADE]: "goldenrod",
    [Type.STRING_QUINTET]: "midnightblue",
    [Type.PIANO_CONCERTO]: "orangered",
    [Type.VIOLIN_SONATA]: "green",
    // [Type.OTHER]: "#999",
};

const order = [
    Type.STAGE,
    Type.SYMPHONY,
    Type.PIANO_CONCERTO,
    Type.CONCERTO,
    Type.PIANO_SONATA,
    Type.STRING_QUARTET,
    Type.STRING_QUINTET,
    Type.PIANO_CHAMBER,
    Type.VIOLIN_SONATA,
    Type.SERENADE,
    Type.CHAMBER,
    Type.ORCHESTRAL,
    Type.KEYBOARD,
    Type.VOCAL
]

const overrideToDefault = [
    "Op. 118",
]

const main = async () => {
    const canvas = document.createElement("canvas");
    // full width
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");

    // load opus list
    const opusList = await fetch("mozart_works.json").then(res => res.json());
    // setOpusTypes(opusList);
    start = Infinity;
    end = -Infinity;
    const genres = new Set();
    for (const opus of opusList) {
        opus.year = opus.date;
        opus.type = opus.genre;
        if (opus.title.includes("Piano Concerto")) {
            opus.type = Type.PIANO_CONCERTO;
        } else if (opus.title.includes("Concerto")) {
            opus.type = Type.CONCERTO;
        } else if (opus.title.includes("String Quartet")) {
            opus.type = Type.STRING_QUARTET;
        } else if (opus.title.includes("Violin Sonata")) {
            opus.type = Type.VIOLIN_SONATA;
        } else if (opus.title.includes("Symphony")) {
            opus.type = Type.SYMPHONY;
        } else if (opus.type === Type.KEYBOARD && opus.title.includes("Sonata")) {
            opus.type = Type.PIANO_SONATA;
        } else if (opus.type === Type.CHAMBER && opus.forces.includes("pf")) {
            opus.type = Type.PIANO_CHAMBER;
        } else if (opus.title.includes("Serenade")) {
            opus.type = Type.SERENADE;
        } else if (opus.title.includes("String Quintet")) {
            opus.type = Type.STRING_QUINTET;
        }

        genres.add(opus.genre)
        start = Math.min(start, opus.year)
        end = Math.max(end, opus.year)
        opus.subItems = [];
    }
    start -= 1;
    end += 1;
    nYears = end - start + 1;

    console.log(genres)

    setOpusXPositions(opusList);
    opusList.sort((a, b) => a.x - b.x);

    let pos = { x: 0, y: 0 };

    canvas.addEventListener("mousemove", (e) => {
        // position
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvas.width;
        const y = (e.clientY - rect.top) / canvas.height;
        pos = { x, y };
    });

    let hoveredOpus = null;
    const loop = () => {
        updateCanvasDimensions(canvas);
        const newHoveredOpus = findHoveredOpus(canvas, opusList, pos);
        if (newHoveredOpus !== null) {
            hoveredOpus = newHoveredOpus;
        }
        draw(canvas, ctx, opusList, hoveredOpus);
        requestAnimationFrame(loop);
    }
    loop();
}

const loadOpusList = async () => {
    const opusList = await fetch("opus.txt").then(r => r.text());
    const items = opusList.split("\n").filter(line => line.trim() !== "").map(line => {
        const title = line.trim();
        const year = parseInt(title.slice(title.length - 5, title.length - 1));
        const isSubItem = line.startsWith("    ");
        return { title: title, year, isSubItem };
    }).filter(item => !item.title.includes("arrangement"));

    const nestedItems = [];
    for (const item of items) {
        if (item.isSubItem) {
            nestedItems[nestedItems.length - 1].subItems.push({ title: item.title });
        } else {
            nestedItems.push({ title: item.title, year: item.year, subItems: [] });
        }
    }
    return nestedItems;
}


const setOpusTypes = (opusList) => {
    for (const opus of opusList) {
        opus.type = defaultType;
        if (overrideToDefault.some(value => opus.title.includes(value))) {
            continue;
        }
        for (const [key, value] of Object.entries(Type)) {
            if (opus.title.toLowerCase().includes(value)) {
                opus.type = value;
                break;
            }
        }
    }
}

const setOpusXPositions = (opusList) => {
    const types = new Set();
    const opusByYear = {};
    for (const opus of opusList) {
        types.add(opus.type);
        if (!(opus.year in opusByYear)) {
            opusByYear[opus.year] = {};
        }
        if (!(opus.type in opusByYear[opus.year])) {
            opusByYear[opus.year][opus.type] = [];
        }
        opusByYear[opus.year][opus.type].push(opus);
    }

    const typesList = Array.from(types);
    typesList.sort();

    const yearWidth = 1 / nYears;

    const typeToY = {}
    for (const [index, type] of order.entries()) {
        typeToY[type] = dotsPosition - (order.length - index - 1) * yearWidth;
    }

    for (const [year, opusByType] of Object.entries(opusByYear)) {
        for (const opusList of Object.values(opusByType)) {
            const startX = (year - start) * yearWidth;
            const step = yearWidth / opusList.length;
            let x = startX;
            for (const opus of opusList) {
                opus.x = x;
                opus.y = typeToY[opus.type];
                x += step;
            }
        }
    }
}

const findHoveredOpus = (canvas, opusList, pos) => {
    console.log(pos)
    for (const opus of opusList) {
        const x = opus.x;
        const y = opus.y;
        const dx = (pos.x - x) ** 2 + ((pos.y - y) / canvas.width * canvas.height) ** 2;
        if (dx < radius ** 2) {
            return opus;
        }
    }
    return null;
}


const updateCanvasDimensions = (canvas) => {
    canvas.width = Math.max(minWidth, window.innerWidth);
    canvas.height = canvas.width / aspectRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerWidth / aspectRatio}px`;
}

const draw = (canvas, ctx, opusList, hoveredOpus) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(canvas, ctx);
    drawOpusList(canvas, ctx, opusList, hoveredOpus);
    drawText(canvas, ctx, hoveredOpus);
}


const drawBackground = (canvas, ctx) => {
    ctx.fillStyle = "#e7e7e7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const yearWidth = width / nYears;

    // draw vertical lines
    ctx.strokeStyle = "#b0b0b0";
    ctx.lineWidth = 1;
    for (let i = 0; i < nYears; i++) {
        const x = i * yearWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // draw years
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${yearWidth * 0.3}px sans-serif`;

    for (let i = 0; i < nYears; i++) {
        const x = i * yearWidth;
        const year = start + i;
        ctx.fillText(year, x + yearWidth * 0.5, canvas.height * 0.95);
    }
};


const drawOpusList = (canvas, ctx, opusList, hoveredOpus) => {
    const hoveredType = hoveredOpus?.type ?? null;

    const yPos = canvas.height * dotsPosition;
    const width = canvas.width;

    for (const opus of opusList) {
        // draw circle
        // draw circles of other types half transparent
        ctx.globalAlpha = opus.type === hoveredType || hoveredType === null || hoveredType === defaultType ? 1 : 0.3;
        ctx.fillStyle = colors[opus.type];

        const x = opus.x * canvas.width;
        const y = opus.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, width * radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    // draw arrow above hovered opus
    if (hoveredOpus !== null) {
        const x = hoveredOpus.x * width;
        const y = hoveredOpus.y * canvas.height - width / nYears * radius * 2;
        const arrowWidth = width / nYears * 0.1;
        const arrowHeight = width / nYears * 0.2;
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors[hoveredOpus.type];
        ctx.beginPath();
        ctx.moveTo(x - arrowWidth, y - arrowHeight);
        ctx.lineTo(x, y);
        ctx.lineTo(x + arrowWidth, y - arrowHeight);
        ctx.fill();
    }

}


const drawText = (canvas, ctx, hoveredOpus) => {
    if (hoveredOpus === null) {
        return;
    }
    const width = canvas.width;
    const height = canvas.height;
    const yPos = height * 0.1;
    const xPos = width * 0.5;
    const fontSize = width * 0.015;

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(hoveredOpus.title, xPos, yPos);

    const subItemFontSize = fontSize * 0.8;
    ctx.font = `${subItemFontSize}px sans-serif`;
    for (let [i, text] of [hoveredOpus.k, hoveredOpus.key, hoveredOpus.forces].filter(t => t != "").entries()) {
        const y = yPos + (i + 1) * subItemFontSize * 1.2;
        ctx.fillText(text, xPos, y);
    }
}


main();
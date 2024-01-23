const minWidth = 1000;
const aspectRatio = 6.5;

const start = 1791;
const end = 1827;
const nYears = end - start + 1;
const radius = 0.07;

const dotsPosition = 0.76;

const beginMiddle = 1804;
const beginLate = 1815;

const Type = Object.freeze({
    SYMPHONY: "symphony no",
    STRING_QUARTET: "string quartet",
    VARIATION: "variation",
    PIANO_SONATA: "piano sonata",
    PIANO_CONCERTO: "piano concerto",
    PIANO_TRIO: "piano trio",
    CELLO_SONATA: "cello sonata",
    OTHER: "",
});
const defaultType = Type.OTHER;
const colors = {
    [Type.STRING_QUARTET]: "green",
    [Type.PIANO_SONATA]: "#d00000",
    [Type.VARIATION]: "yellow",
    [Type.SYMPHONY]: "blue",
    [Type.PIANO_CONCERTO]: "purple",
    [Type.PIANO_TRIO]: "orange",
    [Type.CELLO_SONATA]: "orangered",
    [Type.OTHER]: "#999",
};

const overrideToDefault = [
    "Op. 118",
]

const main = async () => {
    const canvas = document.createElement("canvas");
    // full width
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");

    // load opus list
    const opusList = await loadOpusList();
    setOpusTypes(opusList);
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
        const newHoveredOpus = findHoveredOpus(opusList, pos);
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
    const opusByYear = {};
    for (const opus of opusList) {
        if (!(opus.year in opusByYear)) {
            opusByYear[opus.year] = [];
        }
        opusByYear[opus.year].push(opus);
    }

    const yearWidth = 1 / nYears;
    for (const [year, opusList] of Object.entries(opusByYear)) {
        const startX = (year - start) * yearWidth;
        const step = yearWidth / opusList.length;
        let x = startX;
        for (const opus of opusList) {
            opus.x = x;
            x += step;
        }
    }
}

const findHoveredOpus = (opusList, pos) => {
    const width = 1 / nYears;
    for (const opus of opusList) {
        const x = opus.x;
        const dx = Math.abs(pos.x - x);
        if (dx < radius * width) {
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


    // draw middle rect
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect((beginMiddle - start) * yearWidth, 0, (beginLate - beginMiddle) * yearWidth, canvas.height);
    // draw late rect
    ctx.fillStyle = "#d7d7d7";
    ctx.fillRect((beginLate - start) * yearWidth, 0, (end - beginLate + 1) * yearWidth, canvas.height);

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
        const x = opus.x * width;
        // draw circle
        // draw circles of other types half transparent
        ctx.globalAlpha = opus.type === hoveredType || hoveredType === null || hoveredType === defaultType ? 1 : 0.3;
        ctx.fillStyle = colors[opus.type];

        const nCircles = Math.max(1, opus.subItems.length);

        for (let i = 0; i < nCircles; i++) {
            const y = yPos + i * width / nYears * radius * 2;
            ctx.beginPath();
            ctx.arc(x, y, width / nYears * radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // draw arrow above hovered opus
    if (hoveredOpus !== null) {
        const x = hoveredOpus.x * width;
        const y = yPos - width / nYears * radius * 2;
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
    for (let i = 0; i < hoveredOpus.subItems.length; i++) {
        const subItem = hoveredOpus.subItems[i];
        const y = yPos + (i + 1) * subItemFontSize * 1.2;
        ctx.fillText(subItem.title, xPos, y);
    }
}


main();
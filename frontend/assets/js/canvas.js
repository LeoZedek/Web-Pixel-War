// Auteur du fichier: Mathias Hersent

// Functions ----------------------------------
function initPixels(img) {
    const pixels = [];
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.drawImage(img, 0, 0);
    img.style.display = "none";

    let pix = tempCtx.getImageData(0, 0, nbPixels, nbPixels).data;
    for (let i = 0; i < pix.length; i += 4) {
        pixels.push([pix[i], pix[i+1], pix[i+2]]);
    }

    return pixels;
}

function adaptCoords(coords) {
    // Transforme les coordonnées du clic de la sourie en indice pour le tableau de pixel
    let positionInfo = cadre_canvas.getBoundingClientRect();
    let psize = getCanvasInfo(canvas).psize;
    x = Math.ceil(coords[0] - positionInfo.x);
    y = Math.ceil(coords[1] - positionInfo.y);
    return [(x - (x % psize)) / psize, (y - (y % psize)) / psize];
}

function getCanvasInfo() {
    // Permet de récupérer des informations concernant le canva
    // w : largeur
    // h : hauteur
    // step : taille des pixels
    let positionInfo = cadre_canvas.getBoundingClientRect();
    let width  = Math.ceil(positionInfo.width);
    let height = Math.ceil(positionInfo.height);
    let pixelSize;
    if (width < height) {
        pixelSize = Math.ceil(width / nbPixels);
    } else {
        pixelSize = Math.ceil(height / nbPixels);
    }

    return {"w": width, "h": height, "psize": pixelSize};
}

function resizeCanvas(canvas) {
    // Met à jour les dimensions du canva en fonction de la taille de la fenêtre
    const canvasInfo = getCanvasInfo();

    canvas.width  = canvasInfo.w * ratio;
    canvas.height = canvasInfo.h * ratio;
    canvas.style.width  = canvasInfo.w + 'px';
    canvas.style.height = canvasInfo.h + 'px';
    console.log(canvas.width, canvas.height, canvas.style.width, canvas.style.height);
}

function draw(canvas, nbPixels, pixels) {
    const canvaInfo = getCanvasInfo();
    const ctx = canvas.getContext("2d");

    // Dessiner les pixels
    for (let i = 0; i < nbPixels; i++) {
        for (let j = 0; j < nbPixels; j++) {
            ctx.fillStyle = 'rgb(' + pixels[j*nbPixels + i][0] + ',' + pixels[j*nbPixels + i][1] + ',' + pixels[j*nbPixels + i][2] + ')';
            ctx.fillRect(i*canvaInfo.psize, j*canvaInfo.psize, canvaInfo.psize, canvaInfo.psize);
        }
    }

    // Dessiner la grille
    ctx.fillStyle = 'rgb(200, 200, 200)';
    for (let i = 0; i < nbPixels+1; i++) {
        ctx.fillRect(canvaInfo.psize*i, 0, 1, canvaInfo.psize*nbPixels); // lignes verticales
        ctx.fillRect(0, canvaInfo.psize*i, canvaInfo.psize*nbPixels, 1); // lignes horizontales
    }
}

// Main program -------------------------------
// On récupère le nom du canva dans l'url via le paramètre GET
let address = window.location.search;
let parameterList = new URLSearchParams(address);
let canvaName = parameterList.get("name");

let canvaInfo;
$.ajax({
    type: 'POST',
    url: '/canva/info',
    async: false,   // On a besoin des infos avant d'afficher le canva
    data: {"name": canvaName},
    success: function(received) {
        canvaInfo = received;
    },
    error: function() {
        console.log('La requête n a pas abouti');
    }
});
console.log(canvaInfo);

let img = new Image();
img.src = "assets/img/canvas/canva_" + canvaInfo.id + ".png";

const nbPixels = canvaInfo.size;
const cadre_canvas = document.getElementsByClassName("canva_cadre")[0];
const canvas = document.getElementById("canvas");
const ratio  = window.devicePixelRatio;

let pixels = [];
let modifs = []
let firstImageLoad = true;
resizeCanvas(canvas);

// Events listeners ---------------------------
window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    draw(canvas, nbPixels, pixels);
});

img.addEventListener("load", () => {
    pixels = initPixels(img);
    draw(canvas, nbPixels, pixels);

    if (firstImageLoad) {
        firstImageLoad = false;
        setInterval(() => {
            if (modifs.length !== 0) {
                $.ajax({
                    type: 'POST',
                    url: '/canva/update',
                    data: {"id": canvaInfo.id, "x": modifs[0][0], "y": modifs[0][1], "color": modifs[0][2]},
                    success: function(received) {
                        
                    },
                    error: function() {
                        console.log('La requête n a pas abouti');
                    }
                });
            }
            modifs = [];
            let timestamp = (new Date()).getTime();
            img.src = "/assets/img/canvas/canva_" + canvaInfo.id + ".png" + '?_=' + timestamp;
            console.log(img);
            pixels = initPixels(img);
            draw(canvas, nbPixels, pixels);
            console.log("update");
        }, 1000);
    }
});

canvas.addEventListener("mousedown", (event) => {
    coords = adaptCoords([event.clientX, event.clientY]);
    console.log(coords);
    modifs.push([coords[0], coords[1], [255, 0, 0]]);
    pixels[coords[1]*nbPixels + coords[0]] = [255, 0, 0];
    draw(canvas, nbPixels, pixels);
});
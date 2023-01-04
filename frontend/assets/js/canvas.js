// Auteur du fichier: Mathias Hersent

// Functions ---------------------------------------------------------------------
function initPixels(img) {
    /* 
    Permet de mettre les pixels de l'image dans un tableau qui me permet d'afficher et
    de modifier plus facilement
    */
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

function updatePixels(serverModifs) {
    /*
    Permet de mettre à jour les pixels avec les infos reçues depuis le serveur
    */
    for (let i = 0; i < serverModifs.length; i++) {
        pixels[parseInt(serverModifs[i].y)*nbPixels + parseInt(serverModifs[i].x)][0] = serverModifs[i].color[0];
        pixels[parseInt(serverModifs[i].y)*nbPixels + parseInt(serverModifs[i].x)][1] = serverModifs[i].color[1];
        pixels[parseInt(serverModifs[i].y)*nbPixels + parseInt(serverModifs[i].x)][2] = serverModifs[i].color[2];
    }
}

function adaptCoords(coords) {
    /*
    Transforme les coordonnées du clic de la sourie en indice pour le tableau de pixel
    Exemple: souris clic en 12, 12 ça veut dire que c'est l'indice 0, 0 du tableau
    */
    let positionInfo = cadre_canvas.getBoundingClientRect();
    let psize = getCanvasInfo(canvas).psize;
    x = Math.ceil(coords[0] - (positionInfo.x + getCanvasInfo(canvas).offsetX));
    y = Math.ceil(coords[1] - (positionInfo.y + getCanvasInfo(canvas).offsetY));
    return [(x - (x % psize)) / psize, (y - (y % psize)) / psize];
}

function getCanvasInfo() {
    /*
    Permet de récupérer des informations concernant le canva
    w : largeur
    h : hauteur
    psize : taille des pixels
    */
    let positionInfo = cadre_canvas.getBoundingClientRect();
    let width  = Math.floor(positionInfo.width);
    let height = Math.floor(positionInfo.height);
    let pixelSize;
    if (width < height) {
        pixelSize = Math.floor(width / nbPixels);
    } else {
        pixelSize = Math.floor(height / nbPixels);
    }
    let offsetX = Math.round((width - pixelSize * nbPixels) / 2);
    let offsetY = Math.round((height - pixelSize * nbPixels) / 2);

    return {"w": width, "h": height, "psize": pixelSize, "offsetX": offsetX, "offsetY": offsetY};
}

function resizeCanvas(canvas) {
    /*
    Met à jour les dimensions du canva en fonction de la taille de la fenêtre
    */
    const canvasInfo = getCanvasInfo();

    canvas.width  = canvasInfo.w * ratio;
    canvas.height = canvasInfo.h * ratio;
    canvas.style.width  = canvasInfo.w + 'px';
    canvas.style.height = canvasInfo.h + 'px';
}

function draw(canvas, nbPixels, pixels) {
    /*
    Dessine les pixels sur le canva
    */
    const canvaInfo = getCanvasInfo();
    const ctx = canvas.getContext("2d");

    let infos = getCanvasInfo();

    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0, 0, infos.w, infos.h - 6);
    // Dessiner les pixels
    for (let i = 0; i < nbPixels; i++) {
        for (let j = 0; j < nbPixels; j++) {
            ctx.fillStyle = 'rgb(' + pixels[j*nbPixels + i][0] + ',' + pixels[j*nbPixels + i][1] + ',' + pixels[j*nbPixels + i][2] + ')';
            ctx.fillRect(i*canvaInfo.psize + infos.offsetX, j*canvaInfo.psize + infos.offsetY, canvaInfo.psize, canvaInfo.psize);
        }
    }

    // Dessiner la grille
    ctx.fillStyle = 'rgb(200, 200, 200)';
    for (let i = 0; i < nbPixels+1; i++) {
        ctx.fillRect(canvaInfo.psize*i + infos.offsetX, 0 + infos.offsetY, 1, canvaInfo.psize*nbPixels); // lignes verticales
        ctx.fillRect(0 + infos.offsetX, canvaInfo.psize*i + infos.offsetY, canvaInfo.psize*nbPixels, 1); // lignes horizontales
    }
}

// Main program -----------------------------------------------------------------------------------
// On récupère le nom du canva dans l'url via le paramètre GET
let address = window.location.search;
let parameterList = new URLSearchParams(address);
let canvaName = parameterList.get("name"); // nom du canva (genre: "room4")

let canvaInfo;
// Champs de canvaInfo: colors, id, minRank, minTime, minTimeVIP, size
// Càd: les couleurs autorisées, l'id, le privilège minimal pour pouvoir jouer, le temps
// d'attente pour un user normal, pour un VIP, le nombre de pixel de côté
$.ajax({
    type: 'POST',
    url: '/canva/info',
    async: false,   // On a besoin des infos avant d'afficher le canva donc on attend la réponse
    data: {"name": canvaName},
    success: function(received) {
        canvaInfo = received;
    },
    error: function() {
        console.log('La requête n a pas abouti');
    }
});
if (canvaInfo === undefined || canvaInfo === null) {
    alert('The room ' + canvaName + ' does not exist');
} else {
    document.title = 'Room : ' + canvaName;
}
console.log(canvaInfo);

// Chargement de l'image stockée dans le serveur via une balise image
let img = new Image();
img.src = "assets/img/canvas/canva_" + canvaInfo.id + ".png";

const nbPixels = canvaInfo.size;
const cadre_canvas = document.getElementsByClassName("canva_cadre")[0];
const canvas = document.getElementById("canvas");
const ratio  = window.devicePixelRatio;

let pixels = []; // les pixels à afficher sur le canva
let serverModifs = []; // les modifications reçu depuis le serveur pour mettre à jour les pixels
resizeCanvas(canvas);
console.log(pseudo); // récupéré dans le EJS
console.log("id : " + userId); // récupéré dans le EJS

// Communication avec un socket lié au serveur pour envoyer et recevoir les modifs
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = function(event) {
    console.log('WebSocket connection established');
};

socket.onmessage = function(event) {
    // console.log('received:', JSON.parse(event.data));
    updatePixels(JSON.parse(event.data));
    draw(canvas, nbPixels, pixels);
};

socket.onclose = function(event) {
    console.log('WebSocket connection closed');
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

const timer = document.getElementById("timer");
let timeToWait = 0;
update_time_to_wait(userId, vip_level);

document.onreadystatechange = () => {
    if (document.readyState == "complete") {
        resizeCanvas(canvas);
        draw(canvas, nbPixels, pixels);
    }
}

setInterval(() => {
    draw(canvas, nbPixels, pixels);
}, 1000);

function update_time_to_wait(user_id, vip_level) {
    // Auteur : Léo Zedek

    // Update the variable timeToWait with a request to the database
    $.ajax({
        type: 'POST',
        url: '/canva/get_time_to_wait',
        data: {user_id: user_id},
        success: function(received) {
            if (received != null) {
                time_since_last_modif = received["time_since_last_modif"];

                let minTime;

                if (vip_level != undefined && vip_level == 0) {
                    minTime = parseInt(canvaInfo.minTime);
                }
                else if (vip_level != undefined && vip_level == 1) {
                    minTime = parseInt(canvaInfo.minTimeVIP);
                }

                console.log("minTime :" + minTime);

                if (time_since_last_modif > minTime) {
                    timeToWait = 0;
                }
                else {
                    timeToWait = minTime - time_since_last_modif;
                }
            }
        },
        error: function() {
            console.error('Erreur requête get_time_to_wait');
        }
    });
}

function update_last_time_modif(user_id) {
    // Auteur : Léo Zedek

    // Update the database. The variable lastModifTime from the user will be updated
    $.ajax({
            type: 'POST',
            url: '/canva/update_date',
            data: {user_id: user_id},
            success: function(received) {
                if (received != null) {
                    vip_level = received["new_vip_level"];
                }
            },
            error: function() {
                console.error('Erreur requête update_date');
            }
        });
}

setInterval(() => {
    if (timeToWait > 0) {
        timeToWait -= 1;
    }

    if (timeToWait <= 1) {
        timer.innerText = timeToWait;
    }
    else {
        timer.innerText = timeToWait;
    }
}, 1000);

// Events listeners ---------------------------
window.addEventListener('resize', () => {
    // Quand la fenêtre bouge on redimensionne le canva et on le redessine
    resizeCanvas(canvas);
    draw(canvas, nbPixels, pixels);
});

img.addEventListener("load", () => {
    // Une fois l'image chargée on met à jour les pixels et on les dessine 
    pixels = initPixels(img);
    draw(canvas, nbPixels, pixels);
});


// LIOTÉ Ruth
let colorValue = '#00000';
function getColorValue() {
    let el = document.getElementsByName("select_color");

    for(i = 0; i < el.length; i++) {
        if(el[i].checked){
            colorValue = el[i].value;
        }
    }

    console.log('yey');
    console.log(colorValue);
}


// LIOTÉ Ruth
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}


canvas.addEventListener("mousedown", (event) => {
    // Quand le user clique
    if (timeToWait <= 0 && pseudo !== '') {
        update_last_time_modif(userId);
        let minTime;

        if (vip_level == 0) {
            minTime = canvaInfo.minTime;
        }
        else if (vip_level == 1) {
            minTime = canvaInfo.minTimeVIP;
        }

        timeToWait = parseInt(minTime);

        coords = adaptCoords([event.clientX, event.clientY]);
        if (coords[0] >= 0 && coords[0] < nbPixels && coords[1] >= 0 && coords[1] < nbPixels) {
        // LIOTÉ Ruth
        //Récupère la couleur par défaut du bouton.
	    getColorValue();

        console.log(colorValue);
        let colorValueRGB = hexToRgb(colorValue);
        console.log(colorValueRGB);
        
        socket.send(JSON.stringify({id: canvaInfo.id, x: coords[0], y: coords[1], color:[colorValueRGB.r, colorValueRGB.g, colorValueRGB.b], hexa: colorValue, userId: userId}));

        }
    }
});

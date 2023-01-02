const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const jimp = require('jimp');
const WebSocket = require('ws');

// Mathias Hersent
function selectModifsById(modifs, id) {
    let result = [];
    for (let i = 0; i < modifs.length; i++) {
        if (modifs[i].id === id) {
            result.push(modifs[i]);
        }
    }
    return result;
}

// Les sockets: Mathias Hersent
let lastModifs = [];
const server = new WebSocket.Server({
    port: 8080
});
let sockets = [];
server.on('connection', function(socket) {
    sockets.push(socket);

    // When you receive a message, send that message to every socket.
    socket.on('message', function(data) {
        data = JSON.parse(data.toString());

        // console.log(data.pseudo);
        // socket.request.headers.data = data.pseudo;

        lastModifs.push(data);
        sockets.forEach(s => s.send(JSON.stringify(selectModifsById(lastModifs, data.id))));

        let colorStats;        
        db.serialize(() => {
            // On récupère les stats de couleurs
            const statement = db.prepare("SELECT colorStats FROM canvas WHERE id = ?;");
            statement.get(data.id, (err, result) => {
                if (err) {
                    console.log(err.message);
                } else {
                    colorStats = result.colorStats;
                    let tmp = colorStats.split(',');
                    tmp.pop();
                    let colorStatsDict = {};
                    let tab;
                    for (let i = 0; i < tmp.length; i++) {
                        tab = tmp[i].split(':');
                        colorStatsDict[tab[0]] = tab[1];
                    }
                    colorStatsDict[data.id] = (parseInt(colorStatsDict[data.id]) + 1).toString();
                    let updatedColorStats = JSON.stringify(colorStatsDict).toString().replace(/\"/g, '').replace('{', '').replace('}', '') + ',';
                    console.log(updatedColorStats);
                    console.log('colors : ' + JSON.stringify(colorStatsDict).toString());

                    // On met à jour les stats de couleur
                    const statement2 = db.prepare("UPDATE canvas SET colorStats = ? where id = ?;");
                    statement2.run(updatedColorStats, data.id);
                    statement2.finalize();
                }
            });
            statement.finalize();
        });
        
        jimp.read('../frontend/assets/img/canvas/canva_' + data.id + '.png')
            .then(image => {
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                    if (x == data.x && y == data.y) {
                        this.bitmap.data[idx + 0] = data.color[0]; // red channel
                        this.bitmap.data[idx + 1] = data.color[1];   // green channel
                        this.bitmap.data[idx + 2] = data.color[2];   // blue channel
                    }
                });
                return image;
            })
            .then(image => {
                return image.write('../frontend/assets/img/canvas/canva_' + data.id + '.png');
            })
            .catch(err => {
                console.error(err);
            });
    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function() {
        // console.log('deco ', socket.request.headers.data);
        sockets = sockets.filter(s => s !== socket);
    });
});

// connecting an existing database (handling errors)
const db = new sqlite3.Database('./db/db_pixelwar.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
});

// Mathias Hersent
router.post('/info', function (req, res) {
    let data = req.body;
    db.serialize(() => {
        const statement = db.prepare("SELECT * FROM canvas INNER JOIN rooms ON canvas.id = rooms.id WHERE rooms.name = ?;");
        statement.get(data.name, (err, result) => {
            if (err) {
                console.log(err.message);
                res.json(null);
            } else if (result !== undefined) {
                let info = {};
                info.id = result.id;
                info.size = result.size;
                info.colors = result.colorStats;
                info.minTime = result.minimumTime;
                info.minTimeVIP = result.minimumTimeVIP;
                info.minRank = result.minimumRank;
                res.json(info);
            } else {
                res.json(null);
            }
        });
        statement.finalize();
    });
});

router.post("/get_time_to_wait", (req, res) => {
    // Auteur : Léo Zedek

    let data = req.body;
    let id = data["user_id"];

    db.serialize(() => {

        const statement = db.prepare("SELECT lastModifTime FROM user WHERE id = ?;");
        statement.get(id, (err, result) => {
            if (err) {
                console.error(err.message);
                res.json(null);
            }

            else if (result != undefined) {
                let last_modif_time = result["lastModifTime"];

                let time_now = Math.floor(Date.now() / 1000); // seconds since epoch

                res.json({time_since_last_modif : time_now - last_modif_time});
            }

            else {
                console.error("Id user not found : " + id);
                res.json(null);
            }
        })

        statement.finalize();

    });
});

router.post("/update_date", (req, res) => {
    // Auteur : Léo Zedek


    // Update in the database the variable lastModifTime of the user that match the id
    let data = req.body;
    let id = data["user_id"];

    db.serialize(() => {

        let time_now = Math.floor(Date.now() / 1000); // seconds since epoch 

        const statement = db.prepare("UPDATE user SET lastModifTime = ? where id = ?;");

        statement.run(time_now, id);

        statement.finalize();
    });
});

router.use('/', (req, res) => {
    res.render('canva.ejs', {pseudo: req.session.pseudo, userId: req.session.userId, connected : req.session.connected });
});

// handling errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
})

module.exports = router;
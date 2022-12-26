const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const jimp = require('jimp');
const WebSocket = require('ws');

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
        console.log('data: ' + data)
        lastModifs.push(data);
        sockets.forEach(s => s.send(JSON.stringify(lastModifs)));

        let nbPixels;
        db.serialize(() => {
            const statement = db.prepare("SELECT size FROM canvas WHERE id = ?;");
            statement.get(data.id, (err, result) => {
                if (err) {
                    console.log(err.message);
                } else {
                    nbPixels = result.size;
                }
            });
        });

        jimp.read('../frontend/assets/img/canvas/canva_' + data.id + '.png')
            .then(image => {
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                    if (x == data.x && y == data.y) {
                        console.log(idx);
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
            .then(() => {
                console.log('Image saved!');
            })
            .catch(err => {
                console.error(err);
            });
    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on('close', function() {
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
    console.log(data.name);
    db.serialize(() => {
        const statement = db.prepare("SELECT * FROM canvas INNER JOIN rooms ON canvas.id = rooms.id WHERE rooms.name = ?;");
        statement.get(data.name, (err, result) => {
            if (err) {
                console.log(err.message);
                res.json(null);
            } else if (result !== undefined) {
                console.log(result);
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
    });
});

router.use('/', (req, res) => {
    res.render('canva.ejs');
});

// handling errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
})

module.exports = router;
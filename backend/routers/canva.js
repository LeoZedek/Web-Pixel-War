const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const jimp = require('jimp');

// const WebSocket = require('ws');
// const app = require('../server');
// const server = app.listen(3000);
// const wss = new WebSocket.Server({ server });

// wss.on('connection', function connection(ws) {
//   // send the current hour to the client every second
//   setInterval(function() {
//     ws.send(new Date().toTimeString());
//   }, 1000);
// });

// connecting an existing database (handling errors)
const db = new sqlite3.Database('./db/test.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
});

let lastModifs = [];

// router.get('/websocket', (req, res, next) => {
//     // create a WebSocket server
//     console.log("get");
//     const wss = new WebSocket.Server({ noServer: true });
  
//     wss.on('connection', function connection(ws) {
//         // ws.on('message', function incoming(message) {
//         //     console.log('received: %s', message);
//         // });
//         console.log("connection");
//         setInterval(function() {
//             ws.send(JSON.stringify(lastModifs));
//         }, 1000);
    
//         // ws.send('something');
//     });
  
//     // upgrade the HTTP connection to a WebSocket connection
//     req.upgrade(wss, (ws) => {
//       // WebSocket connection established
//     });
//     next();
// });

// Mathias Hersent
router.post('/info', function (req, res) {
    let data = req.body;
    db.serialize(() => {
        const statement = db.prepare("SELECT * FROM canvas INNER JOIN rooms ON canvas.id = rooms.id WHERE rooms.name = ?;");
        statement.get(data.name, (err, result) => {
            if (err) {
                console.log(err.message);
                res.json(null);
            } else {
                let info = {};
                info.id = result.id;
                info.size = result.size;
                info.colors = result.colorStats;
                info.minTime = result.minimumTime;
                info.minTimeVIP = result.minimumTimeVIP;
                info.minRank = result.minimumRank;
                res.json(info);
            }
        });
    });
});

// Mathias Hersent
router.post('/update', function (req, res) {
    let data = req.body;
    lastModifs.push(data);
    console.log(data);
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

router.post('/getlastmodifs', function (req, res) {
    let data = req.body;

    res.json(JSON.stringify(lastModifs));
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
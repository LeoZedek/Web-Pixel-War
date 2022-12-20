const express = require('express');
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();

// connecting an existing database (handling errors)
const db = new sqlite3.Database('./db/test.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
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
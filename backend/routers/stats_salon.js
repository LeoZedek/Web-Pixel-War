const express = require('express');
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/test.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
});

router.post('/', (req, res) => {

	let data = req.body;
	let id_canva = data["id"];

	if (id_canva != null) {

		db.serialize(() => {
			const statement = db.prepare("SELECT canvaName, colorStats, nbModif FROM canvas WHERE id=?;");

			statement.get(id_canva, (err, result) => {
				if (err) {
					console.err(err.message);
				}
				else {
					if (result != null) {
						let canva_name = result["canvaName"];
						let color_stats = result["colorStats"];
						let nb_modif = result["nbModif"];

						res.render("stats_salon.ejs", {canva_name : canva_name, color_stats : color_stats, nb_modif : nb_modif});
					}
					else {
						res.status(406).end('<p>Wrong credentials! <a href="/"><button>Try again!</button></a></p>');
					}
				}
			})

			statement.finalize();
		})
	}

	else {
		console.err("id_canva pas valable");
	}

})

// Seulement pour tester, à retirer plus tard

router.get('/', (req, res) => {

	let data = req.query;
	let id_canva = data["id"];

	if (id_canva != null) {

		db.serialize(() => {
			const statement = db.prepare("SELECT name, colorStats, nbModif FROM canvas WHERE id=?;");

			statement.get(id_canva, (err, result) => {
				if (err) {
					console.err(err.message);
				}
				else {
					if (result != null) {
						let canva_name = result["name"];
						let color_stats = result["colorStats"];
						let nb_modif = result["nbModif"];

						console.log(canva_name);
						console.log(color_stats);
						console.log(nb_modif);

						res.render("stats_salon.ejs", {canva_name : canva_name, color_stats : color_stats, nb_modif : nb_modif});
					}
					else {
						res.status(406).end('<p>Wrong credentials! <a href="/"><button>Try again!</button></a></p>');
					}
				}
			})

			statement.finalize();
		})
	}

	else {
		console.err("id_canva pas valable");
	}

})

module.exports = router;

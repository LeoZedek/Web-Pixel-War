// Auteur du fichier : Léo Zedek

const express = require('express');
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/db_pixelwar.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
});

router.post('/get_statistics', (req, res) => {
	let data = req.body;
	let id_canva = data["id"];

	let canva_name, color_stats, nb_modif;
	const colors = {};
	let erreur_database = false;

	if (id_canva != null) {

		db.serialize(() => {
			const statement = db.prepare("SELECT CanvaName, colorStats, nbModif FROM canvas WHERE id=?;");

			statement.get(id_canva, (err, result) => {
				if (err) {
					console.err(err.message);
					erreur_database = true;
				}
				else {
					if (result != null) {
						canva_name = result["name"];
						color_stats = result["colorStats"];
						nb_modif = result["nbModif"];

						console.log(canva_name);
						console.log(color_stats);
						console.log(nb_modif);
					}
					else {
						console.error("Id not found : " + id_canva);
						erreur_database = true;
					}
				}
			})

			statement.finalize();

			db.all("SELECT * FROM colors;", (err, rows) => {
	            if (err || erreur_database) {
	                console.error("Erreur Database");
	            } else {
	                for (row in rows) {
	                    colors[rows[row].id] = rows[row].colorCode;
	                }

	                //console.log({colors : colors, canva_name : canva_name, color_stats : color_stats, nb_modif : nb_modif});
					res.json({colors : colors, canva_name : canva_name, color_stats : color_stats, nb_modif : nb_modif});
	            }
	        });
		})
	}

	else {
		erreur_database = true;
		console.log("id_canva pas valable");
	}
})

router.post('/', (req, res) => {
	let data = req.body;
	let id_canva = data["id"];
	
	res.render("stats_salon.ejs", {id_canva : id_canva});

})

// Seulement pour tester, à retirer plus tard

router.get('/', (req, res) => {
	let data = req.query;
	let id_canva = data["id"];
	
	res.render("stats_salon.ejs", {id_canva : id_canva});

})

module.exports = router;

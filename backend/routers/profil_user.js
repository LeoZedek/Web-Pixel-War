// Auteur : Léo Zedek

const express = require('express');
const router = express.Router();

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/test.sqlite', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database!');
});

router.post('/get_statistics', (req, res) => {
	let data = req.body;
	let id_user = data["id"];

	let pseudo, pwd_hash, vip_level, color_stats, nb_modif;
	const colors = {};
	let error_database = false;


	if (id_user != null) {

		db.serialize(() => {
			const statement = db.prepare("SELECT pseudo, pwdHash, vipLevel, colorStats, nbModif FROM user WHERE id=?;");

			statement.get(id_user, (err, result) => {
				if (err) {
					console.err(err.message);
					error_database = true;
				}
				else {
					if (result != null) {
						pseudo = result["pseudo"];
						pwd_hash = result["pwdHash"];
						vip_level = result["vipLevel"];
						color_stats = result["colorStats"];
						nb_modif = result["nbModif"];
						console.log("ljflq");
						console.log(pseudo);
						console.log(pwd_hash);
						console.log(vip_level);
						console.log(color_stats);
						console.log(nb_modif);
					}
					else {
						error_database = true;
						console.error("Id user not found : " + id_user);
					}
				}
			})

			statement.finalize();

			db.all("SELECT * FROM colors;", (err, rows) => {
	            if (err || error_database) {
	                console.error("Erreur requete AJAX");
	            } else {
	                for (row in rows) {
	                    colors[rows[row].id] = rows[row].colorCode;
	                }

	                res.json({
						colors : colors,
						pseudo : pseudo,
						pwd_hash : pwd_hash,
						vip_level : vip_level,
						color_stats : color_stats,
						nb_modif : nb_modif
					});
	            }
	        });
		})
	}

	else {
		console.log("id_user pas valable");
	}
})

router.use('/', (req, res) => {
	//let id_user = req.session.id_user;
	
	let id_user = 1;

	res.render("profil_user.ejs", {id_user : id_user});

})

module.exports = router;

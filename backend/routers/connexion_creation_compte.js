const express = require('express');
const bcrypt = require('bcryptjs')
const router = express.Router();

// add data to req.body (for POST requests)
router.use(express.urlencoded({ extended: true }));

const sqlite3 = require('sqlite3').verbose();

// connecting an existing database (handling errors)
const db  = new sqlite3.Database('./db/db_pixelwar.db', (err) => {
	if (err) {
	  console.error(err.message);
	}
	console.log('Connected to the database!');
});

//
//compte : demoxx bonjour
//admin admin
//

router.post('/verify', function(req, res){
	let sql = 'SELECT pseudo FROM user'
	var takenPseudo = false
	db.all(sql, [], (err, rows) => {
		var takenPseudo = false
		rows.forEach((row) => {
			if(req.body.pseudo === row.pseudo){
				takenPseudo = true
			}
		})
		res.send(takenPseudo)
	})
})

router.use('/connexion_creation_compte', function(req, res){
	res.render('connexion_creation_compte.ejs', {})
})

router.post('/signin', function(req, res){
	let data = req.body
	if( data["username_signin"]!= null && data["username_singin"]!= "" && data["password_signin"]!= null &&data["password_signin"]!= "" ){
		const statement = db.prepare("SELECT id, pseudo, pwdHash, vipLevel, avatarId, lastModifTime FROM user WHERE pseudo=?;")
		statement.get(data["username_signin"], (err, result) =>  {
			if(result != null){
				bcrypt.compare(data["password_signin"], result["pwdHash"], function(err, password_valid) {
					if (password_valid) {
						console.log("connexion reussie !")
						console.log(result["lastModifTime"])
						req.session.connected=true
						req.session.userId = result["id"]
						req.session.pseudo = result["pseudo"]
						req.session.vipLevel = result["vipLevel"]
						req.session.lastModifTime = result["lastModifTime"]
						console.log(req.session)
					}
					else{
						console.log("wrong pseudo or password!")
					}
				})
			} else {
				console.log("la database est vide!")
			}
		})
	}	
	res.redirect('/connexion_creation_compte')
})

router.post('/signup', function(req,res) {
	let data = req.body
	if(data["username_signup"]!= null && data["username_signup"]!= "" && data["password_signup"]!= null && data["password_signup"]!= "" && data["password_confirm_signup"]!= null &&data["password_confirm_signup"]!= "" ){
		if(data["password_signup"] === data["password_confirm_signup"]){
			//hashage du mot de passe
			password = data["password_signup"]
			bcrypt.hash(password, 10, function(err, hash) {
				db.serialize(() => {
					const statement = db.prepare("INSERT INTO user(pseudo, pwdHash, vipLevel, avatarId, colorStats, nbModif, lastModifTime) VALUES(?,?,?,?,?,?,?);")
					statement.run(data["username_signup"], hash, 0, 1, " ", 0, 0)
					statement.finalize()
					console.log("utilisateur enregistre")
				})
			})
		}


	}
	res.redirect('/connexion_creation_compte')

})

module.exports = router;
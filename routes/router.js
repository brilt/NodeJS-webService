// routes/router.js

const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");

const db = require("../lib/db.js");
const userMiddleware = require("../middleware/users.js");

router.post("/sign-up", userMiddleware.validateRegister, (req, res, next) => {
  db.query(
    `SELECT * FROM testLog WHERE LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: "This email is already in use!",
        });
      } else {
        // email is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err,
            });
          } else {
            // has hashed pw => add to database
            db.query(
              `INSERT INTO testLog (id, email, password, registered) VALUES ('${uuid.v4()}', ${db.escape(
                req.body.email
              )}, ${db.escape(hash)}, now())`,
              (err, result) => {
                if (err) {
                  //throw err;
                  return res.status(400).send({
                    msg: err,
                  });
                }
                return res.status(201).send({
                  msg: "Registered!",
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post("/login", (req, res, next) => {
  db.query(
    `SELECT * FROM testLog WHERE email = ${db.escape(req.body.email)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        //throw err;
        return res.status(400).send({
          msg: err,
        });
      }

      if (!result.length) {
        return res.status(401).send({
          msg: "email or password is incorrect!",
        });
      }

      // check password
      bcrypt.compare(
        req.body.password,
        result[0]["password"],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            //throw bErr;
            return res.status(401).send({
              msg: "email or password is incorrect!",
            });
          }

          if (bResult) {
            const token = jwt.sign(
              {
                email: result[0].email,
                userId: result[0].id,
              },
              "vivelatrinquette",
              {
                expiresIn: "7d",
              }
            );

            db.query(
              `UPDATE testLog SET last_login = now() WHERE id = '${result[0].id}'`
            );
            return res.status(200).send({
              msg: "Logged in!",
              token,
              user: result[0],
            });
          }

          return res.status(401).send({
            msg: "email or password is incorrect!",
          });
        }
      );
    }
  );
});

router.get("/places", function (req, res) {
  const sql3 = "SELECT * FROM places";

  db.query(sql3, (err, result) => {
    if (err) {
    console.log("ERROR LIGNE 122"+result);
      
    }
    if (err) throw err;

    res.json(result);
  });
});

router.post("/places", function (req, res) {
  const Name = req.body.Name;
  const Description = req.body.Description;
  const City = req.body.City;
  const Region = req.body.Region;
  const Link = req.body.Link;
  const Longitud = req.body.Longitud;
  const Latitude = req.body.Latitude;
  const Image = req.body.Image;

  const sql =
    "INSERT INTO places (Name, Description,City,Region,Link,Longitud,Latitude,Image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [Name, Description, City, Region, Link, Longitud, Latitude, Image],
    function (err, result) {
      if (err) throw err;
      console.log("ERROR LINE 146"+result);

      res.json(result);
    }
  );
});

router.post("/favorites", userMiddleware.isLoggedIn, (req, res, next) => {
  const userId = req.body.userId;
  const placeId = req.body.placeId;
  const Id = uuid.v4(); // Ajout de l'id unique
  const sqlSelect =
    "SELECT * FROM favorites WHERE userId = ? AND placeId = ?";
  const sqlInsert =
    "INSERT INTO favorites (Id, userId, placeId) VALUES (?, ?, ?)";
  const sqlDelete = "DELETE FROM favorites WHERE userId = ? AND placeId = ?";

  db.query(sqlSelect, [userId, placeId], (err, result) => {
    if (err) {
      return res.status(400).send({
        msg: err,
        isFav: false,
      });
    }

    if (result.length > 0) {
      // Le lien existe déjà, on le supprime
      db.query(sqlDelete, [userId, placeId], (err, result) => {
        if (err) {
          return res.status(400).send({
            msg: err,
            isFav: false,
          });
        }

        return res.status(200).send({
          msg: "Place has been successfuly deleted from favorites!",
          isFav: false,
        });
      });
    } else {
      // Le lien n'existe pas, on l'ajoute
      db.query(sqlInsert, [Id, userId, placeId], (err, result) => {
        if (err) {
          return res.status(400).send({
            msg: err,
            isFav: false,
          });
        }

        return res.status(200).send({
          msg: "Place successfuly added to favorites!",
          isFav: true,
        });
      });
    }
  });
});
router.post("/checkFavorites", userMiddleware.isLoggedIn, (req, res, next) => {
  const userId = req.body.userId;
  const placeId = req.body.placeId;

  const sqlSelect =
    "SELECT * FROM favorites WHERE userId = ? AND placeId = ?";

  db.query(sqlSelect, [userId, placeId], (err, result) => {
    if (err) {
      return res.status(400).send({
        msg: err,
      });
    }
    const favorite = result.length > 0;
    return res.status(200).send({
      favorite,
    });
  });
});

router.get("/orderFav", function (req, res) {
  const sql = 'SELECT placeId, COUNT(*) as count FROM favorites GROUP BY placeId ORDER BY count DESC';

  db.query(sql, (err, result) => {
    if (err) throw err;
    console.log("ERROR LINE 229"+result);

    res.json(result);
  });
})

router.get('/mail', (req, res) => {
  res.json({
      message: 'Vue Mailer Application ?? '
  });
});

module.exports = router;

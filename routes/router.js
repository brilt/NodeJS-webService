// routes/router.js

const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");

const db = require("../lib/db.js");
const userMiddleware = require("../middleware/users.js");

router.get("/secret-route", userMiddleware.isLoggedIn, (req, res, next) => {
  res.send("This is the secret content. Only logged in users can see that!");
});

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

router.get("/lugares", function (req, res) {
  const sql3 = "SELECT * FROM lugares";

  db.query(sql3, (err, result) => {
    if (err) throw err;
    console.log(result);

    res.json(result);
  });
});

router.post("/lugares", function (req, res) {
  const Nombre = req.body.Nombre;
  const Descripción = req.body.Descripción;
  const Ciudad = req.body.Ciudad;
  const Región = req.body.Región;
  const Enlace = req.body.Enlace;
  const Longitud = req.body.Longitud;
  const Latitud = req.body.Latitud;
  const Imagen = req.body.Imagen;

  const sql =
    "INSERT INTO lugares (Nombre, Descripción,Ciudad,Región,Enlace,Longitud,Latitud,Imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [Nombre, Descripción, Ciudad, Región, Enlace, Longitud, Latitud, Imagen],
    function (err, result) {
      if (err) throw err;
      console.log(result);

      res.json(result);
    }
  );
});

router.post("/favoris", userMiddleware.isLoggedIn, (req, res, next) => {
  const IdUsuario = req.body.IdUsuario;
  const IdLugar = req.body.IdLugar;
  const Id = uuid.v4(); // Ajout de l'id unique
  const sqlSelect =
    "SELECT * FROM favoritos WHERE IdUsuario = ? AND IdLugar = ?";
  const sqlInsert =
    "INSERT INTO favoritos (Id, IdUsuario, IdLugar) VALUES (?, ?, ?)";
  const sqlDelete = "DELETE FROM favoritos WHERE IdUsuario = ? AND IdLugar = ?";

  db.query(sqlSelect, [IdUsuario, IdLugar], (err, result) => {
    if (err) {
      return res.status(400).send({
        msg: err,
        isFav: false,
      });
    }

    if (result.length > 0) {
      // Le lien existe déjà, on le supprime
      db.query(sqlDelete, [IdUsuario, IdLugar], (err, result) => {
        if (err) {
          return res.status(400).send({
            msg: err,
            isFav: false,
          });
        }

        return res.status(200).send({
          msg: "Lieu retiré des favoris avec succès!",
          isFav: false,
        });
      });
    } else {
      // Le lien n'existe pas, on l'ajoute
      db.query(sqlInsert, [Id, IdUsuario, IdLugar], (err, result) => {
        if (err) {
          return res.status(400).send({
            msg: err,
            isFav: false,
          });
        }

        return res.status(200).send({
          msg: "Lieu ajouté en favori avec succès!",
          isFav: true,
        });
      });
    }
  });
});
router.post("/checkFavoritos", userMiddleware.isLoggedIn, (req, res, next) => {
  const IdUsuario = req.body.IdUsuario;
  const IdLugar = req.body.IdLugar;

  const sqlSelect =
    "SELECT * FROM favoritos WHERE IdUsuario = ? AND IdLugar = ?";

  db.query(sqlSelect, [IdUsuario, IdLugar], (err, result) => {
    if (err) {
      return res.status(400).send({
        msg: err,
      });
    }
    const favorito = result.length > 0;
    return res.status(200).send({
      favorito,
    });
  });
});

module.exports = router;

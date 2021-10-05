// Importaciones
const admin = require("firebase-admin");
const { Decrypt } = require("./../../helpers/cipher");

// Declaraciones
const db = admin.firestore();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Metodo para obtener los usuarios de la base de datos
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns retorna un json de usuarios
 */
controllers.getUsers = async (req, res) => {
    const { type } = req.query;
    let level = Decrypt(type);

    await db.collection("users").where("level", "==", level).get()
    .then(async (users) => {
        let array = [];

        users.forEach((user) => {
            let id = user.id;
            let data = user.data();

            array.push({ id, ...data });
        });

        return res.send({ data: array });
    })
    .catch(() => {
        return res.send({ message: "un error se ha producido mientras se estaba obteniendo a los usuarios", type: "error" });
    });
}

module.exports = controllers;
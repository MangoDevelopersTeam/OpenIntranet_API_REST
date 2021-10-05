// Importaciones
const admin = require("firebase-admin");

// Declaraciones
const auth = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Función que obtendra el nivel del usuario
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns Retorna el nivel del usuario
 */
controllers.getAccess = async (req, res) => {
    const { uid } = res.locals;
    
    let user = await auth.getUser(uid);
    return res.send({ code: "PROCESS_OK", level: user.customClaims?.level });
};

module.exports = controllers;
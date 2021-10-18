// Importaciones
const admin = require("firebase-admin");

// Objeto controllers que contendra los metodos
const controllers = {};


/**
 * Función que obtendra el nivel del usuario
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns Retorna el nivel del usuario
 */
controllers.getAccess = async (req, res) => {
    let { uid } = res.locals;
    
    let auth = admin.auth();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    await auth.getUser(uid)
    .then(result => {
        code = "PROCESS_OK";
        data = result.customClaims.level;
        type = "success";
        status = 200;
    })
    .catch(error => {
        code = error.response.data.error.message;
        message = error.response.data.error.message;
        type = "error";
        status = 404;
    })
    .finally(() => {
        res.status(status).send({ code: code, message: message, data: data, type: type });

        uid = null;
        code = null;
        data = null;
        message = null;
        type = null;
        auth = null;
        status = null;

        return;
    });
};


module.exports = controllers;
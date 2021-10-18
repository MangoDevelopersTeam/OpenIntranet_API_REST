// Importaciones
const admin = require("firebase-admin");
const { Decrypt, Encrypt } = require("./../../helpers/cipher");

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Metodo para obtener los usuarios de la base de datos
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns retorna un json de usuarios
 */
controllers.getUsers = async (req, res) => {
    let { levelParam } = req.query;

    let db = admin.firestore();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    if (levelParam === null)
    {
        code = "TYPE_PARAM_NULL";
        message = "El tipo de usuario no puede ser nulo"
        type = "error";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });

        code = null;
        data = null;
        message = null;
        type = null;
        status = null;

        return;
    }

    let level = Decrypt(levelParam);

    if (typeof(level) !== "string")
    {
        code = "DATA_TYPE_LEVEL_INVALID";
        message = "El tipo de dato enviado no es correcto";
        type = "error";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });

        code = null;
        data = null;
        message = null;
        type = null;
        status = null;

        return;
    }

    if (level === "student" || level === "teacher" || level === "proxie")
    {
        await db.collection("users").where("level", "==", level).get()
        .then(result => {
            let array = [];

            if (result.size > 0)
            {
                result.forEach(doc => {
                    array.push({
                        id: doc.id,
                        data: doc.data()
                    });
                });
            }

            code = "PROCESS_OK";
            data = Encrypt(array);
            type = "success";
            status = 200;
        })
        .catch(error => {
            code = error.response.data.error.message;
            message = error.response.data.error.message;
            type = "error";
            status = 400;
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
    }
    else
    {
        code = "LEVEL_INVALID";
        message = "El tipo de usuario enviado no esta admitido"
        type = "error";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });

        code = null;
        data = null;
        message = null;
        type = null;
        status = null;

        return;
    }
};


/**
 * Metodo para obtener el numero de administradores creados
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns retorna una respuesta del numero de administradores o un mensaje de error
 */
controllers.getNumbersOfAdmin = async (req, res) => {
    let db = admin.firestore();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    await db.collection("users").where("level", "==", "admin").get()
    .then(result => {
        code = "PROCESS_OK";
        data = result.docs.length;
        type = "success";
        status = 200;
    })
    .catch(error => {
        code = error.response.data.error.message;
        type = "error";
        status = 400;
    })
    .finally(() => {
        res.status(status).send({ code: code, message: message, data: data, type: type });

        db = null;
        code = null;
        data = null;
        message = null;
        type = null;
        status = null;

        return;
    });
};


/**
 * Metodo para obtener los usuarios de la base de datos buscando por la region y comuna
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns retorna una respuesta de los usuarios encontrados
 */
controllers.getUsersByRegionCommune = async (req, res) => {
    let { communeParam, regionParam } = req.query;

    let db = admin.firestore();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    let region = Decrypt(regionParam);
    let commune = Decrypt(communeParam);

    await db.collection("users").get()
    .then(result => {
        let filtered = result.docs.filter(x => Decrypt(x.data().region) === region && Decrypt(x.data().commune) === commune);

        let array = [];

        if (filtered.length > 0)
        {
            filtered.forEach(doc => {
                array.push({
                    id: doc.id,
                    data: doc.data()
                })
            });
        }

        code = "PROCESS_OK";
        data = array;
        type = "success";
        status = 200;
    })
    .catch(error => {
        code = "GET_USERS_ERROR";
        message = error.message;
        type = "error";
        status = 400;
    })
    .finally(() => {
        res.status(status).send({ code: code, message: message, data: data, type: type });
    
        code = null;
        data = null;
        message = null;
        type = null;
        status = null;
    
        return;
    });
} 


module.exports = controllers;
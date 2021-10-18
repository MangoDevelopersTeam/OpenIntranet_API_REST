// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Función para obtener las regiones
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Objeto json de las regiones
 */
controllers.getRegions = async (req, res) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {
        let array = [];

        await DB.collection("regions").get()
        .then(async (regionsRecord) => {
            if (regionsRecord.docs.length > 0)
            {
                regionsRecord.docs.forEach(region => {
                    array.push({
                        id: region.id,
                        data: region.data()
                    });
                });

                return res.send({ code: "PROCESS_OK", data: JSON.stringify(array), type: "success" });
            }

            return res.send({ code: "NO_REGIONS", message: "No existen regiones aún", type: "error" });
        })
        .catch((error) => {
            return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
        });
    } 
    catch (error) 
    {
        if (error.code == 'auth/id-token-revoked') 
        {
            return res.send({ code: "TOKEN_REVOKED", message: "Re-autenticate o deslogueate de la aplicación para acceder nuevamente", type: "error" });
        } 
        else 
        {
            return res.send({ code: "TOKEN_INVALID", message: "El token provisto es invalido", type: "error" });
        }
    }
}

/**
 * Función para obtener las comunas
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Objeto json de las comunas
 */
controllers.getCommunes = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {
        // Se obtiene el parametro query que se envia
        const { regionNumber } = req.query;

        // Array para almacenar los datos
        let array = [];

        // Se realiza la petición para obtener las regiones
        const communes = await DB.collection("regions").doc(regionNumber).collection("communes").get();

        // Se itera el resultado de la base de datos
        communes.forEach(commune => {
            let id = commune.id;
            let data = commune.data();
    
            array.push({ id, ...data });
        });

        // Se retorna el objeto de usuario
        return res.send({ code: "PROCESS_OK", data: JSON.stringify(array) });
    } 
    catch (error) 
    {
        // En caso de caer aca, se informará al usuario con codigos, en el caso de que la token este revocada o invalida
        if (error.code == 'auth/id-token-revoked') 
        {
            return res.status(401).send({ code: "TOKEN_REVOKED", message: "Re-autenticate o deslogueate de la aplicación para acceder nuevamente", type: "error" });
        } 
        else 
        {
            return res.status(401).send({ code: "TOKEN_INVALID", message: "El token provisto es invalido", type: "error" });
        }
    }
}

module.exports = controllers;
// Importaciones
const admin = require("firebase-admin");
const auth = admin.auth();

const { Decrypt } = require("../helpers/cipher");

const middlewares = {};

/**
 * Función para verificar si existe token
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @param {import("express").NextFunction} next objeto next
 * @returns mensaje de error o sigue con el programa
 */
middlewares.checkToken = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    try 
    {
        await auth.verifyIdToken(idToken, true)
        .then((token) => {
            res.locals.uid = token.uid;
            return next();
        })
        .catch(async (error) => {
            return res.send({ code: "FIREBASE_VERIFY_TOKEN_ERROR", message: error?.message, type: "error" });     
        });
    } 
    catch (error) 
    {
        if (error?.code == 'auth/id-token-revoked') 
        {
            return res.status(401).send({ code: "TOKEN_REVOKED", message: "Re-autenticate o deslogueate de la aplicación para acceder nuevamente", type: "error" });
        } 
        else 
        {
            return res.status(401).send({ code: "TOKEN_INVALID", message: "El token provisto es invalido", type: "error" });
        }
    }
};

/**
 * Función para verificar si el usuario es un administrador
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @param {import("express").NextFunction} next objeto next
 * @returns mensaje de error o sigue con el programa
 */
middlewares.checkIsAdmin = async (req, res, next) => {
    const { uid } = res.locals;

    await auth.getUser(uid)
    .then(async (user) => {
        const userLevel = Decrypt(await user?.customClaims?.level);

        if (userLevel === "admin")
        {
            return next();
        }
            
        return res.send({ code: "ACCESS_DENIED", message: "No tienes privilegios de administrador para esta operación", type: "error" });
    })
    .catch((error) => {
        return res.send({ code: "FIREBASE_GET_USER_ERROR", message: error.message, type: "error" }); 
    });
};

/**
 * Función para verificar si el usuario es un profesor
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @param {import("express").NextFunction} next objeto next
 * @returns mensaje de error o sigue con el programa
 */
 middlewares.checkIsTeacherStudent = async (req, res, next) => {
    const { uid } = res.locals;

    await auth.getUser(uid)
    .then(async result => {
        const userLevel = Decrypt(await result.customClaims.level);

        if (userLevel === "teacher" || userLevel === "student")
        {
            res.locals.level = result.customClaims.level;
            return next();
        }
            
        return res.send({ code: "ACCESS_DENIED", message: "No tienes privilegios de administrador para esta operación", type: "error" });
    })
    .catch((error) => {
        return res.send({ code: "FIREBASE_GET_USER_ERROR", message: error.message, type: "error" }); 
    });
}

module.exports = middlewares;
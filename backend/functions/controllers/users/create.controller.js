// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const db = admin.firestore();
const auth = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Función para crear y registrar un administrador
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.createAndRegisterAdmin = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    // Si existe un token, se guarda en una variable llamada idToken
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    try 
    {
        await auth.verifyIdToken(idToken, true)
        .then(async () => {
            const { user, id } = req.body;

            if (user !== null)
            {    
                const uid = Decrypt(id);
                const name = Decrypt(user.name);
                const surname = Decrypt(user.surname);
                const level = Decrypt(user.level);

                delete user.password;
                user.level = level;

                await db.collection("users").doc(uid).set(user)
                .then(async (createdUserRecord) => {
                    await auth.setCustomUserClaims(createdUserRecord.uid, { level: Encrypt(level) });
                    await auth.updateUser(createdUserRecord.uid, {
                        displayName: `${name} ${surname}`
                    });

                    return res.send({ code: "PROCESS_OK", message: "Usuario agregado existosamente", type: "success" });
                })
                .catch(async (error) => {
                    return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
                });

                return res.status(201).send({ code: "PROCESS_OK", message: "Operación realizada satisfactoriamente", type: "success" });       
            }

            return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });
        })
        .catch((error) => {
            return res.send({ code: "FIREBASE_VERIFY_TOKEN_ERROR", message: error.message, type: "error" });
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
            return res.send({ code: "SYSTEM_ERROR", message: error.message, type: "error" });
        }
    };
};


/**
 * Función para obtener los datos cruciales del usuario actual
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.whoami = async (req, res) => {
    const { uid } = res.locals;

    let user = await auth.getUser(uid);

    let object = {
        email: Encrypt(user?.email),
        displayName: Encrypt(user?.displayName),
    };

    return res.send(object);
};


/**
 * Función para verificar que el run no este duplicado en la base de datos
 * @param {String} run run del usuario
 * @returns {Boolean} booleano de si existe o no el run en la base de datos
 */
const checkExistRun = async (run) => {
    const usersRecord = await admin.firestore().collection("users").get();

    usersRecord?.forEach(async (userRecord) => {
        let userRun = await Decrypt(userRecord?.data()?.rut);
        
        if (userRun === run)
        {
            return true;
        }
    });

    return false;
}


/**
 * Metodo que recibe un objeto user y lo creará en la base de datos firestore
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Mensaje informativo al usuario
 */
controllers.createAndRegisterUser = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    // Si existe un token, se guarda en una variable llamada idToken
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    try 
    {
        await auth.verifyIdToken(idToken, true)
        .then(async (decodedToken) => {

            await auth.getUser(decodedToken.uid)
            .then(async (userRecord) => {
                const userUid = userRecord.uid;
                const userLevel = Decrypt(userRecord.customClaims.level);

                if (userLevel !== "admin")
                {
                    return res.send({ code: "UNAUTHORIZED_ACTION", message: "No tienes autorización para realizar esta acción", type: "error" });
                }

                const { user, courses } = req.body;

                if (user !== null && courses !== null)
                {
                    const run = Decrypt(user.rut);
                    const email = Decrypt(user.email);
                    const level = Decrypt(user.level);
                    const password = Decrypt(user.password);
                    const displayName = `${Decrypt(user.name)} ${Decrypt(user.surname)}`;
                    
                    const userCourses = Decrypt(courses);
                    
                    if (await checkExistRun(run) === true)
                    {
                        return res.send({ code: "RUN_EXIST", message: "El run ya existe", type: "error" });
                    }

                    if (level === "teacher")
                    {
                        user.courses = userCourses;
                    }

                    await auth.createUser({
                        displayName: displayName,
                        email: email,
                        password: password
                    })
                    .then(async (createdUserRecord) => {
                        await auth.setCustomUserClaims(createdUserRecord.uid, { level: user.level });

                        delete user.password;
                        user.level = level;
                        user.created_at = admin.firestore.FieldValue.serverTimestamp();
                        user.created_by = userUid;
                        user.deleted = false;
                            
                        await db.collection("users").doc(createdUserRecord.uid).set(user);
                        return res.send({ code: "PROCESS_OK", message: "Usuario agregado existosamente", type: "success" });
                    })
                    .catch(async (error) => {
                        return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
                    });
                }
                 
                return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });
            })
            .catch((error) => {
                return res.send({ code: "FIREBASE_GET_USER_ERROR", message: error.message, type: "error" }); 
            });
        })
        .catch((error) => {
            return res.send({ code: "FIREBASE_VERIFY_TOKEN_ERROR", message: error.message, type: "error" });     
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
            return res.send({ code: "SYSTEM_ERROR", message: error.message, type: "error" });
        }
    }
};

module.exports = controllers;
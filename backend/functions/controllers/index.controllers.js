// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../helpers/cipher");
const admin = require("firebase-admin");

// Inicialización del admin sdk para usarlo
admin.initializeApp();

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();
const BATCH = admin.firestore().batch();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Metodo que recibe un objeto user y crea un usuario en la DB
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Mensaje informativo al usuario
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
        await admin.auth().verifyIdToken(idToken, true)
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

                await admin.firestore().collection("users").doc(uid).set(user)
                .then(async (createdUserRecord) => {
                        await admin.auth().setCustomUserClaims(createdUserRecord.uid, { level: Encrypt(level) });
                        await admin.auth().updateUser(createdUserRecord.uid, {
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
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.whoami = async (req, res) => {
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
        // Se realiza la peticion para verificar el token y se obtiene el usuario
        const payloadVerifyToken = await AUTH.verifyIdToken(idToken, true);
        const resultGetUser = await AUTH.getUser(payloadVerifyToken.uid);

        // Se hace un objeto de usuario
        let dataObject = {
            email: Encrypt(resultGetUser.email),
            displayName: Encrypt(resultGetUser.displayName)
        };

        // Se retorna el objeto de usuario
        return res.send(dataObject);
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
};


/**
 * Función que verificará si tiene el nivel requerido
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Retorna si esta autorizado o un mensaje de error
 */
controllers.verifyAccess = async (req, res) => {
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
        // Se obtiene el parametro de la petición
        const { type } = req.query;

        // Se realiza la peticion para verificar el token y se obtiene el usuario
        const payloadVerifyToken = await AUTH.verifyIdToken(idToken, true);
        const resultGetUser = await AUTH.getUser(payloadVerifyToken.uid);

        // se realiza la comparación del nivel de usuaio
        if (Decrypt(type) === Decrypt(resultGetUser.customClaims.level))
        {
            return res.send({ access: true });
        }
        else
        {
            return res.send({ access: false });
        }
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
};


/**
 * Función que obtendra el nivel del usuario
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Retorna el nivel del usuario
 */
controllers.getAccess = async (req, res) => {
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
        // Se realiza la peticion para verificar el token y se obtiene el usuario
        await admin.auth().verifyIdToken(idToken, true)
        .then(async (decodedToken) => {

            await admin.auth().getUser(decodedToken.uid)
            .then((userRecord) => {
                return res.send({ code: "PROCESS_OK", level: userRecord.customClaims.level });
            })
            .catch((error) => {
                return res.send({ code: "FIREBASE_GET_USER_ERROR", message: error.message, type: "error" }); 
            })
        })
        .catch((error) => {
            return res.send({ code: "FIREBASE_VERIFY_TOKEN_ERROR", message: error.message, type: "error" });     
        })
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
};


/**
 * Función para crear las comunas y regiones
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Mensaje de regiones y comunas creadas
 */
controllers.setRegionsAndCommunes = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {
        const regionsLength = await DB.collection("regions").get();
        if (regionsLength.docs.length <= 0)
        {
            const regions = [
                {
                  "region": "Arica y Parinacota",
                  "numero": "XV",
                  "comunas": [
                    "Arica",
                    "Camarones",
                    "General Lagos",
                    "Putre"
                  ]
                },
                {
                  "region": "Tarapacá",
                  "numero": "I",
                  "comunas": [
                    "Alto Hospicio",
                    "Camiña",
                    "Colchane",
                    "Huara",
                    "Iquique",
                    "Pica",
                    "Pozo Almonte"
                  ]
                },
                {
                  "region": "Antofagasta",
                  "numero": "II",
                  "comunas": [
                    "Antofagasta",
                    "Calama",
                    "María Elena",
                    "Mejillones",
                    "Ollagüe",
                    "San Pedro de Atacama",
                    "Sierra Gorda",
                    "Taltal",
                    "Tocopilla"
                  ]
                },
                {
                  "region": "Atacama",
                  "numero": "III",
                  "comunas": [
                    "Alto del Carmen",
                    "Caldera",
                    "Chañaral",
                    "Copiapó",
                    "Diego de Almagro",
                    "Freirina",
                    "Huasco",
                    "Tierra Amarilla",
                    "Vallenar"
                  ]
                },
            ];

            regions.map(async (region) => {
                await DB.collection("regions").doc(region.numero).set({
                    region: region.region,
                    numero: region.numero
                });

                /* region.comunas.forEach((comuna) => {
                    const collectionRef = DB.collection("regionss").doc(region.numero).collection("wards").doc();
                    BATCH.create(collectionRef, { myData: comuna });
                }) */
                for (let i = 0; i < region.comunas.length; i++)
                {
                    await DB.collection("regions").doc(region.numero).collection("communes").add({
                        name: region.comunas[i],
                    });
                }

                /* await BATCH.commit(); */
            });

            res.send({ message: "regions added" });
        }
        else
        {
            res.send({ message: "the regions are added yet" });
        }
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


/**
 * Función para obtener las regiones
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Objeto json de las regiones
 */
controllers.getRegions = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {
        // array para almacenar los datos
        let array = [];

        // Se realiza la petición para obtener las regiones
        const regions = await DB.collection("regions").get();

        // Se itera el resultado de la base de datos
        regions.forEach(region => {
            let id = region.id;
            let data = region.data();
    
            array.push({ id, ...data });
        });

        // Se retorna el objeto de usuario
        return res.send(JSON.stringify(array));
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
        return res.send(JSON.stringify(array));
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
        await admin.auth().verifyIdToken(idToken, true)
        .then(async (decodedToken) => {

            await admin.auth().getUser(decodedToken.uid)
            .then(async (userRecord) => {
                const userLevel = Decrypt(userRecord.customClaims.level);

                if (userLevel === "admin")
                {
                    const { user } = req.body;

                    if (user !== null)
                    {
                        const displayName = `${Decrypt(user.name)} ${Decrypt(user.surname)}`;
                        const email = Decrypt(user.email);
                        const password = Decrypt(user.password);
                        const level = Decrypt(user.level);

                        await admin.auth().createUser({
                            displayName: displayName,
                            email: email,
                            password: password
                        })
                        .then(async (createdUserRecord) => {
                            await admin.auth().setCustomUserClaims(createdUserRecord.uid, { level: user.level });

                            delete user.password;
                            user.level = level;

                            await admin.firestore().collection("users").doc(createdUserRecord.uid).set(user);
                            return res.send({ code: "PROCESS_OK", message: "Usuario agregado existosamente", type: "success" });
                        })
                        .catch(async (error) => {
                            return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
                        });
                    }

                    return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });
                }
                
                return res.send({ code: "UNAUTHORIZED_ACTION", message: "No tienes autorización para realizar esta acción", type: "error" });
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
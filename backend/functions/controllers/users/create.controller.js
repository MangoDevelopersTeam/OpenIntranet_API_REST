// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../helpers/cipher");
const admin = require("firebase-admin");

// Inicialización del admin sdk para usarlo
admin.initializeApp();

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Metodo que recibe un objeto user y crea un usuario en la DB
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Mensaje informativo al usuario
 */
 controllers.createUser = async (req, res) => {
    // Se verifica si hay una token de autorización
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
        // Se verifica si el idToken provisto es valido o no
        await AUTH.verifyIdToken(idToken, true)
        .then(async () => {
            const { user } = req.body;

            if (user !== "" && user !== null)
            {
                try 
                {
                    // Se hace el registro del usuario en la base de datos
                    await DB.collection("users").doc(Decrypt(user.id)).set(user);

                    // Se actualiza el profile del usuario, debido a que el API REST de signup provisto por firebase no crea este apartado
                    await AUTH.updateUser(Decrypt(user.id), {
                        displayName: `${Decrypt(user.name)} ${Decrypt(user.lastName)}`,
                    });

                    // Se establece un custom claim del usuario, con el level de usuario
                    await AUTH.setCustomUserClaims(Decrypt(user.id), { level: user.level });

                    // Se informa que todo ha ocurrido de forma satisfactoria
                    return res.status(201).send({ code: "PROCESS_OK", message: "Operación realizada satisfactoriamente", type: "success" });
                } 
                catch (error) 
                {
                    return res.status(400).send({ code: "FIREBASE_ERROR", message: error.message, type: "error" });
                }
            }

            return res.status(400).send({ code: "EMPTY_FIELDS", message: "Complete todos los campos", type: "error" });
        })
        .catch((error) => {
            // En caso de caer aca, se informará al usuario con codigos, en el caso de que la token este revocada o invalida
            if (error.code == 'auth/id-token-revoked') 
            {
                return res.status(401).send({ code: "TOKEN_REVOKED", message: "Re-autenticate o deslogueate de la aplicación para acceder nuevamente", type: "error" });
            } 
            else 
            {
                return res.status(401).send({ code: "TOKEN_INVALID", message: "El token provisto es invalido", type: "error" });
            }
        });
    } 
    catch (error) 
    {
        return res.status(401).send({ code: "UNAUTHORIZED_ACTION", message: "Acción no autorizada", type: "error" });
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

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    try 
    {
        const payload = await AUTH.verifyIdToken(idToken, true);
        const data = await DB.collection("users").doc(payload.uid).get();
        
        return res.send({
            id: Encrypt(data.id),
            data: Encrypt(data.data()),
        })
        /* await AUTH.verifyIdToken(idToken, true)
        .then(async(payload) => {
            let data = await DB.collection("users").doc(payload.uid).get();
            return res.send({
                id:Encrypt(data.id),
                data:Encrypt(data.data()),
            })
            
        })
        .catch((error) => {
            // En caso de caer aca, se informará al usuario con codigos, en el caso de que la token este revocada o invalida
            if (error.code == 'auth/id-token-revoked') 
            {
                return res.status(401).send({ code: "TOKEN_REVOKED", message: "Re-autenticate o deslogueate de la aplicación para acceder nuevamente", type: "error" });
            } 
            else 
            {
                return res.status(401).send({ code: "TOKEN_INVALID", message: "El token provisto es invalido", type: "error" });
            }
        }); */
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
        //return res.status(401).send({ code: "UNAUTHORIZED_ACTION", message: "Acción no autorizada", type: "error" });
    }
};

module.exports = controllers;
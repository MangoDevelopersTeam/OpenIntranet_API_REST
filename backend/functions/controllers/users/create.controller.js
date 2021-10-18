// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Objeto controllers que contendra los metodos
const controllers = {};


/**
 * Función para obtener los datos cruciales del usuario actual
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.whoami = async (req, res) => {
    let { uid } = res.locals;

    let auth = admin.auth();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    let object = {
        email: "",
        displayName: ""
    };

    await auth.getUser(uid)
    .then(result => {
        object.displayName = Encrypt(result.displayName);
        object.email = Encrypt(result.email);

        code = "PROCESS_OK";
        data = Encrypt(object);
        type = "success";
        status = 200;
    })
    .catch(error => {
        code = "FIREBASE_GET_USER_ERROR";
        message = error.message;
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


/**
 * Función para verificar que el run no este duplicado en la base de datos
 * @param {string} run run del usuario
 * @returns booleano de si existe o no el run en la base de datos
 */
const checkExistRun = async (run) => {
    let db = admin.firestore();

    let data = {
        exist: false,
        error: false,
        message: "",
        code: ""
    };

    await db.collection("users").get()
    .then(result => {
        let exist = result.docs.find(x => Decrypt(x.data().rut) === run).exists;

        if (exist)
        {
            data.exist = true;
            data.code = "RUN_ALREADY_EXIST";
            data.message = "El run enviado ya está registrado";
        }
        else
        {
            data.code = "PROCESS_OK";
        }
    })
    .catch(error => {
        data.code = "FIREBASE_GET_USERS_ERROR";
        data.error = true;
        data.message = error.message;
    })
    .finally(() => {
        return data;
    });

    return data;
};


/**
 * Metodo que recibe un objeto user y creará un usuario en intranet
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns Mensaje informativo al usuario
 */
controllers.createAndRegisterUser = async (req, res) => {
    let { uid } = res.locals;
    let { user, courses, grades } = req.body;

    let db = admin.firestore();
    let auth = admin.auth();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    if (user !== null && courses !== null && grades !== null)
    {
        let run = Decrypt(user.rut);
        let email = Decrypt(user.email);
        let level = Decrypt(user.level);
        let password = Decrypt(user.password);
        let displayName = `${Decrypt(user.name)} ${Decrypt(user.surname)}`;
                  
        if (level === "teacher" || level === "student" || level === "proxie")
        {
            let checkRunExist = await checkExistRun(run);

            if (checkRunExist.exist === true)
            {
                code = checkRunExist.code;
                message = checkRunExist.message; 
                type = "error";
                status = 400;

                res.status(400).send({ code: code, message: message, data: data, type: type });

                uid = null;
                user = null;
                courses = null;
                grades = null;
                db = null;
                auth = null;
                status = null;

                return;
            }

            if (level === "teacher")
            {
                let dataUserCourses = Decrypt(courses);

                dataUserCourses.forEach(doc => {
                    doc = doc.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                });

                user.courses = dataUserCourses;
            }

            if (level === "student")
            {
                let dataUserGrades = Decrypt(grades);        

                let grade = dataUserGrades.grade.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                let number = dataUserGrades.number;
                let letter = dataUserGrades.letter.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

                user.grade = grade;
                user.number = number;
                user.letter = letter;
            }

            await auth.createUser({
                displayName: displayName,
                email: email,
                password: password
            })
            .then(async result => {
                await auth.setCustomUserClaims(result.uid, { level: user.level })
                .catch(error => {
                    code = "FIREBASE_SET_CLAIMS_ERROR";
                    message = error.message;
                    type = "error";
        
                    res.send({ code: code, message: message, data: data, type: type });
        
                    uid = null;
                    user = null;
                    courses = null;
                    grades = null;
                    db = null;
                    auth = null;
        
                    return;
                });
            
                delete user.password;
                user.level = level;
                user.created_at = admin.firestore.FieldValue.serverTimestamp();
                user.created_by = uid;
                user.deleted = false;

                await db.collection("users").doc(result.uid).set(user)
                .then(() => {
                    code = "PROCESS_OK";
                    message = "Usuario agregado existosamente";
                    type = "success";
                    status = 201;
                })
                .catch(error => {
                    code = error.response.data.error.message;
                    type = "error";
                    status = 400;
                })
                .finally(() => {
                    res.status(status).send({ code: code, message: message, data: data, type: type });

                    uid = null;
                    user = null;
                    courses = null;
                    grades = null;
                    db = null;
                    auth = null;
                    status = null;

                    return;
                });
            })
            .catch(error => {
                code = error.response.data.error.message;
                type = "error";
                status = 400;

                res.status(status).send({ code: code, message: message, data: data, type: type });

                uid = null;
                user = null;
                courses = null;
                grades = null;
                db = null;
                auth = null;
                status = null;

                return;
            });
        }
        else
        {
            code = "LEVEL_SENT_INVALID";
            message = "El nivel enviado no es valido"; 
            type = "error";
            status = 400;
            
            res.status(status).send({ code: code, message: message, data: data, type: type });

            uid = null;
            user = null;
            courses = null;
            grades = null;
            db = null;
            auth = null;
            status = null;

            return;
        }
    }
    else
    {
        code = "NO_DATA_SEND";
        message = "Asegurate de que hayas completado los campos del formulario";
        type = "info";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });

        uid = null;
        user = null;
        courses = null;
        grades = null;
        db = null;
        auth = null;
        status = null;

        return;
    }
};

/**
 * Función para crear y registrar un administrador
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.createAndRegisterAdmin = async (req, res) => {
    let { user, id } = req.body;

    let db = admin.firestore();
    let auth = admin.auth();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    if (user !== null && id !== null)
    {    
        let uid = Decrypt(id);
        let name = Decrypt(user.name);
        let surname = Decrypt(user.surname);
        let level = Decrypt(user.level);

        delete user.password;
        user.level = level;
        user.created_at = admin.firestore.FieldValue.serverTimestamp();
        user.created_by = uid;

        await db.collection("users").doc(uid).set(user)
        .then(async () => {
            await auth.setCustomUserClaims(uid, { level: Encrypt(level) });
            await auth.updateUser(uid, {
                displayName: `${name} ${surname}`
            });

            code = "PROCESS_OK";
            message = "Usuario agregado existosamente";
            type = "success";
            status = 201;
        })
        .catch(async (error) => {
            code = error.response.data.error.message;
            type = "error";
            status = 400;
        })
        .finally(() => {
            res.status(status).send({ code: code, message: message, data: data, type: type });

            user = null;
            courses = null;
            grades = null;
            db = null;
            auth = null;
            status = null;

            return;
        });
    }
    else
    {
        code = "NO_DATA_SEND";
        message = "Asegurate de que hayas completado los campos del formulario";
        type = "info";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });

        user = null;
        courses = null;
        grades = null;
        db = null;
        auth = null;
        status = null;

        return;
    }
};


module.exports = controllers;
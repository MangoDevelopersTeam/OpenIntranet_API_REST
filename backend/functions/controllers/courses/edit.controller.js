// Importaciones
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaraciones
const db = admin.firestore();
const auth = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Función para actualizar datos de una asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
/* controllers.editCourse = async(req, res) => {
    const { id, code, type, grade, courseName, description } = req.body;

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

    const decodedToken = await AUTH.verifyIdToken(idToken, true);
    const userRecord = await AUTH.getUser(decodedToken.uid);

    const userLevel = Decrypt(userRecord.customClaims.level);

    if (userLevel === "admin") {

        await DB.collection("courses").doc(id).update({
            code: code,
            type: type,
            grade: grade,
            couseName: courseName,
            description: description
        }).then(() => {
            return res.send({ code: "PROCESS_OK", message: "Asignatura actualizada existosamente", type: "success" });
        }).catch(() => {
            return res.send({ code: "ERROR", message: "La asignatura no se pudo actualizar", type: "error" })
        })
    }
    return res.send({ code: "ACCESS_DENIED", message: "No tienes privilegios de administrador para esta operación", type: "error" });

}; */



/**
 * Función que actualiza si un profesor es ayudante o no
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.editTeacherHelper = async (req, res) => {
    const { courseId, teacherId } = req.query;
    const { helperState } = req.body;

    if (courseId !== "" && teacherId !== "" && helperState !== "" )
    {
        let idCourse = Decrypt(courseId);
        let idTeacher = Decrypt(teacherId);
        let helperValue = !helperState;

        if (helperState === false)
        {
            let helpersLength = await db.collection("courses").doc(idCourse).collection("teachers").where("helper", "==", true).get();

            if (helpersLength?.docs?.length === 0)
            {
                await db.collection('courses').doc(idCourse).collection('teachers').doc(idTeacher).update({
                    helper: helperValue
                })
                .catch((error)=>{
                    return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
                })

                let helpers = await db.collection("courses").doc(idCourse).collection("teachers").where("helper", "==", true).get();
                let helpersArray = [];

                if (helpers.docs.length > 0)
                {
                    helpers.forEach(helper => {
                        helpersArray.push(helper.id);
                    })
                }

                return res.send({ code: "PROCESS_OK", message: "Datos actualizados", dataHelpers: Encrypt(helpersArray), type: "success" });
            }
            else
            {
                return res.send({ code: "HELPER_EXIST", message: "Ya existe un ayudante en el curso", type: "info" });
            }
        }
        else
        {
            await db.collection('courses').doc(idCourse).collection('teachers').doc(idTeacher).update({
                helper: helperValue
            })
            .catch((error)=>{
                return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
            })

            let helpers = await db.collection("courses").doc(idCourse).collection("teachers").where("helper", "==", true).get();
            let helpersArray = [];

            if (helpers.docs.length > 0)
            {
                helpers.forEach(helper => {
                    helpersArray.push(helper.id);
                })
            }

            return res.send({ code: "PROCESS_OK", message: "Datos actualizados", dataHelpers: Encrypt(helpersArray), type: "success" });
        }
    }

    return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });  
};

module.exports = controllers;
// Importación de los metodos encrypt y decrypt
const { Decrypt, Encrypt } = require("./../../helpers/cipher");

// Importación admin sdk
const admin = require("firebase-admin");

// Declaración de constantes para acortar la escritura
const db = admin.firestore();
const auth = admin.auth();

const controllers = {};

/**
 * Función para eliminar una asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.deleteCourse = async(req, res) => {
    const { id } = req.body;

    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    // Si existe un token, se guarda en una variable llamada idToken
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    const decodedToken = await auth.verifyIdToken(idToken, true);
    const userRecord = await auth.getUser(decodedToken.uid);

    const userLevel = Decrypt(userRecord.customClaims.level);



    if (userLevel === "admin") {
        await db.collection("courses").doc(id).delete()
            .then(() => {
                return res.send({ code: "PROCESS_OK", message: "Asignatura eliminada existosamente", type: "success" });
            }).catch(() => {
                return res.send({ code: "ERROR", message: "La asignatura no se pudo eliminar", type: "error" })
            })
    }
    return res.send({ code: "ACCESS_DENIED", message: "No tienes privilegios de administrador para esta operación", type: "error" });
};

/**
 * Función para remover a un profesor de un curso
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns mensaje informativo al usuario o el arreglo de usuario en el curso
 */
controllers.removeTeacherCourse = async (req, res) => {
    const { courseId, teacherId } = req.query;

    let idCourse = Decrypt(courseId);
    let idTeacher = Decrypt(teacherId);

    await db.collection("courses").doc(idCourse).collection("teachers").doc(idTeacher).delete()
    .catch((error) => {
        return res.send({ code: "FIREBASE_DELETE_TEACHER_COURSE_ERROR", message: error.message, type: "error" });
    });


    await db.collection("users").doc(idTeacher).collection("courses").doc(idCourse).delete()
    .catch((error) => {
        return res.send({ code: "FIREBASE_DELETE_USER_COURSE_ERROR", message: error.message, type: "error" });
    });

    let teachers = await db.collection("courses").doc(idCourse).collection("teachers").get();
    let helpers = await db.collection("courses").doc(idCourse).collection("teachers").where("helper", "==", true).get();

    let teachersArray = [];
    let helpersArray = [];

    if (teachers.docs.length > 0)
    {
        teachers.forEach(teacher => {
            teachersArray.push(teacher.id);
        });
    }

    if (helpers.docs.length > 0)
    {
        helpers.forEach(helper => {
            helpersArray.push(helper.id);
        })
    }

    return res.send({ code: "PROCESS_OK", message: "Profesor removido correctamente", data: Encrypt(teachersArray), dataHelpers: Encrypt(helpersArray), type: "success" });
};

module.exports = controllers;
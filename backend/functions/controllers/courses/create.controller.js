// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const db = admin.firestore();
const auth = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};


/**
 * Función para generar el codigo del curso
 * @param {String} courseName nombre del curso
 * @param {String} grade grado del curso
 * @returns {String} codigo generado del curso
 */
const generateCode = (courseName, grade) => {
    let splitCourse = courseName.split(" ");
                        
    let code = "";

    for (let i = 0; i < splitCourse.length; i++)
    {
        let sliced = "";
        
        if (splitCourse[i].length >= 4)
        {
            sliced = splitCourse[i].slice(0, 4).toLocaleUpperCase();
        }
        else
        {
            sliced = splitCourse[i].toLocaleUpperCase();
        }

        code += sliced;
    }
    
    code = code.concat(grade).toUpperCase();

    return code;
}

 
/**
 * Función para verificar si el codigo del curso exite o nó
 * @param {String} code codigo generado del curso
 * @returns {Boolean} si existe o no el codigo
 */
const verifyExistCourse = async (courseName, grade) => {
    let code = generateCode(courseName, grade);
    let findCourse = await db.collection("courses").where("code", "==", code).get();

    if (findCourse?.docs?.length > 0)
    {
        return true;
    }

    return false;
}


/**
 * Función para obtener el token desde el header
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns {String} token obtenida desde el header
 */
const manageAuthToken = (req, res) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    return idToken;
}


/**
 * Función para crear y registrar una asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.createCourse = async (req, res)=>{
    let idToken = manageAuthToken(req, res);

    try 
    {
        await auth.verifyIdToken(idToken, true).then(async (decodedToken) => {
            await auth.getUser(decodedToken?.uid).then(async (userRecord) => {
                const userLevel = Decrypt(userRecord?.customClaims?.level);

                if (userLevel === "admin")
                {
                    const { course } = req.body;

                    if (course !== null)
                    {
                        const courseName = Decrypt(course?.courseName);
                        const grade = Decrypt(course?.grade);
                        
                        if (verifyExistCourse(courseName, grade) === true)
                        {
                            return res.send({ code: "EXISTING_COURSE", message: `El curso ${course.code} ya existe`, type: "warning" });
                        }
                        
                        course.code = generateCode(courseName, grade);
                        course.created_at = admin.firestore.FieldValue.serverTimestamp();
                        await db.collection("courses").add(course).then(() => {
                            return res.send({ code: "PROCESS_OK", message: "Asignatura creada exitosamente", type: "success" });
                        })
                        .catch(() => {
                            return res.send({ code: "ERROR", message: "La asignatura no se ha podido crear", type: "error" })
                        });
                    }

                    return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });
                }
                
                return res.send({ code: "ACCESS_DENIED", message: "No tienes privilegios de administrador para esta operación", type: "error" });
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


/**
 * Función para establecer a uno o dos docentes dentro de una asignatura
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response 
 */
controllers.setTeachersCourse = async (req, res) => {
    let idToken;

    if (req?.headers?.authorization && req?.headers?.authorization?.startsWith('Bearer ')) 
    {
        idToken = req?.headers?.authorization?.split('Bearer ')[1];
    }

    let decodedToken = await auth.verifyIdToken(idToken);

    const { teacher } = req.body;
    const { courseId } = req.query;

    let teacherData = Decrypt(teacher);
    
    let idTeacher = teacherData?.id;
    let idCourse = Decrypt(courseId);

    let codeCourse = teacherData?.courseCode;
    let nameCourse = teacherData?.courseName;
    let typeCourse = teacherData?.courseType;

    delete teacherData.id;
    delete teacherData.courseCode;
    delete teacherData.courseName;
    delete teacherData.courseType;

    teacherData.created_at = admin.firestore.FieldValue.serverTimestamp();
    teacherData.created_by = decodedToken?.uid;

    let teachersLength = await db.collection("courses").doc(idCourse).collection("teachers").get();
 
    if (teachersLength?.docs?.length <= 2)
    {
        let helper = false;

        if (teacherData?.helper === true)
        {
            teachersLength.forEach(teacherData => {
                if (teacherData.data()?.helper === true)
                {
                    return helper = true;
                }
            });
        }   

        if (helper === false)
        {
            await db.collection("courses").doc(idCourse).collection("teachers").doc(idTeacher).set(teacherData)
            .catch((error) => {
                return res.send({ code: "FIREBASE_SET_TEACHER_COURSE_ERROR", message: error.message, type: "error" });
            });


            await db.collection("users").doc(idTeacher).collection("courses").doc(idCourse).set({
                code: codeCourse,
                name: nameCourse,
                subject: typeCourse,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                created_by: decodedToken?.uid
            })
            .catch((error) => {
                return res.send({ code: "FIREBASE_SET_USER_COURSE_ERROR", message: error.message, type: "error" });
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

            return res.send({ code: "PROCESS_OK", message: "Profesor asignado correctamente", data: Encrypt(teachersArray), dataHelpers: Encrypt(helpersArray), type: "success" });
        }
        else
        {
            return res.send({ code: "HELPER_EXIST", message: "Ya existe un ayudante en el curso", type: "info" });
        }
    }
    else
    {
        return res.send({ code: "TEACHERS_LIMIT_REACHED", message: "Ya existen 2 profesores, no puede añadir más", type: "error" });
    }
}

module.exports = controllers;
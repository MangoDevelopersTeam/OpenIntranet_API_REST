const { Decrypt, Encrypt } = require("../../helpers/cipher");
const admin = require("firebase-admin");

const controllers = {};

/**
 * Función para obtener los cursos del profesor que este logueado
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 */
controllers.getUserCourses = async (req, res) => {
    let { uid, level } = res.locals;

    let db = admin.firestore();
    
    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    if (level === null)
    {
        code = "LEVEL_NULL";
        message = "El nivel no debe ser nulo";
        type = "error";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });
            
        message = null;
        status = null;
        code = null;  
        data = null;
        type = null;
        db = null;

        return;
    }

    if (Decrypt(level) === "student" || Decrypt(level) === "teacher")
    {
        await db.collection("users").doc(uid).collection("courses").get()
        .then(result => {
            if (result.docs.length > 0)
            {
                let array = [];

                result.forEach(doc => {
                    array.push({
                        id: doc.id,
                        data: Encrypt(doc.data())
                    });
                });

                code = "PROCESS_OK";
                data = Encrypt(array);
                type = "success";
                status = 200;
            }
            else
            {
                code = "NO_COURSES";
                message = "No existen cursos asignados";
                type = "error";
                status = 404;
            }
        })
        .catch(error => {
            code = "FIREBASE_GET_COURSES_ERROR";
            message = error.message;
            type = "error";
            status = 400;
        })
        .finally(() => {
            res.status(status).send({ code: code, message: message, data: data, type: type });
            
            message = null;
            status = null;
            code = null;  
            data = null;
            type = null;
            db = null;

            return;
        });
    }
    else
    {
        code = "LEVEL_INVALID";
        message = "El nivel que ha enviado no es el correcto";
        type = "error";
        status = 400;

        res.status(status).send({ code: code, message: message, data: data, type: type });
            
        message = null;
        status = null;
        code = null;  
        data = null;
        type = null;
        db = null;

        return;
    }
};



controllers.getDetailedCourse = async (req,res)=>{
    let { courseID } = req.query;
    let db = admin.firestore();

    let code = "";
    let data = null;
    let message = "";
    let type = "";
    let status = 0;

    let course = {
        course: null,
        units: null
    }

    await db.collection('courses').doc(courseID).get()
    .then(async (res)=>{
        let courseData = [];

        courseData.push({
            id: res.id,
            data: res.data()
        })

        course.course = courseData;
    
        await db.collection('courses').doc(courseID).collection('units').orderBy("numberUnit", "asc").get()
        .then((units)=>{
            let arrai = []

            units.forEach(elem =>{
                arrai.push({
                    id:elem.id,
                    unit:elem.data()
                })
            })

            course.units = arrai;
        })

        //resultado
        code = "PROCESS_OK";
        data = course;
        type = "success";
        status = 200;

    })
    .catch(error =>{
        code = "FIREBASE_GET_COURSES_ERROR";
            message = error.message;
            type = "error";
            status = 400;
    })
    .finally(()=>{
        res.status(status).send({ code: code, message: message, data: data, type: type });
            
        message = null;
        status = null;
        code = null;  
        data = null;
        type = null;
        db = null;

        return;
    })
}

module.exports = controllers;
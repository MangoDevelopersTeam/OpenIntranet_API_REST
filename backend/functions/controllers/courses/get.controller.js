const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

const db = admin.firestore();
const auth = admin.auth();

const controllers = {};

const getCoursesNoPage = async (page) => {
    let array = [];

    await db.collection("courses").orderBy("created_at").startAt(0).limit(5).get()
    .then((coursesRecord) => {
        if (coursesRecord?.docs?.length > 0)
        {
            coursesRecord?.docs?.forEach(course => {
                array.push({
                    id: course?.id,
                    data: course?.data(),
                });
            });

            return res.send({ code: "PROCESS_OK", data: array, page: page, type: "success" });
        }

        return res.send({ code: "NO_REGIONS", message: "No existen regiones aún", type: "error" });
    })
    .catch((error) => {
        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
    });
}

/**
 * Función para obtener los cursos
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Objeto json de las regiones
 */
controllers.getCourses = async (req, res) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {   
        const { page } = req.query;

        /* if (page <= 1)
        {
            await getCoursesNoPage(page);
        }
        else
        { */
            await db.collection("courses").orderBy("created_at").get()
            .then(async snapshot => {

                // Obtener paginas
                const staticSize = snapshot.size; // 7

                let size = staticSize; // 7
                let array = [];

                size = size/5; //1,4
                size = Math.floor(size);

                if (staticSize % 5 !== 0)
                {
                    size++;
                }

                // size: 2

                let a = 0; // a = 0

                if (page) // page: 2
                {
                    a = page * 5; // -> 10
                }

                let b = 0; // -> 5
                
                if (staticSize > 5)
                {
                    b = a - 5; // -> 5
                }

                //return res.send({ code: "PROCESS_OK", a: a, b: b, paginas: size, type: "success" });

                /* if (page > 1)
                {   
                    await db.collection("courses").orderBy("created_at").startAfter(b).limit(a).get()
                    .then((coursesRecord) => {
                        if (coursesRecord?.docs?.length > 0)
                        {
                            coursesRecord?.docs?.forEach(course => {
                                array.push({
                                    id: course?.id,
                                    data: course?.data(),
                                });
                            });

                            return res.send({ code: "PROCESS_OK", data: array, paginas: size, type: "success" });
                        }

                        return res.send({ code: "NO_REGIONS", message: "No existen regiones aún", type: "error" });
                    })
                    .catch((error) => {
                        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
                    });
                }
                else
                { */
                    /* await db.collection("courses").orderBy("indice").startAt(b).limit(a).get() */
                    await db.collection("courses").get()
                    .then((coursesRecord) => {
                        if (coursesRecord?.docs?.length > 0)
                        {
                            coursesRecord?.docs?.forEach(course => {
                                array.push({
                                    id: course?.id,
                                    data: course?.data(),
                                });
                            });

                            return res.send({ code: "PROCESS_OK", data: array, paginas: size, type: "success" });
                        }

                        return res.send({ code: "NO_REGIONS", message: "No existen regiones aún", type: "error" });
                    })
                    .catch((error) => {
                        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
                    });
                /* } */
                
            });


        /* } */
        /* let queryLength = query.docs.length; */


        

        /* let longitud = 11;
        let longitudd = longitud;

        longitud = longitud/5;
        longitud = Math.floor(longitud);
        if(longitudd%5!=0){
            longitud++
    } */


        //console.log(longitud);








        

        /* db.collection("courses").orderBy("created_at").startAt(0).limit(5).get()
        .then((coursesRecord) => {
            if (coursesRecord?.docs?.length > 0)
            {
                coursesRecord?.docs?.forEach(course => {
                    array.push({
                        id: course?.id,
                        data: course?.data(),
                    });
                });

                let longitud = array.length
                longitud = longitud/5;
                Math.floor(longitud);

                return res.send({ code: "PROCESS_OK", data: array, type: "success" });
            }

            return res.send({ code: "NO_REGIONS", message: "No existen regiones aún", type: "error" });
        })
        .catch((error) => {
            return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
        }); */
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
 * Función para buscar el curso por la id
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Objeto con la información de la asignatura
 */
controllers.getCourseById = async (req, res)=>{
    const { id } = req.query;

    await db.collection('courses').doc(id).get()
    .then(async (course) => {
        let exist = course?.exists;

        if (exist === true)
        {
            return await res.send({ code: "PROCESS_OK", finded: true, data: Encrypt(course?.data()), type: "success" });
        }

        return await res.send({ code: "COURSE_NOT_FOUND", finded: false, data: undefined, message: "No se encontro el curso con el id enviado", type: "error" });
    })
    .catch(async (error) => {
        return await res.send({ code: "FIREBASE_GET_ERROR", message: error?.message, type: "error" });
    });
};

/**
 * Función para obtener los profesores que esten ligados a los cursos de la asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns arreglo de usuarios de profesores ligados a la asignatura
 */
controllers.getTeachers = async (req, res) => {
    const { course } = req.query;

    await db.collection("users").where("level", "==", "teacher").where("courses", "array-contains", course).get()
    .then((teachersRecord)=>{
        if (teachersRecord?.docs?.length > 0)
        {
            let array = [];

            teachersRecord?.docs?.forEach(teacherRecord => {
                array.push({
                    id: teacherRecord.id,
                    data: teacherRecord.data()
                });
            });

            return res.send({ code: "PROCESS_OK", data: Encrypt(array), type: "success" });
        }

        return res.send({ code: "NO_TEACHERS", message: "No existen profesores ligadas a esta asignatura", type: "error" });
    })
    .catch((error)=>{
        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
    });
};

/**
 * Función para obtener el arreglo de usuarios profesores dentro de la asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns arreglo de usuarios de profesores ligados a la asignatura
 */
controllers.getTeachersCourse = async (req, res) => {
    const { id } = req.query;

    await db.collection("courses").doc(id).collection("teachers").get()
    .then((courses) => {
        if (courses.docs.length > 0)
        {
            let array = [];
        
            courses?.forEach((doc)=>{
                array.push(
                    doc.id
                )
            });

            return res.send({ code: "PROCESS_OK", data: Encrypt(array), type: "success" });
        }
        
        return res.send({ code: "NO_TEACHERS_FOUNDED", message: "No hay profesores en esta asignatura aún", type: "error" });
    })
    .catch((error)=>{
        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
    });
};


/**
 * Función para obtener el arreglo de usuarios profesores ayudantes dentro de la asignatura
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns arreglo de usuarios de profesores ligados a la asignatura
 */
controllers.getHelpersTeachersCourse = async (req, res) => {
    const { id } = req.query;

    await db.collection("courses").doc(id).collection("teachers").where('helper', '==', true).get()
    .then((helpers) => {
        if (helpers.docs.length > 0)
        {
            let array = [];
        
            helpers?.forEach((doc)=>{
                array.push(
                    doc.id
                )
            });

            return res.send({ code: "PROCESS_OK", data: Encrypt(array), type: "success" });
        }
        
        return res.send({ code: "NO_HELPERS_FOUNDED", message: "No hay profesores ayudantes en esta asignatura aún", type: "error" });
    })
    .catch((error)=>{
        return res.send({ code: "FIREBASE_GET_ERROR", message: error.message, type: "error" });
    });
};


/**
 * Función para probar req.locals
 * @param {import("express").Request} req objeto request
 * @param {import("express").Response} res objeto response
 * @returns mensaje
 */
controllers.testingResLocals = (req, res) => {
    const { uid } = res.locals;

    let elem = "";

    if (uid !== null)
    {
        elem = uid
    }
    else
    {
        elem = "no hay un uid"
    }

    return res.send({ code: "TESTING", message: elem, type: "info" });
}

module.exports = controllers;
// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();




// Objeto controllers que contendra los metodos
const controllers = {};

controllers.updateEmail = (uid,email)=>{

    AUTH.updateUser(uid,{
        email:email
        
    }).then((userRecord)=>{
        console.log("usuario actualizao",userRecord.toJSON())
    })
    .catch((error=>{
        console.log("ha ocurrido un error",error)
    }))

}//fin funcion editar email

/**
 * Función que actualiza si un profesor es ayudante o no
 * @param {Request} req objeto request
 * @param {Response} res objeto reponse
 * @returns mensaje informativo al usuario o el data del usuario
 */
controllers.updateHelper = (req,res)=>{

    const { courseUid,userUid,helperState } = req.body

    if(courseUid !=="" && userUid !=="" && helperState !== "" ){

        DB.collection('couses').doc(courseUid).collection('teachers').doc(userUid).update({

            helper:helperState
    
        })
        .then(()=>{
            return res.send({ code: "PROCESS_OK", message: "Datos actualizados", type: "success" });
        })
        .catch((error)=>{
            return res.send({ code: "FIREBASE_AUTH_CREATE_ERROR", message: error.message, type: "error" }); 
        })
    }
    return res.send({ code: "NO_DATA_SEND", message: "Asegurate de que hayas completado los campos del formulario", type: "error" });

    
    
}

module.exports = controllers;



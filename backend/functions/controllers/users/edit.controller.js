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

const updateEmail = (uid,email)=>{

    AUTH.updateUser(uid,{
        email:email
        
    }).then((userRecord)=>{
        console.log("usuario actualizao",userRecord.toJSON())
    })
    .catch((error=>{
        console.log("ha ocurrido un error",error)
    }))

}//fin funcion editar email

export {updateEmail};



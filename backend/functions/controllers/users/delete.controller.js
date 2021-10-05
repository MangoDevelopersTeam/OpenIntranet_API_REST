// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};


controllers.deleteUser =(uid)=>{

    AUTH.deleteUser(uid).then(()=>{
        console.log("usuario borrado con exito");
    }).catch((error)=>{
        console.log("ha currido un error",error)
    })
}//fin delete user

module.exports = controllers;
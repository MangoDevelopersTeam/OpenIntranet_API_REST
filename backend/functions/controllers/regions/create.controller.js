// Importación del metodo Decrypt y el admin sdk
const { Decrypt, Encrypt } = require("./../../helpers/cipher");
const admin = require("firebase-admin");

// Declaración de constantes DB y AUTH
const DB = admin.firestore();
const AUTH = admin.auth();

// Objeto controllers que contendra los metodos
const controllers = {};

/**
 * Función para crear las comunas y regiones
 * @param {Request} req objeto request
 * @param {Response} res objeto response
 * @returns Mensaje de regiones y comunas creadas
 */
controllers.setRegionsAndCommunes = async (req, res) => {
    // Se verifica si hay una token de autorización
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.status(401).send({ code: "TOKEN_MISSING", message: "Esta acción necesita de un token de autenticación", type: "error" });
    }

    try 
    {
        const regionsLength = await DB.collection("regions").get();
        if (regionsLength.docs.length <= 0)
        {
            const regions = [
                {
                  "region": "Arica y Parinacota",
                  "numero": "XV",
                  "comunas": [
                    "Arica",
                    "Camarones",
                    "General Lagos",
                    "Putre"
                  ]
                },
                {
                  "region": "Tarapacá",
                  "numero": "I",
                  "comunas": [
                    "Alto Hospicio",
                    "Camiña",
                    "Colchane",
                    "Huara",
                    "Iquique",
                    "Pica",
                    "Pozo Almonte"
                  ]
                },
                {
                  "region": "Antofagasta",
                  "numero": "II",
                  "comunas": [
                    "Antofagasta",
                    "Calama",
                    "María Elena",
                    "Mejillones",
                    "Ollagüe",
                    "San Pedro de Atacama",
                    "Sierra Gorda",
                    "Taltal",
                    "Tocopilla"
                  ]
                },
                {
                  "region": "Atacama",
                  "numero": "III",
                  "comunas": [
                    "Alto del Carmen",
                    "Caldera",
                    "Chañaral",
                    "Copiapó",
                    "Diego de Almagro",
                    "Freirina",
                    "Huasco",
                    "Tierra Amarilla",
                    "Vallenar"
                  ]
                },
            ];

            regions.map(async (region) => {
                await DB.collection("regions").doc(region.numero).set({
                    region: region.region,
                    numero: region.numero
                });

                /* region.comunas.forEach((comuna) => {
                    const collectionRef = DB.collection("regionss").doc(region.numero).collection("wards").doc();
                    BATCH.create(collectionRef, { myData: comuna });
                }) */
                for (let i = 0; i < region.comunas.length; i++)
                {
                    await DB.collection("regions").doc(region.numero).collection("communes").add({
                        name: region.comunas[i],
                    });
                }

                /* await BATCH.commit(); */
            });

            res.send({ message: "regions added" });
        }
        else
        {
            res.send({ message: "the regions are added yet" });
        }
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
    }
}

module.exports =  controllers;
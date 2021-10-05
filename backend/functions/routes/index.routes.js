// Se importan las librerias de express y cors 
const express = require("express");
const cors = require("cors");

// Se importan metodos para los controladores que se usarán en algunas rutas
const { whoami, verifyAccess, setRegionsAndCommunes, getRegions, getCommunes, createAndRegisterUser, createAndRegisterAdmin, getAccess } = require("./../controllers/index.controllers");


// Solo para terminos de prueba
const { verifyToken } = require("./../controllers/testing/testingController");


// Se declara la constante app que contendra express
const app = express();

// Uso de express json para interpretar json en el servidor y cors para permitir la comunicación entre servidor y maquina cliente
app.use(express.json());
app.use(cors({ origin: true }));

// Rutas
app.get("/", (req, res) => {
    res.send({ message: "hello world" });
});

app.get("/whoami", whoami);

app.get("/testing-route", verifyToken);


app.get("/verify-access", verifyAccess);
app.get("/get-access", getAccess);


app.get("/set-regions-communes", setRegionsAndCommunes);

app.get("/get-regions", getRegions);

app.get("/get-communes", getCommunes);


app.post("/register-user", createAndRegisterUser);
app.post("/register-admin", createAndRegisterAdmin);


module.exports = app;
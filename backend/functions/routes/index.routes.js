// Importaciones
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

// Controladores
const userCreate = require("./../controllers/users/create.controller");
const userDelete = require("./../controllers/users/delete.controller");
const userAuth = require("./../controllers/users/auth.controller");
const userEdit = require("./../controllers/users/edit.controller");
const userGet = require("./../controllers/users/get.controllers");

const coursesGet = require("./../controllers/courses/get.controller");
const coursesCreate = require("./../controllers/courses/create.controller");
const coursesDelete = require("./../controllers/courses/delete.controller");
const coursesEdit = require("./../controllers/courses/edit.controller");

const authMiddlewares = require("./../middlewares/auth.middlewares");

// Declaraciones
const app = express();

// Ajustes
/* app.use(express.urlencoded({ extended: true })); */
app.use(express.json());
app.use(cors({ origin: true }));

// Rutas
// Rutas de Autenticación
app.get("/whoami", [authMiddlewares.checkToken], userCreate.whoami);
app.get("/get-access", [authMiddlewares.checkToken], userAuth.getAccess);

// Rutas de Registro
app.post("/register-user", userCreate.createAndRegisterUser);
app.post("/register-admin",userCreate.createAndRegisterAdmin);

// Rutas de usuario
app.get("/get-users", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], userGet.getUsers);

// Rutas de curso
app.post("/create-course", coursesCreate.createCourse);
app.get("/testing-get-course", coursesGet.getCourses);
app.get("/get-course", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesGet.getCourseById);

// Rutas de profesores
app.get("/get-teachers", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesGet.getTeachers);
app.get("/get-teachers-courses", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesGet.getTeachersCourse);
app.post("/set-teachers-course", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesCreate.setTeachersCourse);
app.delete("/remove-teacher-course", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesDelete.removeTeacherCourse);
app.get("/get-helpers-courses", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesGet.getHelpersTeachersCourse);
app.put("/change-helper-state", [authMiddlewares.checkToken, authMiddlewares.checkIsAdmin], coursesEdit.editTeacherHelper);

app.get("/test-res-values", [authMiddlewares.checkToken], coursesGet.testingResLocals);

module.exports = app;
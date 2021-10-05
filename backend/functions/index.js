const functions = require("firebase-functions");
const indexApp = require("./routes/index.routes");

exports.api = functions.https.onRequest(indexApp);
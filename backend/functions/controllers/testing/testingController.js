const admin = require("firebase-admin");

const AUTH = admin.auth();
const controllers = {};

controllers.verifyToken = async (req, res) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))
    {
        return res.send({ logged: false });
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
    {
        idToken = req.headers.authorization.split('Bearer ')[1];
    }

    try 
    {
        const verifyToken = await AUTH.verifyIdToken(idToken, true);
        if (verifyToken)
        {
            return res.send({ logged: true });
        }
    } 
    catch (error) 
    {
        return res.send({ logged: false });
    };
};

module.exports = controllers;
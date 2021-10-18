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

controllers.testPagination = async (req, res) => {
    const { lastRef, firstRef } = req.query;
    /* const { page } = req.query; */

    let elem = "";

    if (lastRef === null)
    {   
        elem = "es nulo"
    }
    else{
        elem = "no es nulo"
    }

    return res.send({ last: elem, ref: lastRef })
    await admin.firestore().collection("testing").orderBy("indice", "asc").limit(2).startAfter(lastRef).get()
    .then(result => {

        // Obtener paginas
        /* const staticSize = result.size; // 7

        let size = staticSize; // 7
        let array = [];

        size = size/2; //3,5
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
        } */

        //return res.send({ code: "PROCESS_OK", a: a, b: b, paginas: size, type: "success" });

        let array = [];

        let lastDocument = result.docs[result.docs.length - 1];

        result.forEach(doc => {
            array.push({
                id: doc.id,
                data: doc.data()
            })
        })

        return res.status(200).send({ data: array, lastDocument: lastDocument });
    })
}

module.exports = controllers;
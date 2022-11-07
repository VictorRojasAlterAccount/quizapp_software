const SQLite = require("better-sqlite3");
const sql = new SQLite('./mainDB.sqlite');
const { databaseSetup } = require("./services/setup")
databaseSetup(sql)

const { operateData, getData } = require("./services/action.js");
var path = require('path');

var express = require('express');
var app = express();
var dir = path.join(__dirname, 'public');
app.use(express.static(dir));
app.use(express.json())

app.get("/html/:task" , (req, res) => {
    try {
        let data = getData(req.params, req.query);
        return res.status(200).json({status: 200, data: data});
    } catch (error) {
        return res.status(400);
    }
});

app.post('/html', (req, res) => {
    const { parcel } = req.body;
    let isComplete = operateData(parcel);

    if (!isComplete) return res.status(400).send({ status: 'Fallido' })
    res.status(200).send({ status: 'Recibido' })
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log('Listening on http://localhost:3000/');
});


 
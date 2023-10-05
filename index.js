const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const sessions = require('express-session');
const basicRouter = require("./controls/basic");
const startBattleRouter = require("./controls/startBattle");
const apiBattleRouter = require('./controls/apiBattle')
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
global.games = {};
global.queue = [];
global.searches = {};


const app = express();

app.use(fileUpload());

app.use('/avathars', express.static(__dirname + '/public/avathars'))
app.use(express.static(__dirname + '/public'))

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use(sessions({
    secret: 'topsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(express.static(__dirname + "/public"));

app.use(basicRouter);
app.use(startBattleRouter);
app.use(apiBattleRouter)

app.listen(3000);
console.log(`Server listens on http://localhost:3000/`);

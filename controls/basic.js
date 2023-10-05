const express = require("express");
const ejs = require("ejs");
const db = require("../db");
const User = require("../models/user");
const fs = require("fs");
const GameModel = require("../utils/gameModel");

const avpath = "./public/avathars/";

const router = express.Router();

var rendered = "";
var messText = "";
var messType = null;

router.get("/", (req, res) => {
    if (req.session.login === undefined || !req.session.login){
        res.redirect("/login");
        return;
    }
    else {
        ejs.renderFile("./views/index.html", {messageText: messText, messageType: messType, user: req.session}, (err, str) => {
            if (str) rendered = str;
            if (err) console.log(err);
        });
        res.send(rendered);
        messText = "";
        messType = null;
    }
});

router.get("/login", (req, res) => {
    if (req.session.login){
        res.redirect("/");
        return;
    }
    ejs.renderFile("./views/login.html", {messageText: messText, messageType: messType}, (err, str) => {
        if (str) rendered = str;
        if (err) console.log(err);
    });
    res.send(rendered);
    messText = "";
    messType = null;
});

router.get("/register", (req, res) => {
    if (req.session.login){
        res.redirect("/");
        return;
    }
    ejs.renderFile("./views/register.html", {messageText: messText, messageType: messType}, (err, str) => {
        if (str) rendered = str;
        if (err) console.log(err);
    });
    res.send(rendered);
    messText = "";
    messType = null;
});

router.post("/register", async (req, res) => {
    var user = new User(req.body.login, req.body.password, req.body.name, req.body.email);
    if (await User.findByLogin(req.body.login)){
        messText = "User with such login already exists!";
        messType = "error";
        res.redirect("/register");
        return;
    }
    if (await user.save()){
        req.session.login = user.login;
        req.session.passw = user.password;
        req.session.user_id = user.id;
        req.session.status = "online";
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.av = `/avathars/${user.login}.jpg`;
        if (!req.files){
            fs.writeFileSync(avpath + `${user.login}.jpg`, fs.readFileSync("./public/avathars/basicUserAvathar.jpg"));
        }
        else {
            fs.writeFileSync(avpath + `${user.login}.jpg`, req.files.avathar.data);
        }
        res.redirect("/");
        return;
    }
    else {
        messText = "Something went wrong!";
        messType = "error";
        res.redirect("/register");
        return;
    }
});

router.post("/login", async (req, res) => {
    var user = await User.findByLogin(req.body.login);
    if (!user){
        messText = "There's no such user!";
        messType = "error";
        res.redirect("/login");
        return;
    }
    if (user.password != req.body.password){
        messText = "Invalid login or password!";
        messType = "error";
        res.redirect("/login");
        return;
    }
    if (user.password == req.body.password){
        req.session.login = user.login;
        req.session.passw = user.password;
        req.session.user_id = user.id;
        req.session.status = "online";
        req.session.name = user.name;
        req.session.av = `/avathars/${user.login}.jpg`;
        req.session.email = user.email;
        res.redirect("/");
        return;
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

router.post("/", async (req, res) => {
    global.queue.push(req.sessionID);
    var gameBuff;
    var queuePromise = new Promise(async (resolve, reject) => {
        var buff = [];
        var timer = setInterval(async () => {
            if (global.queue.indexOf(req.sessionID) < 0){
                for (let key in global.games){
                    if (global.games[key].user1.id == req.session.user_id || global.games[key].user2.id == req.session.user_id){
                        clearInterval(timer);
                        gameBuff = global.games[key];
                        resolve(true);
                    }
                }
            }
            if (global.queue.length > 1){
                buff.push(global.queue[0]);
                buff.push(global.queue[1]);
                global.queue.splice(0, 2);
                var user1_data = JSON.parse(req.sessionStore.sessions[buff[0]]);
                var user2_data = JSON.parse(req.sessionStore.sessions[buff[1]]);
                gameBuff = new GameModel({id: user1_data.user_id, name: user1_data.name, avatharSrc: user1_data.av, SSE_response: null},
                    {id: user2_data.user_id, name: user2_data.name, avatharSrc: user2_data.av, SSE_response: null});
                await gameBuff.battlefield.addStartingCards();
                gameBuff.grantUniqueIDs();
                global.games[gameBuff.gameID] = gameBuff;
                clearInterval(timer);
                resolve(buff);
            }
        }, 1000);
        global.searches[req.sessionID] = timer;
    });
    messText = "";
    messType = null;
    await queuePromise;
    res.redirect(`/searchGame?gameID=${global.games[gameBuff.gameID].gameID}`);
});

router.get("/edit", (req, res) => {
    if (req.session.login === undefined || !req.session.login){
        res.redirect("/login");
        return;
    }
    ejs.renderFile("./views/edit.html", {user: req.session, messageType: messType, messageText: messText}, (err, str) => {
        if (str) rendered = str;
        if (err) console.log(err);
    });
    res.send(rendered);
    messText = "";
    messType = null;
});

router.post("/edit", async (req, res) => {
    if (!await User.updateInfo(req.session.user_id, req.session.login, req.session.passw, req.body.name, req.body.email)){
        messText = "Something went wrong!";
        messType = "error";
    }
    else {
        let user = await User.findByLogin(req.session.login);
        req.session.name = user.name;
        req.session.email = user.email;
    }
    if (req.files && req.files.avathar){
        fs.writeFileSync(avpath + `${req.session.login}.jpg`, req.files.avathar.data);
    }
    messText = "Profile info's successfully changed!";
    messType = "success";
    res.redirect("/edit");
});

router.get("/changepassw", (req, res) => {
    if (req.session.login === undefined || !req.session.login){
        res.redirect("/login");
        return;
    }
    ejs.renderFile("./views/change.html", {messageType: messType, messageText: messText}, (err, str) => {
        if (str) rendered = str;
        if (err) console.log(err);
    });
    res.send(rendered);
    messText = "";
    messType = null;
});

router.post("/changepassw", async (req, res) => {
    if (req.body.old_password != req.session.passw){
        messText = "Invalid old password!";
        messType = "error";
        res.redirect("/changepassw");
        return;
    }
    if (!await User.updateInfo(req.session.user_id, req.session.login, req.body.password, req.session.name, req.session.email)){
        messText = "Something went wrong!";
        messType = "error";
    }
    else {
        let user = await User.findByLogin(req.session.login);
        req.session.passw = user.password;
    }
    messText = "Password's successfully changed!";
    messType = "success";
    res.redirect("/changepassw");
});

router.post("/cancel", (req, res) => {
    clearInterval(global.searches[req.sessionID]);
    global.queue.splice(global.queue.indexOf(req.sessionID));
    res.redirect("/");
});

router.get("/battleTest", (req, res) => {
    ejs.renderFile("./views/battlefield_test.html", (err, str) => {
        if (str) res.send(str);
        if (err) throw err;
    });
});

module.exports = router;

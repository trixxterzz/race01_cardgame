const express = require('express');
const ejs = require("ejs");
const router = express.Router();
const GameModel = require('../utils/gameModel');
const Battlefield = require('../utils/battlefield');
const Opponent = require('../utils/battleOpponent');
const Minion = require('../utils/battleMinion');
const Card = require('../utils/battleCard');

router.get('/testSearchGame', async (req, res) => {
    //do actual opponent matching
    //for now - display test game with test users
    let testUser1 = {
        id: 0,
        name: 'testUser1',
        avatharSrc: '/avathars/basicUserAvathar.jpg',
        SSE_response: null //thing used to send events to the user
    }
    let testUser2 = {
        id: 9999,
        name: 'testUser2',
        avatharSrc: '/avathars/basicUserAvathar.jpg',
        SSE_response: null //thing used to send events to the user
    }
    let game = await GameModel.createTestGameFromUsers(testUser1, testUser2);
    global.games[game.gameID] = game;
    let html = await ejs.renderFile('views/battlefield.ejs', {game});
    return res.send(html);
});

router.get('/searchGame', async (req, res) => {
    const gameID = req.query.gameID;
    const gameData = global.games[gameID];
    let SSE_response1 = gameData.user1.SSE_response;
    let SSE_response2 = gameData.user2.SSE_response;
    gameData.user1.SSE_response = null;
    gameData.user2.SSE_response = null;
    let html = await ejs.renderFile('views/battlefield.ejs', {game: gameData, userData: {id: req.session.user_id}});
    gameData.user1.SSE_response = SSE_response1;
    gameData.user2.SSE_response = SSE_response2;
    return res.send(html);
});

module.exports = router;

const express = require('express');
const ejs = require("ejs");
const router = express.Router();
const GameModel = require('../utils/gameModel');
const Battlefield = require('../utils/battlefield');
const Opponent = require('../utils/battleOpponent');
const Minion = require('../utils/battleMinion');
const Card = require('../utils/battleCard');

router.get('/api/gameEventsReceiver', (req, res) => {
    let gameID = req.query.gameID;
    let userID = req.query.userID; //user must be logged in

    if (global.games[gameID] === undefined) return res.sendStatus(403);
    let game = global.games[gameID];
    if (game.user1.id != userID && game.user2.id != userID) return res.sendStatus(403);
    req.session.gameID = gameID;
    req.session.userID = userID;
    req.session.save();

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    if (game.user1.id == userID) {
        game.user1.SSE_response = res;
    } else if (game.user2.id == userID) {
        game.user2.SSE_response = res;
    }

    res.on('close', () => {
        //client disconnected
        console.log('User disconnected from game ' + gameID);
        req.session.status = 'online';
        req.session.save();
        res.end();
    });
})

router.post('/api/testSendEvent', (req, res) => {

    let gameID = req.session.gameID;
    let userID = req.session.userID; //user must be logged in

    if (gameID === undefined || userID === undefined) return res.sendStatus(401);
    if (global.games[gameID] === undefined) return res.sendStatus(403);
    let game = global.games[gameID];
    if (game.user1.id != userID && game.user2.id != userID) return res.sendStatus(403);

    let user = null;
    if (game.user1.id == userID) {
        user = game.user1;
    } else if (game.user2.id == userID) {
        user = game.user2;
    }
    user.SSE_response.write('event: testEvent\n')
    user.SSE_response.write(`data: Event received at game ${gameID} from user ${userID}\n\n`);
    res.sendStatus(200);
})


router.post('/api/summonMinion', (req, res) => {

    let gameID = req.session.gameID;
    let userID = req.session.userID; //user must be logged in

    if (gameID === undefined || userID === undefined) return res.sendStatus(401);
    if (global.games[gameID] === undefined) return res.sendStatus(403);
    let game = global.games[gameID];
    if (game.user1.id != userID && game.user2.id != userID) return res.sendStatus(403);

    let user = null;
    let oppNumber = 0;
    if (game.user1.id == userID) {
        user = game.user1;
        oppNumber = 1;
    } else if (game.user2.id == userID) {
        user = game.user2;
        oppNumber = 2;
    }
    let uniqueID = req.body.uniqueID;
    let field = game.battlefield;
    let [card, haverNum] = field.getCardByUniqueID(uniqueID);
    if (card === undefined) {
        console.log('Didnt find card ' + uniqueID);
        return res.sendStatus(403);
    }
    if (haverNum != oppNumber) return res.sendStatus(403);

    if (oppNumber == 1) {
        if (field.opponent1_minions.length >= 7) {
            return res.sendStatus(403);
        }
        let newMinion = new Minion(card);
        let opp = field.opponent1;
        if (opp.currentMana < card.cost) {
            console.log('Mana restrict');
            return res.sendStatus(403);
        }
        opp.currentMana -= card.cost;
        field.opponent1_minions.push(newMinion);
        field.opponent1_cards = field.opponent1_cards.filter((card) => {
            return card.uniqueID != uniqueID;
        });
    }
    if (oppNumber == 2) {
        if (field.opponent2_minions.length >= 7) {
            return res.sendStatus(403);
        }
        let newMinion = new Minion(card);
        let opp = field.opponent2;
        if (opp.currentMana < card.cost) {
            console.log('Mana restrict');
            return res.sendStatus(403);
        }
        opp.currentMana -= card.cost;
        field.opponent2_minions.push(newMinion);
        field.opponent2_cards = field.opponent2_cards.filter((card) => {
            return card.uniqueID != uniqueID;
        });
    }
    game.grantUniqueIDs();
    if (game.user1.SSE_response != null) {
        game.user1.SSE_response.write('event: renderBattlefield\n')
        game.user1.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }
    if (game.user2.SSE_response != null) {
        game.user2.SSE_response.write('event: renderBattlefield\n')
        game.user2.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }

    return res.sendStatus(200);
})

router.post('/api/endTurn', async (req, res) => {
    let gameID = req.session.gameID;
    let userID = req.session.userID; //user must be logged in

    if (gameID === undefined || userID === undefined) return res.sendStatus(401);
    if (global.games[gameID] === undefined) return res.sendStatus(403);
    let game = global.games[gameID];
    if (game.user1.id != userID && game.user2.id != userID) return res.sendStatus(403);
    let field = game.battlefield;
    let oppNumber = 0;
    if (game.user1.id == userID) {
        oppNumber = 1;
    } else if (game.user2.id == userID) {
        oppNumber = 2;
    }
    //wrong player sent request
    if (field.whoseTurn != oppNumber) return res.sendStatus(403);
    if (field.whoseTurn == 1){
        field.whoseTurn = 2;
    } else {
        field.whoseTurn = 1;
    }
    //give card to the next player
    //also replenish mana
    let newCard = new Card();
    await newCard.findRandomCard();
    if (field.whoseTurn == 1){
        if (field.opponent1_cards.length < 4) {
            field.opponent1_cards.push(newCard);
        } 
        
        field.opponent1.maxMana++;
        if (field.opponent1.maxMana > 10) field.opponent1.maxMana = 10;
        field.opponent1.currentMana = field.opponent1.maxMana;
        for (const minion of field.opponent1_minions) {
            minion.active = true;
        }
    } else {
        if (field.opponent2_cards.length < 4) {
            field.opponent2_cards.push(newCard);
        } 
        field.opponent2.maxMana++;
        if (field.opponent2.maxMana > 10) field.opponent2.maxMana = 10;
        field.opponent2.currentMana = field.opponent2.maxMana;
        for (const minion of field.opponent2_minions) {
            minion.active = true;
        }
    }

    game.grantUniqueIDs();
    if (game.user1.SSE_response != null) {
        game.user1.SSE_response.write('event: renderBattlefield\n')
        game.user1.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }
    if (game.user2.SSE_response != null) {
        game.user2.SSE_response.write('event: renderBattlefield\n')
        game.user2.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }

    return res.sendStatus(200);
})

//client sends attacker UniqueID and target(defender) UniqueID
router.post('/api/minionAttack', (req, res) => {
    let gameID = req.session.gameID;
    let userID = req.session.userID; 
    let attackerID = req.body.attackerID;
    let defenderID = req.body.defenderID;

    if (gameID === undefined || userID === undefined) return res.sendStatus(401);
    if (attackerID === undefined || defenderID === undefined) return res.sendStatus(403);
    if (global.games[gameID] === undefined) return res.sendStatus(403);
    let game = global.games[gameID];
    if (game.user1.id != userID && game.user2.id != userID) return res.sendStatus(403);
    let field = game.battlefield;
    let oppNumber = 0;
    if (game.user1.id == userID) {
        oppNumber = 1;
    } else if (game.user2.id == userID) {
        oppNumber = 2;
    }
    if (attackerID == defenderID) return res.sendStatus(403);
    if (field.getMinionByUniqueID(attackerID) == undefined) return res.sendStatus(403);
    let [attacker, attackerHaverNum] = field.getMinionByUniqueID(attackerID);
    if (!attacker.active) return res.sendStatus(403);
    let defResArr = field.getMinionByUniqueID(defenderID);
    if (defResArr == undefined) {
        defResArr = field.getOpponentByUniqueID(defenderID);
        if (defResArr == undefined) return res.sendStatus(403);
    }
    let defender = defResArr[0];
    let defenderHaverNum = defResArr[1];
    //ti ne tuda voyuesh', pridurok
    if (attackerHaverNum != oppNumber || defenderHaverNum == oppNumber) return res.sendStatus(403);
    defender.hp -= attacker.attack;
    attacker.active = false;
    if (defender.attack != undefined) {
        attacker.hp -= defender.attack;
    }
    if (defender.hp <= 0) defender.alive = false;
    if (attacker.hp <= 0) attacker.alive = false;
    
    field.opponent1_minions = field.opponent1_minions.filter((minion) => minion.alive);
    field.opponent2_minions = field.opponent2_minions.filter((minion) => minion.alive);
    game.grantUniqueIDs();

    if (!field.opponent1.alive) {
        //TODO - win/lose event
        if (game.user1.SSE_response != null) {
            game.user1.SSE_response.write('event: endBattle\n')
            game.user1.SSE_response.write(`data:lose\n\n`);
        }
        if (game.user2.SSE_response != null) {
            game.user2.SSE_response.write('event: endBattle\n')
            game.user2.SSE_response.write(`data:win\n\n`);
        }
        global.games[gameID] = undefined;
    } 
    else if (!field.opponent2.alive) {
        //TODO - win/lose event
        if (game.user1.SSE_response != null) {
            game.user1.SSE_response.write('event: endBattle\n')
            game.user1.SSE_response.write(`data:win\n\n`);
        }
        if (game.user2.SSE_response != null) {
            game.user2.SSE_response.write('event: endBattle\n')
            game.user2.SSE_response.write(`data:lose\n\n`);
        }
        delete global.games[gameID];
    }
    if (game.user1.SSE_response != null) {
        game.user1.SSE_response.write('event: renderBattlefield\n')
        game.user1.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }
    if (game.user2.SSE_response != null) {
        game.user2.SSE_response.write('event: renderBattlefield\n')
        game.user2.SSE_response.write(`data:${JSON.stringify(field)}\n\n`);
    }
    return res.sendStatus(200);

})

module.exports = router;

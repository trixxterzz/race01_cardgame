const Battlefield = require("./battlefield");

module.exports = class GameModel {
    user1 = {
        id: 0,
        name: '',
        avatharSrc: '/avathars/basicUserAvathar.jpg',
        SSE_response: null //thing used to send events to the user
    };
    user2 = {
        id: 0,
        name: '',
        avatharSrc: '/avathars/basicUserAvathar.jpg',
        SSE_response: null //thing used to send events to the user
    };
    gameID; //must be unique among all other games, generated after finding opponents
    battlefield; //object to JSON.stringify() to send to players
    #uniqueIDCounter = 1;
    static #gameIDCounter = 1;
    //sets uniqueID values to all entities on the battlefield that do not have it
    grantUniqueIDs() {
        let field = this.battlefield;
        if (field === undefined || field === null) return;
        if (field.opponent1.uniqueID === null) field.opponent1.uniqueID = this.#generateUniqueID();
        if (field.opponent2.uniqueID === null) field.opponent2.uniqueID = this.#generateUniqueID();
        for (const minion of field.opponent1_minions) {
            if (minion.uniqueID == null) minion.uniqueID = this.#generateUniqueID();
        }
        for (const minion of field.opponent2_minions) {
            if (minion.uniqueID == null) minion.uniqueID = this.#generateUniqueID();
        }
        for (const card of field.opponent1_cards) {
            if (card.uniqueID == null) card.uniqueID = this.#generateUniqueID();
        }
        for (const card of field.opponent2_cards) {
            if (card.uniqueID == null) card.uniqueID = this.#generateUniqueID();
        }
    }
    #generateUniqueID() {
        return `${this.user1.id}-${this.user2.id}-${this.gameID}-${this.#uniqueIDCounter++}`;
    }
    #generateGameID() {
        this.gameID = `${GameModel.#gameIDCounter++}`;
    }
    constructor(user1, user2) {
        
        this.#generateGameID();
        if (user1 !== undefined) {
            this.user1 = user1;
        }
        if (user2 !== undefined) {
            this.user2 = user2;
        }
        //add profile pics
        this.battlefield = new Battlefield();
        this.grantUniqueIDs();
        //give starting cards
        
    }
    static async createTestGameFromUsers(user1, user2) {
        let game = new GameModel();
        game.user1 = user1;
        //add profile pics
        game.user2 = user2;
        game.battlefield = await Battlefield.createTestBattlefield();
        game.grantUniqueIDs();
        //give starting cards
        return game;
    }
}



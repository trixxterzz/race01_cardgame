const Card = require('./battleCard');
const Minion = require('./battleMinion');
const Opponent = require('./battleOpponent');

module.exports = class Battlefield {
    opponent1 = new Opponent();
    opponent2 = new Opponent();
    opponent1_minions = [];
    opponent2_minions = [];
    opponent1_cards = [];
    opponent2_cards = [];
    whoseTurn = Math.floor(Math.random() * 2) + 1;
    async addStartingCards() {
        for (let i = 0; i < 3; i++) {
            let card = new Card();
            await card.findRandomCard();
            this.opponent1_cards.push(card);
        }
        for (let i = 0; i < 3; i++) {
            let card = new Card();
            await card.findRandomCard();
            this.opponent2_cards.push(card);
        }
    }
    getMinionByUniqueID(uniqueID) {
        for (let minion of this.opponent1_minions) {
            if (minion.uniqueID == uniqueID) return [minion , 1];
        }
        for (let minion of this.opponent2_minions) {
            if (minion.uniqueID == uniqueID) return [minion, 2];
        }
        return undefined;
    }
    getCardByUniqueID(uniqueID) {
        for (let card of this.opponent1_cards) {
            if (card.uniqueID == uniqueID) return [card, 1];
        }
        for (let card of this.opponent2_cards) {
            if (card.uniqueID == uniqueID) return [card, 2];
        }
        return undefined;
    }
    getOpponentByUniqueID(uniqueID) {
        if (this.opponent1.uniqueID == uniqueID) return [this.opponent1, 1];
        if (this.opponent2.uniqueID == uniqueID) return [this.opponent2, 2];
        return undefined;
    }
    static async createTestBattlefield() {
        let field = new Battlefield();
        let card = new Card();
        await card.findInDBByName('frog1');
        field.opponent1_cards.push(card);
        let minion = new Minion(card);
        field.opponent1_minions.push(minion);

        card = new Card();
        await card.findInDBByName('frog2');
        field.opponent1_cards.push(card);
        card = new Card();
        await card.findInDBByName('frog3');
        field.opponent1_cards.push(card);

        card = new Card();
        await card.findInDBByName('frog3');
        field.opponent2_cards.push(card);
        minion = new Minion(card);
        field.opponent2_minions.push(minion);

        card = new Card();
        await card.findInDBByName('frog2');
        field.opponent2_cards.push(card);
        card = new Card();
        await card.findInDBByName('frog1');
        field.opponent2_cards.push(card);
        return field;
    }
}

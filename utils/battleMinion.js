module.exports = class Minion {
    hp = 1;
    attack = 1;
    alive = true;
    id; //id in the DB
    name;
    uniqueId = null; //id of HTML Tag in the browser, must be generated at server and be unique for the whole game, consistent across players and server
    avatharSrc; //path to the avathar picture, for display on client
    active = true;

    constructor(card) {
        this.hp = card.hp;
        this.attack = card.attack;
        this.id = card.id;
        this.name = card.name;
        this.avatharSrc = card.avatharSrc;
    }
}

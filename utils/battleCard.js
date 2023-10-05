const db = require('../db');

module.exports = class Card {
    static cardsNumber = 23;
    hp = 1;
    attack = 1;
    cost = 0;
    id; //id in the DB
    name;
    uniqueID = null; //id of HTML Tag in the browser 
    avatharSrc; //path to the avathar picture, for display on client
    async findInDBByName(name) {
        try {
            let [res] = await db.query(`SELECT id, name, hp, attack, cost, avatharFile FROM cards WHERE name = ?`, [name]);
            if (res === undefined || res === null || res.length < 1) return false;
            if (res[0]){
                this.id = res[0].id;
                this.hp = res[0].hp;
                this.name = res[0].name;
                this.attack = res[0].attack;
                this.cost = res[0].cost;
                this.avatharSrc ='/avathars/cards/' + res[0].avatharFile;
            }
            return true;
        }
        catch (error){
            throw error;
        }
    }
    async findInDBByID(id) {
        try {
            let [res] = await db.query(`SELECT id, name, hp, attack, cost, avatharFile FROM cards WHERE id = ?`, [id]);
            if (res === undefined || res === null || res.length < 1) return false;
            if (res[0]){
                this.id = res[0].id;
                this.hp = res[0].hp;
                this.name = res[0].name;
                this.attack = res[0].attack;
                this.cost = res[0].cost;
                this.avatharSrc ='/avathars/cards/' + res[0].avatharFile;
            }
            return true;
        }
        catch (error){
            throw error;
        }
    }
    async findRandomCard() {
        let id = Math.floor(Math.random() * Card.cardsNumber);
        try {
            let [res] = await db.query(`SELECT id, name, hp, attack, cost, avatharFile FROM cards`);
            if (res == undefined || res == null || res.length < 1) return false;
            if (res[id]){
                this.id = res[id].id;
                this.hp = res[id].hp;
                this.name = res[id].name;
                this.attack = res[id].attack;
                this.cost = res[id].cost;
                this.avatharSrc ='/avathars/cards/' + res[id].avatharFile;
            }
            return true;
        }
        catch (error){
            throw error;
        }
    }

}

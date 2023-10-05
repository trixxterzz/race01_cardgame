const db = require('../db');

module.exports = class User {
    constructor(login, passw, name, email, id=-1){
        this.login = login;
        this.passw = passw;
        this.name = name;
        this.email = email;
        this.model = "users";
        this.id = id;
    }

    async find(id){
        try {
            let [res] = await db.query(`SELECT * FROM ${this.model} WHERE id=${id}`);
            if (res === undefined || res === null || res.length < 1) return false;
            if (res[0]){
                this.login = res[0].login;
                this.password = res[0].password;
                this.name = res[0].name;
                this.email = res[0].email;
                this.user_type = res[0].user_type;
                this.id = res[0].id;
            }
            return true;
        }
        catch (error){
            console.log(error);
            return false;
        }
    }
    async delete(id){
        try {
            let [res] = await db.query(`DELETE FROM ${this.model} WHERE id=${id}`);
            return true;
        }
        catch (error){
            console.log(error);
            return false;
        }
    }
    async save(){
        try {
            let [res] = await db.query(`SELECT * FROM ${this.model} WHERE login='${this.login}'`);
            if (res.length > 0){
                [res] = await db.query(`UPDATE ${this.model} SET login='${this.login}', password='${this.password}', name='${this.name}', email='${this.email}', id='${this.id}' WHERE login='${this.login}'`);
            }
            else {
                [res] = await db.query(`INSERT INTO ${this.model}(login, password, name, email) VALUES ('${this.login}', '${this.passw}', '${this.name}', '${this.email}');`);
                [res] = await db.query (`SELECT id FROM users WHERE login='${this.login}';`);
                this.id = res[0].id;
            }
            return true;
        }
        catch (error){
            console.log(error);
            return false;
        }
    }

    static async findMail(email){
        try {
            let [res] = await db.query(`SELECT * FROM users WHERE email='${email}';`);
            if (res.length > 0){
                return res[0];
            }
            return false;
        }
        catch(error){
            console.log(error);
            return false;
        }
    }

    static async findByLogin(login){
        try {
            let [res] = await db.query(`SELECT * FROM users WHERE login='${login}';`);
            if (res.length > 0){
                return res[0];
            }
            return false;
        }
        catch(error){
            console.log(error);
            return false;
        }
    }
    static async updateInfo(id, login, password, name, email){
        try{
            let [res] = await db.query(`UPDATE users SET id=${id}, login='${login}', password='${password}', name='${name}', email='${email}' WHERE id=${id}`);
            return true;
        }
        catch(error){
            console.log(error);
            return false;
        }
    }
}

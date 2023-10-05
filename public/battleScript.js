var gameModel = JSON.parse(document.getElementById('initGameData').innerHTML);
console.log(gameModel);
var userData = JSON.parse(document.getElementById('userData').innerHTML);
const battlefieldContainer = document.getElementById('battlefieldContainer');
var battlefieldTemplate = '';
var sortedBattlefield = {
    enemyUser: null,
    myUser: null,
    enemyOpponent: null,
    myOpponent: null,
    enemyCards: null,
    myCards: null,
    enemyMinions: null,
    myMinions: null, 
    isMyTurn: true
};

var chosenMinion = null;
var timerValue = 30;
var oldTurnValue = false;
var timer = setInterval(() => {
    
    timerValue--;
    if (timerValue <= 0) {
        if (sortedBattlefield.isMyTurn) api_endTurn();
        timerValue = 30;
    }
    if (sortedBattlefield.isMyTurn) {
        let timerTag = document.getElementById('myTime');
        timerTag.innerText = "Time: " + timerValue;
    }
    if (!sortedBattlefield.isMyTurn) {
        let timerTag = document.getElementById('enemyTime');
        timerTag.innerText = "Time: " + timerValue;
    }

}, 1000)

//TODO - normal userID determination, it is for test
const serverEvents = new EventSource('/api/gameEventsReceiver?gameID=' + gameModel.gameID + '&userID=' + userData.id, { withCredentials: true });

main();

async function main() {
    let resp =  await fetch('/battlefieldTemplate.ejs');
    battlefieldTemplate = await resp.text();

    battlefieldContainer.innerHTML = adjustedRenderBattlefield(gameModel.battlefield);
    
    attachEventListenersOnBattlefield();
    
    serverEvents.addEventListener('testEvent', (e) => {
        console.log(e.data);
    });
    
    serverEvents.addEventListener('renderBattlefield', (e) => {
        let field = JSON.parse(e.data);
        gameModel.battlefield = field;
        battlefieldContainer.innerHTML = adjustedRenderBattlefield(field);
        attachEventListenersOnBattlefield();
        if (oldTurnValue != sortedBattlefield.isMyTurn) {
            timerValue = 30;
        }
        oldTurnValue = sortedBattlefield.isMyTurn;
        
    })

    serverEvents.addEventListener('endBattle', (e) => {
        let data = e.data;
        console.log(data);
        //TODO - Display win/lose message
        var end = document.getElementById("endgame");
        end.style.position = "absolute";
        end.style.width = "100%";
        end.style.height = "100%";
        end.style.zIndex = "10000";
        end.style.color = (data == "win") ? "white": "red";
        end.style.textAlign = "center";
        end.style.fontSize = "100px";
        end.innerText = (data == "win") ? "You win!": "You lose!";
        end.hidden = undefined;
        var bBody = document.getElementById("battlefieldBody");
        bBody.style.display = "none";
        setTimeout(() => {
            window.location.replace("/");
        }, 5000);
        //disconnect from the game
        serverEvents.close();
    })
}


function adjustedRenderBattlefield(field) {
    let myNum = 0;
    if (userData.id == gameModel.user1.id) myNum = 1;
    if (userData.id == gameModel.user2.id) myNum = 2;
    if (myNum == field.whoseTurn) sortedBattlefield.isMyTurn = true;
    else sortedBattlefield.isMyTurn = false;
    if (myNum == 1) {
        sortedBattlefield.enemyUser = gameModel.user2;
        sortedBattlefield.myUser = gameModel.user1;
        sortedBattlefield.enemyOpponent = field.opponent2;
        sortedBattlefield.myOpponent = field.opponent1;
        sortedBattlefield.enemyCards = field.opponent2_cards;
        sortedBattlefield.myCards = field.opponent1_cards;
        sortedBattlefield.enemyMinions = field.opponent2_minions;
        sortedBattlefield.myMinions = field.opponent1_minions;
    }
    else {
        sortedBattlefield.enemyUser = gameModel.user1;
        sortedBattlefield.myUser = gameModel.user2;
        sortedBattlefield.enemyOpponent = field.opponent1;
        sortedBattlefield.myOpponent = field.opponent2;
        sortedBattlefield.enemyCards = field.opponent1_cards;
        sortedBattlefield.myCards = field.opponent2_cards;
        sortedBattlefield.enemyMinions = field.opponent1_minions;
        sortedBattlefield.myMinions = field.opponent2_minions;
    }
    console.log(sortedBattlefield);
    return ejs.render(battlefieldTemplate, sortedBattlefield);
}


function attachEventListenersOnBattlefield() {
    for (const card of sortedBattlefield.myCards) {
        let tag = document.getElementById(card.uniqueID);
        if (tag == null) {
            console.log('Couldnt find card with id ' + card.uniqueID);
            continue;
        }
        tag.addEventListener('click', (e) => {
            api_summonMinion(card.uniqueID);
        })
    }
    //TODO - add attack selection
    //for now - always to the face
    for (const minion of sortedBattlefield.myMinions) {
        let tag = document.getElementById(minion.uniqueID);
        if (tag == null) {
            console.log('Couldnt find minion with id ' + minion.uniqueID);
            continue;
        }
        tag.addEventListener('click', (e) => {
            if (!minion.active) return;
            if (chosenMinion && chosenMinion == minion.uniqueID){
                resetChosen();
            }
            else if(chosenMinion && chosenMinion != minion.uniqueID){
                let chosentag = document.getElementById(chosenMinion);
                chosentag.style.border = "2px solid black";
                tag.style.border = "5px solid green";
                chosenMinion = minion.uniqueID;
            }
            else {
                tag.style.border = "5px solid green";
                chosenMinion = minion.uniqueID;
            }
        });
    }
    for (const minion of sortedBattlefield.enemyMinions){
        let tag = document.getElementById(minion.uniqueID);
        if (tag == null) {
            console.log('Couldnt find minion with id ' + minion.uniqueID);
            continue;
        }
        tag.addEventListener("click", () => {
            if (chosenMinion){
                const explosion = document.createElement("div");
                explosion.className = "explosion";
                tag.appendChild(explosion);
                gsap.to(explosion, {
                    width: 300,
                    height: 300,
                    duration: 0.5,
                    opacity: 0,
                    onComplete: () => {
                        explosion.remove();
                    },
                });
                var chosenBuff = chosenMinion;
                setTimeout(() => {
                    api_minionAttack(chosenBuff, minion.uniqueID);
                }, 300);
            } 
            chosenMinion = null;
        });
    }

    let enemyFace = document.getElementById(sortedBattlefield.enemyOpponent.uniqueID);
    enemyFace.addEventListener("click", () => {
        setTimeout(() => {
            if (chosenMinion && sortedBattlefield.enemyMinions.length < 1){
                const explosion = document.createElement("div");
                explosion.className = "explosion";
                enemyFace.appendChild(explosion);
                gsap.to(explosion, {
                    width: 300,
                    height: 300,
                    duration: 0.5,
                    opacity: 0,
                    onComplete: () => {
                        explosion.remove();
                    },
                });
                var chosenBuff = chosenMinion;
                setTimeout(() => {
                    api_minionAttack(chosenBuff, sortedBattlefield.enemyOpponent.uniqueID);
                }, 300);
                chosenMinion = null;
            } 
        }, 10);
    });
}



function api_testSendEvent() {
    return fetch('/api/testSendEvent', {
        credentials: "include",
        method: 'POST'
    })
}

//say to server "I want to use this card"
//if it is possible - it will sent event with new battlefield (renderBattlefield SSE)
//TODO - server also sents instructions on how to display action
async function api_summonMinion(cardUniqueID) {
    var res = await fetch('/api/summonMinion', {
        credentials: "include",
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({uniqueID: cardUniqueID})
    });
    if (res.status == 200){
        // draw animations for card summon
    }
}

async function api_endTurn() {
    var res = fetch('/api/endTurn', {
        credentials: "include",
        method: 'POST'
    });
    if (res.status == 200){
        // draw animations for end turn
    }
}

function api_minionAttack(attackerID, defenderID) {
    var res = fetch('/api/minionAttack', {
        credentials: "include",
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
            attackerID,
            defenderID
        })
    });
    if (res.status == 200){
        // draw animations for attack
    }
}

function resetChosen(){
    if (chosenMinion){
        let chosentag = document.getElementById(chosenMinion);
        chosentag.style.border = "2px solid black";
        chosenMinion = null;
    }
}

const _ = require("underscore");
const utils = require("./utils");
const deck = require("./deck");
const axios = require("axios");
const {
  isDublee,
  isTunnel,
  isPureSequence,
  isTrial,
  isDirtyTrial,
  isDirtySequqnce,
  findAndRemoveMatchingSet,
  findAndRemoveMatchingDirtySet,
} = require("./getSetType");
const {
  maalCardPoint,
  youngerMaalCardPont,
  elderMaalCardPont,
  alterMaalCardPoint,
  tunnelaPoints,
  jokerPoint,
  masterPoints,
} = require("./pointSystem");
function Table(boot, privateTableKey) {
  this.gid = privateTableKey || utils.guid();
  this.gameStarted = false;
  let maxPlayers = 5;
  var players = {};
  let clients = {};
  this.stockCard = [];
  this.tableCard = [];
  this.allMaalCard = [];
  this.maalCard = {};
  this.alterMaalCard = {};
  this.elderMaalCard = {};
  this.youngerMaalCard = {};
  let tableInfo;
  let cardsInfo = {};
  // defining the avilable slots and initialy all are the slots are empty
  let avialbleSlots = {
    slot1: "slot1",
    slot2: "slot2",
    slot3: "slot3",
    slot4: "slot4",
    slot5: "slot5",
  };
  // this function reseting the table for restarting the game
  this.resetTable = function () {
    let iBoot = boot || 10;
    tableInfo = {
      boot: iBoot,
      showAmount: true,
    };
  };
  // this function returns all the players in current game table/room
  this.getPlayers = function () {
    return players;
  };
  // this function returns number of total joined player in the table/room
  this.getPlayersCount = function () {
    return _.size(players);
  };
  // this function  retruns the table details
  this.getTableInfo = function () {
    tableInfo["activePlayer"] = this.getActivePlayers();
    return tableInfo;
  };

  //  this function add a new palyers in avalable table
  this.addPlayer = function (player, client) {
    if (this.getActivePlayers() <= maxPlayers) {
      for (let slot in avialbleSlots) {
        player.slot = slot;
      }
      players[player.id] = player;
      clients[player.id] = client;
      players[player.id].active = !this.gameStarted;
      delete avialbleSlots[player.slot];
      return player;
    }
    return false;
  };
  // this function removes a player
  this.removePlayer = function (id) {
    if (id && players[id]) {
      let player = players[id];
      avialbleSlots[player.slot] = player.slot;
      delete cardsInfo[id];
      delete players[id];
      delete clients[id];
      return player;
    }
  };
  // this function is used to get a player by slot
  this.getPlayerBySlot = function (slot) {
    for (let player in players) {
      if (players[player].slot === slot) {
        return players[player];
      }
    }
    return undefined;
  };
  // this function return the last or previous player
  this.getPrevActivePlayer = function (id) {
    let slot = players[id].slot,
      num = slot.substr(4) * 1;
    for (let count = 0; count <= 4; count++) {
      num--;
      if (num === 0) {
        num = 5;
      }
      if (avialbleSlots["slot" + num]) {
        continue;
      }
      if (this.getPlayerBySlot("slot" + num)) {
        if (!this.getPlayerBySlot("slot" + num).active) {
          continue;
        } else {
          break;
        }
      }
    }
    let newPlayer = this.getPlayerBySlot("slot" + num);
    return newPlayer;
  };
  // this function returns the next player
  this.getNextActivePlayer = function (id) {
    let slot = players[id].slot;
    // finding the digit of the slot.
    let num = slot.substr(4) * 1;
    for (let count = 0; count <= 4; count++) {
      num++;
      if (num > 5) {
        num = num % 5;
      }
      if (avialbleSlots["slot" + num]) {
        continue;
      }
      if (this.getPlayerBySlot("slot" + num)) {
        if (!this.getPlayerBySlot("slot" + num).active) {
          continue;
        } else {
          break;
        }
      }
    }
    let newPlayer = this.getPlayerBySlot("slot" + num);
    return newPlayer;
  };
  // this function returns turn for the next player
  this.getNextSlotForTurn = function (id) {
    players[id].turn = false;
    let newPlayer = this.getNextActivePlayer(id);
    newPlayer.turn = true;
  };

  // this function is used for show card
  this.cancelShow = function (id) {
    let players = this.getPlayers();
    let player = players[id];
    player.setCount = 0;
    if (player.primarySet?.length >= 3) {
      if (player.handSet?.length - player.dirtCard?.length > 1) {
        player.dirtCard = [];
      }
    } else {
      player.primarySet = [];
    }

    console.log("cancel card show ****************", player);
  };

  this.showCards = function (args) {
    let players = this.getPlayers();
    let updatePlayer = players[args.id];
    if (!args.pureRound) {
      let res = this.setCheck(
        args.id,
        args.cardSets,
        args.pureRound,
        args.maalSeen
      );
      if (res) {
        updatePlayer.setCount = updatePlayer.setCount + 1;
        updatePlayer.primarySet.push(args.cardSets);
        console.log("updated", updatePlayer);
        function removeDuplicates(handSet, primarySet) {
          for (const primaryArray of primarySet) {
            handSet = handSet.filter((handObject) => {
              return !primaryArray.some(
                (primaryObject) => handObject.id === primaryObject.id
              );
            });
          }
          return handSet;
        }
        if (updatePlayer.setCount === 3) {
          // const primarySetIds = new Set(
          //     updatePlayer?.primarySet.map((card) => card.id)
          // );
          // const filteredHandSet = updatePlayer?.handSet.filter(
          //     (card) => !primarySetIds.has(card.id)
          // );

          updatePlayer.handSet = removeDuplicates(
            updatePlayer?.handSet,
            updatePlayer?.primarySet
          );
          updatePlayer.pureRound = true;
          // socket.emit(cardShown, {
          //     players: players,
          //     msg: `${updatePlayer.playerInfo.displayName} has  seen maal Card`,
          // });
          // socket.broadcast.to(room).emit(cardShown, {
          //     players: players,
          //     msg: `${updatePlayer.playerInfo.displayName} has  seen maal Card`,
          // });

          return {
            players: this.getPlayers(),
            msg: `${updatePlayer.playerInfo.displayName} has seen the Maal Card`,
          };
        } else if (updatePlayer.setCount < 3) {
          // socket.emit(cardShown, {
          //     players: players,
          //     isValid: res,
          // });
          // socket.broadcast.to(room).emit(cardShown, {
          //     players: players,
          //     isValid: res,
          // });

          return {
            players: this.getPlayers(),
            isValid: res,
          };
        }
      } else {
        updatePlayer.primarySet = [];
        updatePlayer.setCount = 0;
        // socket.emit(wrongCard, {
        //     msg: "invalid Set",
        //     players: players,
        //     isValid: res,
        // });
        // socket.broadcast.to(room).emit(wrongCard, {
        //     msg: "invalid Set",
        //     players: players,
        //     isValid: res,
        // });
        return {
          msg: "Invalid Set",
          players: this.getPlayers(),
          isValid: res,
        };
      }
    } else {
      let res = this.setCheck(args.id, args.cardSets, args.pureRound);
      console.log("card result", res);

      if (res && args.pureRound) {
        function removeDuplicates(handSet, primarySet) {
          for (const primaryArray of primarySet) {
            handSet = handSet.filter((handObject) => {
              return !primaryArray.some(
                (primaryObject) => handObject.id === primaryObject.id
              );
            });
          }
          return handSet;
        }

        updatePlayer.dirtCard.push(args.cardSets);
        const checkArray = removeDuplicates(
          updatePlayer.handSet,
          updatePlayer.dirtCard
        );
        console.log(checkArray);
        if (checkArray?.length == 1) {
          let winners = this.decideWinner();
          return {
            players: winners,
            winners: this.getPlayers(),
            table: this.getTableInfo(),
            winner: true,
          };
        }
        // socket.emit(cardShown, {
        //     msg: "dirty set",
        //     isValid: res,
        // });
        // socket.broadcast.to(room).emit(cardShown, {
        //     msg: "dirty set",
        //     isValid: res,
        // });

        // if (updatePlayer.handSet.length == 1) {
        //     let winners = this.decideWinner();
        //     return {
        //         players: winners,
        //         winners: this.getPlayers(),
        //         table: this.getTableInfo(),
        //         winner: true
        //     }

        // }
        else {
          return {
            msg: "Dirty Set",
            players: this.getPlayers(),
            isValid: res,
          };
        }
      } else {
        // socket.emit(cardShown, {
        //     msg: "invalid Sequence",
        //     isValid: res,
        // });
        // socket.broadcast.to(room).emit(cardShown, {
        //     msg: "invalid Sequence",
        //     isValid: res,
        // });
        return {
          msg: "Dirty Set",
          players: this.getPlayers(),
          isValid: res,
        };
      }
    }
    console.log("show the card player", this.getPlayers());
  };

  this.showSequaqnce = function (id, handSet, pureRound) {
    if (id && pureRound == false) {
      //   let result = findAndRemoveMatchingSet(players[id].handSet);
      let result = findAndRemoveMatchingSet(handSet);
      console.log(
        "show card ****************************************************************",
        result
      );
      let player = players[id];

      if (result) {
        player["seq"] = result[0];
        player["seqAvailabe"] = true;
        player["remCard"] = result[1];
      } else {
        player["seqAvailabe"] = false;
        player["seq"] = [];
        player.primarySet = [];
        player.setCount = 0;
      }
      console.log("showed sequednce %%%%%%%%%%%%", player);
    } else if (id && players[id] && pureRound === true && handSet) {
      let result = findAndRemoveMatchingDirtySet(handSet, this.allMaalCard);
      console.log(
        "get the dirty    card ************** ****************************************************************",
        result
      );
      let player = players[id];

      if (result) {
        player["seq"] = result[0];
        player["seqAvailabe"] = true;
        player["remCard"] = result[1];
      } else {
        player["seqAvailabe"] = false;
        player["seq"] = [];
      }
      console.log("showed sequednce %%%%%%%%%%%%", player);
    }
  };

  this.setCheck = function (id, cardSet, pureRound) {
    if (!pureRound) {
      if (isTunnel(cardSet) || isPureSequence(cardSet)) {
        return true;
      } else {
        return false;
      }
    } else if (pureRound) {
      return (
        isTunnel(cardSet) ||
        isPureSequence(cardSet) ||
        isTrial(cardSet) ||
        isDirtyTrial(cardSet, this.allMaalCard) ||
        isDirtySequqnce(cardSet, this.allMaalCard)
      );
    }
  };

  this.showDuoblee = function (id, cardSet, pureRound) {
    return isDublee(cardSet);
  };

  // this function is used to check the player is active or not
  this.isActivePlayer = function (id) {
    return players[id] && players[id].active;
  };

  // this function is used to find current turn for a player
  this.getActionTurnPlayer = function () {
    let activePlayer;
    for (let player in players) {
      if (players[player].turn) {
        activePlayer = players[player];
        break;
      }
    }
    return activePlayer;
  };

  this.getCardFromStockCard = () => {
    let topCard = this.stockCard.pop();
    if (this.stockCard.length === 0) {
      this.stockCard = this.tableCard;
      this.tableCard = [];
    }
    return topCard;
  };

  this.getCardFromTableCard = () => {
    return this.tableCard.pop();
  };

  this.throw = function (id, card, handCards) {
    this.tableCard.push(card);
    this.setNextPlayerTurn(id);
    let players = this.getPlayers();
    let player = players[id];
    // todo:add setCunt === 3
    if (player.primarySet.length === 3) {
      player.maalSeen = true;
    }
    player.seqAvailabe = false;
    player.isDraw = false;
    player.handSet = handCards;
    return players;
  };
  // this function is used to make turn for a player
  this.setNextPlayerTurn = function () {
    let activeTurnPlayer = this.getActionTurnPlayer();
    this.getNextSlotForTurn(activeTurnPlayer.id);
  };
  // this function is used to stop the game
  this.stopGame = function () {
    this.gameStarted = false;
    tableInfo.gameStarted = false;
  };
  // this function is used to collect the bootamount for each players
  this.collectBootAmount = function () {
    let bootAmount = 0;
    for (let player in players) {
      if (players[player].active) {
        bootAmount = bootAmount + tableInfo.boot;
        players[player].playerInfo.chips -= tableInfo.boot;

        // axios.put(`https://blue-seahorse-suit.cyclic.cloud/api/v1/user/update/${players[player].playerInfo._id}`, {
        //     "wallet": players[player].playerInfo.chips
        // }).then(function (response) {
        //     console.log(response);
        // })
        //     .catch(function (error) {
        //         console.log(error);
        //     });
      }
    }

    tableInfo.amount = bootAmount;
  };
  // this function return the cards
  this.getCardInfo = function () {
    return cardsInfo;
  };
  this.getMaalCard = function (targetCard) {
    let matchingCards = [];
    matchingCards.push(targetCard);
    matchingCards.push({ type: "master", rank: 0, name: "joker", priority: 0 });
    matchingCards.push({ type: "joker", rank: 0, name: "joker", priority: 0 });
    return matchingCards;
  };
  this.coutCard = function (targetCard, playerCard) {
    // console.log("player card in CountCard", playerCard);
    if (targetCard) {
      let matchingCards = playerCard.filter((card) => {
        return card.rank === targetCard.rank && card.type === targetCard.type;
      });

      return matchingCards.length;
    }
    return 0;
  };
  this.getYoungerMaalCard = function (targetCard) {
    let deckCards = deck.getSingleDeck();
    let matchingCards = deckCards.filter((card) => {
      return card.rank === targetCard.rank - 1 && card.type === targetCard.type;
    });
    if (matchingCards.length) {
      return matchingCards[0];
    }
    return null;
  };
  this.getElderMaalCard = function (targetCard) {
    let deckCards = deck.getSingleDeck();
    let matchingCards = deckCards.filter((card) => {
      return card.rank === targetCard.rank + 1 && card.type === targetCard.type;
    });
    if (matchingCards.length) {
      return matchingCards[0];
    }
    return null;
  };
  this.getAlterMaalCard = function (targetCard) {
    let deckCards = deck.getSingleDeck();
    if (targetCard.type === "heart") {
      let matchingCards = deckCards.filter((card) => {
        return card.rank === targetCard.rank && card.type === "diamond";
      });
      return matchingCards[0];
    } else if (targetCard.type === "diamond") {
      let matchingCards = deckCards.filter((card) => {
        return card.rank === targetCard.rank && card.type === "heart";
      });
      return matchingCards[0];
    } else if (targetCard.type === "club") {
      let matchingCards = deckCards.filter((card) => {
        return card.rank === targetCard.rank && card.type === "spade";
      });
      return matchingCards[0];
    } else if (targetCard.type === "spade") {
      let matchingCards = deckCards.filter((card) => {
        return card.rank === targetCard.rank && card.type === "club";
      });
      return matchingCards[0];
    }
  };

  this.distributeCards = function () {
    deck.shuffle();
    let deckCards = deck.getCards();

    index = 0;
    for (let i = 0; i < 21; i++) {
      for (let player in players) {
        if (players[player].active) {
          if (!cardsInfo[players[player].id]) {
            cardsInfo[players[player].id] = {};
          }
          if (!cardsInfo[players[player].id].cards) {
            cardsInfo[players[player].id].cards = [];
          }
          cardsInfo[players[player].id].cards.push(deckCards[index++]);
        }
      }
    }
    let rest = deckCards.slice(index, deckCards.length);
    let maalCard = rest[0];
    if (maalCard.name === "joker" || maalCard.name === "master") {
      rest = rest.slice(1, rest.length - 1);
      rest.push(maalCard);
      maalCard = rest[0];
      if (maalCard.name === "joker" || maalCard.name === "master") {
        rest = rest.slice(1, rest.length - 1);
        rest.push(maalCard);
        maalCard = rest[0];
        if (maalCard.name === "joker" || maalCard.name === "master") {
          rest = rest.slice(1, rest.length - 1);
          rest.push(maalCard);
          maalCard = rest[0];
          if (maalCard.name === "joker" || maalCard.name === "master") {
            rest = rest.slice(1, rest.length - 1);
            rest.push(maalCard);
            maalCard = rest[0];
          } else {
            this.stockCard = rest.slice(1, rest.length - 1);
          }
        } else {
          this.stockCard = rest.slice(1, rest.length - 1);
        }
      } else {
        this.stockCard = rest.slice(1, rest.length - 1);
      }
    } else {
      this.stockCard = rest.slice(1, rest.length - 1);
    }
    // console.log(maalCard);
    this.allMaalCard.push(...this.getMaalCard(maalCard));
    this.tableCard.push(rest[rest.length - 1]);
    this.maalCard = maalCard;
    this.alterMaalCard = this.getAlterMaalCard(maalCard);
    this.elderMaalCard = this.getElderMaalCard(maalCard);
    this.youngerMaalCard = this.getYoungerMaalCard(maalCard);
    for (let player in players) {
      if (players[player].active) {
        players[player].maal = this.maalCard;
        players[player].handSet = cardsInfo[player].cards;
      }
    }
  };

  this.getActivePlayers = function () {
    let count = 0;
    for (let player in players) {
      if (players[player].active) {
        count++;
      }
    }
    return count;
  };
  this.resetAllPlayers = function () {
    for (let player in players) {
      delete players[player].winner;
      players[player].turn = false;
      players[player].active = true;
      players[player].finished = false;
      players[player].pureRound = false;
      players[player].maal = {};
      players[player].setCount = 0;
      players[player].maalSeen = false;
      players[player].isDraw = false;
      players[player].primarySet = [];
      players[player].handSet = [];
      players[player].point = 0;
      players[player].countCard = {};
      players[player].dirtCard = [];
      players[player].seqAvailabe = false;
      players[player].seq = [];
      players[player].remCard = [];
    }
  };
  this.decideWinner = function () {
    for (let player in players) {
      players[player].turn = false;
      if (players[player].active && !players[player].packed) {
        let pointCard = {};
        let cardsOfPlayer = [
          ...players[player].handSet,
          ...players[player].primarySet,
        ];
        console.log("player card", cardsOfPlayer);
        let countMaalPoint = this.coutCard(this.maalCard, cardsOfPlayer);
        pointCard["maal"] = countMaalPoint;
        let countYoungerMaalPoint = this.coutCard(
          this.youngerMaalCard,
          cardsOfPlayer
        );
        pointCard["YoungerMaal"] = countYoungerMaalPoint;

        let countElderMaalPoint = this.coutCard(
          this.elderMaalCard,
          cardsOfPlayer
        );
        pointCard["elderMaal"] = countElderMaalPoint;

        let countAlterMaalPoint = this.coutCard(
          this.alterMaalCard,
          cardsOfPlayer
        );

        pointCard["alterMaal"] = countAlterMaalPoint;

        let countJokerPoint = this.coutCard(
          { type: "joker", rank: 0, name: "joker", priority: 0 },
          cardsOfPlayer
        );

        pointCard["joker"] = countJokerPoint;
        let countMasterPoint = this.coutCard(
          { type: "master", rank: 0, name: "joker", priority: 0 },
          cardsOfPlayer
        );
        pointCard["master"] = countMasterPoint;
        let totalPoint =
          maalCardPoint[countMaalPoint] +
          youngerMaalCardPont[countYoungerMaalPoint] +
          elderMaalCardPont[countElderMaalPoint] +
          alterMaalCardPoint[countAlterMaalPoint] +
          +jokerPoint[countJokerPoint] +
          masterPoints[countMasterPoint];

        players[player]["point"] = totalPoint;
        players[player]["countCard"] = pointCard;
      } else {
        players[player]["point"] = 0;
      }
    }
    return players;
  };
  this.reset = function () {
    cardsInfo = {};
    this.tableCard = [];
    this.stockCard = [];
    this.allMaalCard = [];
    this.maalCard = {};
    this.alterMaalCard = {};
    this.elderMaalCard = {};
    this.youngerMaalCard = {};
    this.resetTable();
    this.resetAllPlayers();
  };
  this.decideDeal = function () {
    let firstPlayer = null,
      dealFound = false,
      isFirst = true,
      dealPlayer;
    for (let player in players) {
      if (players[player].active) {
        if (isFirst) {
          firstPlayer = players[player];
          isFirst = false;
        }
        if (players[player].deal === true) {
          players[player].deal = false;
          dealPlayer = players[player];
          dealFound = true;
        }
      }
    }
    if (!dealFound) {
      firstPlayer.deal = true;
    } else {
      let nextPlayer = this.getNextActivePlayer(dealPlayer.id);
      nextPlayer.deal = true;
    }
  };
  this.decideTurn = function () {
    let firstPlayer = null,
      dealFound = false,
      isFirst = true,
      dealPlayer;
    for (let player in players) {
      if (players[player].active) {
        if (isFirst) {
          firstPlayer = players[player];
          isFirst = false;
        }
        if (players[player].deal === true) {
          dealPlayer = players[player];
          dealFound = true;
        }
      }
    }
    if (!dealFound) {
      firstPlayer.turn = true;
    } else {
      let nextPlayer = this.getNextActivePlayer(dealPlayer.id);
      console.log("next active player", nextPlayer);
      nextPlayer ? (nextPlayer.turn = true) : nextPlayer;
    }
  };
  
  this.startGame = function () {
    cardsInfo = {};
    this.resetTable();
    this.resetAllPlayers();
    this.gameStarted = true;
    tableInfo.gameStarted = true;
    this.decideDeal();
    this.decideTurn();
    this.collectBootAmount();
    this.distributeCards();
  };
  this.resetTable();
  return this;
}



function TableManager() {
  return {
    listOfPrivateTable: [],
    listOfPublicTable: [],
    createNewPrivateTable: function (boot, privateKey) {
      let table = new Table(boot, privateKey);
      this.listOfPrivateTable.push(table);
      return table;
    },
    getPrivateTable: function (guid) {
      let result = _.where(this.listOfPrivateTable, {
        gid: guid,
      });
      if (result.length !== 0) {
        return result[0];
      }
      return null;
    },
    creaNewPublicTable: function () {
      let table = new Table();
      this.listOfPublicTable.push(table);
      return table;
    },
    getPublicTable: function () {
      for (const table of this.listOfPublicTable) {
        const contPlayer = table.getPlayersCount();
        if (contPlayer < 5) {
          return table;
        }
      }
      return null;
    },
    deletePrivateTable: function (guid) {
      // Use the filter method to create a new array without the table to delete
      this.listOfTable = this.listOfTable.filter(function (table) {
        const contPlayer = table.getPlayersCount();
        return contPlayer >= 1;
      });
    },
    getAllPublicTable: function () {
      return this.listOfPublicTable;
    },
    getAllPrivateTable: function () {
      return this.listOfPrivateTable;
    },
  };
}

module.exports = new TableManager();

const http = require("http");
const express = require("express");
const cors = require("cors");
const socketIo = require("socket.io");
const tables = require("./marriageCard/tabledecks");

const {
  joinTable,
  newPlayerJoined,
  connectionSuccess,
  gameCountDown,
  startNew,
  notification,
  resetTable,
  drawStockCard,
  drownCard,
  drawTableCard,
  throwCard,
  showCard,
  disconnect,
  playerLeft,
  showWinner,
  placeBet,
  thrownCard,
  cardShown,
  playerKickOut,
  kickOut,
  left,
  connection,
  cancelShow,
} = require("./marriageCard/action");
const app = express();

// const { PORT } = process.env;
const PORT = 8080;
app.use(cors());

app.get("/", function (req, res) {
  res.status(200).send("Status: OK");
});
const server = http.createServer(app);
const io = socketIo(server);

io.on(connection, (socket) => {
  console.log("a user is connected");
  socket.on("private", (data) => {
    init(socket, data.boot, data.key);
  });
  socket.on("public", () => {
    init(socket);
  });
});

server.listen(PORT, () => {
  console.log(`server is working on ${PORT}`);
});

function init(socket, boot, privateKey) {
  console.log("Socket is conneted here");
  let table;
  if (privateKey) {
    table = tables.getPrivateTable(privateKey);
    if (!table) {
      table = tables.createNewPrivateTable(boot, privateKey);
      console.log("A new private table is created", table);
    } else {
      console.log("An exited Private table", table);
    }
  } else {
    table = tables.getPublicTable();
    if (!table) {
      table = tables.creaNewPublicTable();
      console.log(" A new Public  table is created :", table);
    } else {
      console.log("an existing private  table", table);
    }
  }
  const room = table.gid;

  socket.on(joinTable, (args) => {
    console.log(" A new user Join", args);
    socket.join(room);
    var addedPlayer = table.addPlayer(
      {
        id: socket.id,
        playerInfo: args,
        pureRound: false,
        finished: false,
        maalSeen: false,
        setCount: 0,
        isDraw: false,
        maal: {},
        primarySet: [],
        handSet: [],
        dirtCard: [],
      },
      socket
    );

    if (addedPlayer !== false) {
      var newPlayer = {
        id: socket.id,
        tableId: table.gid,
        slot: addedPlayer.slot,
        active: addedPlayer.active,
        pureRound: addedPlayer.pureRound,
        finished: addedPlayer.finished,
        maal: addedPlayer.maal,
        isDraw: addedPlayer.isDraw,
        maalSeen: addedPlayer.maalSeen,
        setCount: addedPlayer.setCount,
        primarySet: addedPlayer.primarySet,
        dirtCard: addedPlayer.dirtCard,
        handSet: addedPlayer.handSet,
        playerInfo: args,
        otherPlayers: table.getPlayers(),
        msg: `${args.displayName} has join Game`,
      };
      console.log("new added player", newPlayer);
      socket.emit(joinTable, newPlayer);
      socket.broadcast.to(room).emit(newPlayerJoined, newPlayer);
      startNewGameOnPlayerJoin();
    }
  });
  socket.emit(connectionSuccess, {
    id: socket.id,
    tableId: table.gid,
  });

  function startNewGameOnPlayerJoin() {
    if (table.getPlayersCount() >= 2 && !table.gameStarted) {
      setTimeout(function () {
        socket.emit(gameCountDown, {
          counter: 7,
        });
        socket.broadcast.to(room).emit(gameCountDown, {
          counter: 7,
        });
      }, 1000);
      setTimeout(function () {
        if (table.getPlayersCount() >= 2 && !table.gameStarted) {
          table.startGame();
          var sentObj = {
            players: table.getPlayers(),
            table: table.getTableInfo(),
            cards: table.getCardInfo(),
            tableCard: table.tableCard,
            stockCards: table.stockCard,
            msg: "Game starts in 10 seconds",
          };
          console.log("start new game", sentObj);
          socket.emit(startNew, sentObj);
          socket.broadcast.to(room).emit(startNew, sentObj);
        } else if (table.getPlayersCount() == 1 && !table.gameStarted) {
          socket.emit(notification, {
            message: "Please wait for more players to join",
            timeout: 4000,
          });
          socket.broadcast.to(room).emit(notification, {
            message: "Please wait for more players to join",
            timeout: 4000,
          });
        }
      }, 9000);
    } else if (table.getPlayersCount() == 1 && !table.gameStarted) {
      socket.emit(notification, {
        message: "Please wait for more players to join",
        timeout: 4000,
      });
      socket.broadcast.to(room).emit("notification", {
        message: "Please wait for more players to join",
        timeout: 4000,
      });
    }
  }

  function startNewGame(after) {
    if (table.getPlayersCount() >= 2 && !table.gameStarted) {
      setTimeout(function () {
        socket.emit(gameCountDown, {
          counter: 9,
        });
        socket.broadcast.to(room).emit(gameCountDown, {
          counter: 9,
        });
      }, after || 6000);
      setTimeout(function () {
        if (table.getPlayersCount() >= 2 && !table.gameStarted) {
          table.startGame();
          var sentObj = {
            players: table.getPlayers(),
            table: table.getTableInfo(),
            cards: table.getCardInfo(),
            tableCard: table.tableCard,
            stockCards: table.stockCard,
            msg: "Games start in 10 seconds",
          };
          socket.emit(startNew, sentObj);
          socket.broadcast.to(room).emit(startNew, sentObj);
        } else if (table.getPlayersCount() == 1) {
          socket.emit(notification, {
            message: "Please wait for more players to join",
            timeout: 4000,
          });
          socket.broadcast.to(room).emit(notification, {
            message: "Please wait for more players to join",
            timeout: 4000,
          });
          // setTimeout(function() {
          table.reset();
          var sentObj = {
            players: table.getPlayers(),
            table: table.getTableInfo(),
            cards: table.getCardInfo(),
            tableCard: table.tableCard,
            stockCards: table.stockCard,
          };
          socket.emit(resetTable, sentObj);
          socket.broadcast.to(room).emit(resetTable, sentObj);
          // }, 7000);
        }
      }, 13000);
    } else if (table.getPlayersCount() == 1) {
      setTimeout(function () {
        socket.emit(notification, {
          message: "Please wait for more players to join",
          timeout: 4000,
        });
        socket.broadcast.to(room).emit(notification, {
          message: "Please wait for more players to join",
          timeout: 4000,
        });
      }, 4000);
      setTimeout(function () {
        table.reset();
        var sentObj = {
          players: table.getPlayers(),
          table: table.getTableInfo(),
          tableCard: table.tableCard,
          stockCards: table.stockCard,
          cards: table.getCardInfo(),
          msg: "Games start in 10 seconds",
        };
        socket.emit(resetTable, sentObj);
        socket.broadcast.to(room).emit(resetTable, sentObj);
      }, 4000);
    }
  }

  socket.on(drawStockCard, (args) => {
    console.log("draw a from stock", args);
    let card = table.getCardFromStockCard();
    let players = table.getPlayers();
    console.log(players);
    console.log("args.id", args.id);
    let player = players[args.id];
    player.handSet.push(card);
    player.isDraw = true;
    socket.emit("mydrownCard", {
      players: players,
      card: card,
      tableCard: table.tableCard,
      stockCard: table.stockCard,
      table: table.getTableInfo(),
      msg: `${player.playerInfo.displayName} has  picked a card of ${card.name} ${card.type} from deck`,
    });
    socket.broadcast.to(room).emit(drownCard, {
      players: players,
      card: card,
      tableCard: table.tableCard,
      stockCard: table.stockCard,
      table: table.getTableInfo(),
      msg: `${player.playerInfo.displayName} has  picked a card from deck`,
    });
  });

  socket.on(drawTableCard, (args) => {
    console.log("draw a card from table card", args);
    let card = table.getCardFromTableCard();
    let players = table.getPlayers();
    let player = players[args.id];
    player.handSet.push(card);
    player.isDraw = true;
    socket.emit(drownCard, {
      players: players,
      card: card,
      tableCard: table.tableCard,
      stockCard: table.stockCard,
      table: table.getTableInfo(),
      msg: `${player.playerInfo.displayName} has  picked a card  of ${card.name} ${card.type} from deck`,
    });
    socket.broadcast.to(room).emit(drownCard, {
      players: players,
      card: card,
      tableCard: table.tableCard,
      stockCard: table.stockCard,
      table: table.getTableInfo(),
      msg: `${player.playerInfo.displayName} has  picked a card of ${card.name} ${card.type} from deck`,
    });
  });

  socket.on(throwCard, (args) => {
    console.log("thow a card ", args);
    if (table.getActivePlayers === 1 && table.gameStarted) {
      const winnerList = table.decideWinner();
      console.log("***********winner list *******", winnerList);
      socket.emit(showWinner, {
        players: table.getPlayers(),
        table: table.getTableInfo(),
      });
      socket.broadcast.to(room).emit(showWinner, {
        players: table.getPlayers(),
        table: table.getTableInfo(),
      });
      table.stopGame();
      startNewGame();
    } else if (args.handCard.length === 0) {
      let players = table.getPlayers();
      let finisedPlayer = players[args.id];
      const winnerList = table.decideWinner();
      console.log("***********winner list *******", winnerList);
      socket.emit(showWinner, {
        finishBy: finisedPlayer,
        players: table.getPlayers(),
        table: table.getTableInfo(),
        msg: `${finisedPlayer.playerInfo.displayName} has  finished the Game`,
      });
      socket.broadcast.to(room).emit(showWinner, {
        finishBy: finisedPlayer,
        players: table.getPlayers(),
        table: table.getTableInfo(),
        msg: `${finisedPlayer.playerInfo.displayName} has  finished the Game`,
      });
      table.stopGame();
      startNewGame();
    } else {
      table.throw(args.id, args.card, args.handCard);
      let card = args.card;
      let players = table.getPlayers();
      let player = players[args.id];
      socket.emit(thrownCard, {
        players: players,
        table: table.getTableInfo(),
        cards: table.getCardInfo(),
        tableCard: table.tableCard,
        stockCard: table.stockCard,
        msg: `${player.playerInfo.displayName} has  threw a card of ${card.name} ${card.type}`,
      });
      socket.broadcast.to(room).emit(thrownCard, {
        players: players,
        table: table.getTableInfo(),
        cards: table.getCardInfo(),
        tableCard: table.tableCard,
        stockCard: table.stockCard,
        msg: `${player.playerInfo.displayName} has  threw a card of ${card.name} ${card.type}`,
      });
    }
  });

  socket.on(cancelShow, (args) => {
    table.cancelShow(args.id);
    // socket.emit("canceledCard", {
    //   players: players,
    //   table: table.getTableInfo(),
    //   tableCard: table.tableCard,
    //   stockCard: table.stockCard,
    // });
  });

  socket.on(showCard, (args) => {
    let result = table.showCards(args);
    console.log("show card handset : - ", args);
    if (result.winner) {
      socket.emit(showWinner, result);
      socket.broadcast.to(room).emit(showWinner, result);
      table.stopGame();
      startNewGame();
    } else {
      socket.emit(cardShown, result);
      socket.broadcast.to(room).emit(cardShown, result);
    }
  });

  socket.on("showSequaqnce", (args) => {
    table.showSequaqnce(args.id, args.handSet, args.pureRound);
    socket.emit("sequqnceShown", {
      players: table.getPlayers(),
      table: table.getTableInfo(),
    });
    socket.broadcast.to(room).emit("sequqnceShown", {
      players: table.getPlayers(),
      table: table.getTableInfo(),
    });
    console.log("after shown data", table.getPlayers());
  });

  socket.on(disconnect, function () {
    var removedPlayer = table.removePlayer(socket.id);

    console.log("total players left in table:" + table.getActivePlayers());
    socket.broadcast.to(room).emit(playerLeft, {
      players: table.getPlayers(),
      table: table.getTableInfo(),
    });
    if (table.getActivePlayers() == 1 && table.gameStarted) {
      const winnerList = table.decideWinner();
      console.log("***********winner list *******", winnerList);
      socket.emit(showWinner, {
        players: table.getPlayers(),
        table: table.getTableInfo(),
      });
      socket.broadcast.to(room).emit(showWinner, {
        players: table.getPlayers(),
        table: table.getTableInfo(),
      });
      table.stopGame();
      startNewGame();
    }
  });

  socket.on(left, function () {
    if (table.gameStarted && table.isActivePlayer(socket.id)) {
      table.packPlayer(socket.id);
    }
    var removedPlayer = table.removePlayer(socket.id);
    console.log("disconnect for " + socket.id);
    console.log("total players left:" + table.getActivePlayers());
    socket.broadcast.to(room).emit(playerLeft, {
      bet: {
        lastAction: "Packed",
        lastBet: "",
      },
      removedPlayer: removedPlayer,
      placedBy: removedPlayer?.id,
      players: table.getPlayers(),
      table: table.getTableInfo(),
    });
    if (table.getActivePlayers() == 1 && table.gameStarted) {
      table.decideWinner();
      socket.emit(showWinner, {
        bet: {
          lastAction: "Packed",
          lastBet: "",
        },
        placedBy: removedPlayer?.id,
        players: table.getPlayers(),
        table: table.getTableInfo(),
        packed: true,
      });
      socket.broadcast.to(room).emit(showWinner, {
        bet: {
          lastAction: "Packed",
          lastBet: "",
        },
        placedBy: removedPlayer?.id,
        players: table.getPlayers(),
        table: table.getTableInfo(),
        packed: true,
      });
      table.stopGame();
      startNewGame();
    }
  });

  socket.on(kickOut, function (args) {
    if (table.gameStarted && table.isActivePlayer(args.id)) {
      table.packPlayer(args.id);
    }
    let players = table.getPlayers();
    let removedplayer = players[args.id];
    removedplayer["kickout"] = true;
    socket.to(args.id).emit(playerKickOut, {
      bet: {
        lastAction: "Kick Out",
        lastBet: "",
      },
      players: players,
      table: table.getTableInfo(),
      removedplayer: removedplayer,
    });
    socket.broadcast.to(room).emit(playerKickOut, {
      bet: {
        lastAction: "Kick Out",
        lastBet: "",
      },
      players: players,
      table: table.getTableInfo(),
      removedplayer: removedplayer,
    });
  });
}

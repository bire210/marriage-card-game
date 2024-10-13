let Card = require("./card");
function Deck() {
  let deck = [],
    singleDeck = [],
    types = {
      heart: {
        priority: 3,
      },
      spade: {
        priority: 4,
      },
      diamond: {
        priority: 2,
      },
      club: {
        priority: 1,
      },
    };

  function makeCards() {
    for (let i = 0; i < 3; ++i) {
      for (let type in types) {
        for (let a = 1; a <= 13; a++) {
          deck.push(new Card(type, a));
        }
      }
    }
    for (let i = 0; i < 6; ++i) {
      deck.push(new Card("joker", 0));
    }
    for (let i = 0; i < 3; ++i) {
      deck.push(new Card("master", 20));
    }
  }

  function makeSingleDeck() {
    for (let type in types) {
      for (let a = 1; a <= 13; a++) {
        singleDeck.push(new Card(type, a));
      }
    }
  }
  makeCards();

  makeSingleDeck();

  function getSingleDeck() {
    return singleDeck;
  }
  function getCards() {
    return deck;
  }
  function coutCard(targetCard, playerCard) {
    console.log("player card in CountCard", playerCard);
    let matchingCards = playerCard.filter((card) => {
      return card.rank === targetCard.rank && card.type === targetCard.type;
    });
    return matchingCards.length;
  }

  function getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min, 0);
  }

  function shuffle() {
    let len = deck.length,
      tempVal,
      randIdx;
    while (0 !== len) {
      randIdx = Math.floor(Math.random() * len);
      len--;
      // deck[len].id = Math.random();
      // deck[randIdx].id = Math.random();
      tempVal = deck[len];
      deck[len] = deck[randIdx];
      deck[randIdx] = tempVal;
    }
  }

  // function getRandomCards(num) {
  //     let randCards = [];
  //     let cardInserted = {},
  //         nCard = null;
  //     for (let count = 1; count <= num;) {
  //         nCard = getRandomArbitrary(1, 52);
  //         if (!cardInserted[nCard]) {
  //             randCards.push($.extend({
  //                 id: Math.random()
  //             }, deck[nCard - 1]));
  //             cardInserted[nCard] = true;
  //             count++;
  //         }
  //     }
  //     return randCards;
  // }

  return {
    getCards: getCards,
    shuffle: shuffle,
    getSingleDeck: getSingleDeck,
    coutCard: coutCard,
  };
}
// let dectest=new Deck();
// dectest.shuffle();
// dectest.shuffle();
// console.log(dectest.getCards())
module.exports = new Deck();

function isInMaalCard(card, maalCard) {
  return maalCard.some(
    (maalCardItem) =>
      maalCardItem.type === card.type &&
      maalCardItem.rank === card.rank &&
      maalCardItem.name === card.name &&
      maalCardItem.priority === card.priority
  );
}

// helper function to replace all maal card as joker/ all maal card consider as joker for making dirty sets
function makeSetForDirty(cardset, maalCard) {
  let modifiedCardset = cardset.map((card) => {
    if (isInMaalCard(card, maalCard)) {
      return { type: "joker", rank: 0, name: "joker", priority: 0 };
    } else {
      return card;
    }
  });
  console.log("modified card set", modifiedCardset);
  return modifiedCardset;
}

// Helper function to check if cards have the same rank
function hasSameRank(cards) {
  const firstRank = cards[0].rank;
  return cards.every((card) => card.rank === firstRank);
}

// Helper function to check if cards have the same suit
function hasSameSuit(cards) {
  const firstSuit = cards[0].type;
  return cards.every((card) => card.type === firstSuit);
}

// Helper function to check if cards form a sequence
function isSequence(cards) {
  cards.sort((a, b) => a.rank - b.rank);
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i + 1].rank !== cards[i].rank + 1) {
      return false;
    }
  }
  return true;
}

//   function to check if cards is dirty sequence

const isDirtySequqnce = function (cards, maalCardSet) {
  console.log("card details", cards, maalCardSet);
  let updatedCards = makeSetForDirty(cards, maalCardSet);
  console.log("Updtaed card set", updatedCards);
  updatedCards.sort((a, b) => a.rank - b.rank);
  console.log("soted *********************", updatedCards);
  for (let i = 1; i < updatedCards.length - 1; i++) {
    if (
      updatedCards[i + 1].rank !== updatedCards[i].rank + 1 &&
      updatedCards[i + 1].rank !== updatedCards[i].rank + 2
    ) {
      return false;
    }
  }
  return updatedCards[0].name === "joker";
};
// Helper function to check if cards form a pure sequence
//   this is working
const isPureSequence = function (cards) {
  if (!hasSameSuit(cards)) {
    return false;
  }
  return isSequence(cards);
};

// Helper function to check if cards form a trial
//   this is working
const isTrial = function (cards) {
  return cards.length === 3 && hasSameRank(cards) && !hasSameSuit(cards);
};

// Helper function to check if cards form a dirty trial
const isDirtyTrial = function (cards, maalCardSet) {
  let updatedCards = makeSetForDirty(cards, maalCardSet);
  // console.log("Updtaed card set",updatedCards)
  updatedCards.sort((a, b) => a.rank - b.rank);
  return (
    updatedCards.length >= 3 &&
    hasSameRank(updatedCards.slice(1, updatedCards.length)) &&
    !hasSameSuit(updatedCards.slice(1, updatedCards.length)) &&
    updatedCards.some((card) => card.name === "joker")
  );
};

// Helper function to check if cards form a tunnel
//   this is working
const isTunnel = function (cards) {
  return cards?.length === 3 && hasSameRank(cards) && hasSameSuit(cards);
};

const isDublee = function (cards) {
  return cards?.length == 2 && hasSameRank(cards) && hasSameSuit(cards);
};
// Example usage:
const cardSet1 = [
  // { type: 'club', rank: 2, name: '2' },
  { type: "joker", rank: 0, name: "joker" },
  { type: "club", rank: 5, name: "5" },
  { type: "spade", rank: 5, name: "5" },
  // { type: 'club', rank: 4, name: '4' },
];

const findAndRemoveMatchingSet = function (cardSet) {
  let card = [];
  for (let i = 0; i < cardSet.length - 2; i++) {
    for (let j = i + 1; j < cardSet.length - 1; j++) {
      for (let k = j + 1; k < cardSet.length; k++) {
        const potentialSet = [cardSet[i], cardSet[j], cardSet[k]];
        if (
          (isPureSequence(potentialSet) && !hasSameRank(potentialSet)) ||
          (isTunnel(potentialSet) &&
            (potentialSet[0].type !== "joker" ||
              potentialSet[0].type !== "master"))
        ) {
          card.push(...potentialSet);
          cardSet.splice(k, 1);
          cardSet.splice(j, 1);
          cardSet.splice(i, 1);
          return [card, cardSet];
        }
      }
    }
  }
  return null;
};

const findAndRemoveMatchingDirtySet = function (cardSet, maalCardSet) {
  let card = [];
  for (let i = 0; i < cardSet.length - 2; i++) {
    for (let j = i + 1; j < cardSet.length - 1; j++) {
      for (let k = j + 1; k < cardSet.length; k++) {
        const potentialSet = [cardSet[i], cardSet[j], cardSet[k]];
        if (
          (isPureSequence(potentialSet) && !hasSameRank(potentialSet)) ||
          (isTunnel(potentialSet) &&
            (potentialSet[0].type !== "joker" ||
              potentialSet[0].type !== "master")) ||
          isTrial(potentialSet) ||
          (isDirtySequqnce(potentialSet, maalCardSet) &&
            !hasSameRank(potentialSet))
        ) {
          card.push(...potentialSet);
          cardSet.splice(k, 1);
          cardSet.splice(j, 1);
          cardSet.splice(i, 1);
          return [card, cardSet];
        }
      }
    }
  }
  return null;
};

module.exports = {
  isDublee,
  isDirtySequqnce,
  isDirtyTrial,
  isPureSequence,
  isTrial,
  isTunnel,
  findAndRemoveMatchingSet,
  findAndRemoveMatchingDirtySet,
};

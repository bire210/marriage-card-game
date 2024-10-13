
let num = 165;
function Card(type, rank) {
    this.type = type;
    if (rank == 20) {
        this.rank = 0;
    } else {
        this.rank = rank;
    }

    this.name = this.getName(rank);
    this.priority = this.getPriority(rank);
    this.id = `${type}${this.getName(rank)}${rank}${num++}`

}

Card.prototype.getName = function () {
    if (this.rank === 20) {
        return "master";
    }
    switch (this.rank) {
        case 0:
            return "joker";
        case 1:
            return "A";
        case 11:
            return "J";
        case 12:
            return "Q";
        case 13:
            return "K";
        default:
            return this.rank.toString();
    }
}
Card.prototype.getPriority = function () {
    if (this.rank === 20) {
        return (0);
    }
    switch (this.rank) {
        case 1:
            return 14;
        default:
            return this.rank;
    }
}

module.exports = Card;
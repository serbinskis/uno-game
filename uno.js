const config = require("./config");

//Create room for player (later, maybe include settings - maxplayers, maxcards, startcrads, timer, canstack, canjumpin)
function CreateRoom(uid, max_players, max_cards) {
    return {
        owner: uid,
        direction: config.DIRECTION_FORWARD,
        max_players: max_players,
        max_cards: max_cards,
        current_move: '',
        current_card: {},
        started: false,
        players: {},
        cards: {},
    }
}
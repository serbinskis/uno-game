module.exports = {
    PORT: 80,
    MAX_PLAYERS: 10,
    MAX_CARDS: 100,
    START_CARDS: 8,
    NEXT_GAME_TIMEOUT: 10,

    DIRECTION_FORWARD: 1,
    DIRECTION_REVERSE: -1,

    error_codes: {
        '200': 'OK',
        '400': 'Bad request',
        '404': 'Not Found',
        '500': 'Internal Server Error',

        '1001': 'There was an error uploading avatar!',
        '1002': 'Game already started!',
        '1003': 'Max players!',
        '1004': 'Invalid username!',
        '1005': 'Invalid invite!',
    },

    colors: ["BLUE", "GREEN", "RED", "YELLOW"],

    cards: {
        standart: [
            {color: "BLUE", type: "ZERO"},
            {color: "BLUE", type: "ONE"},
            {color: "BLUE", type: "TWO"},
            {color: "BLUE", type: "THREE"},
            {color: "BLUE", type: "FOUR"},
            {color: "BLUE", type: "FIVE"},
            {color: "BLUE", type: "SIX"},
            {color: "BLUE", type: "SEVEN"},
            {color: "BLUE", type: "EIGHT"},
            {color: "BLUE", type: "NINE"},

            {color: "GREEN", type: "ZERO"},
            {color: "GREEN", type: "ONE"},
            {color: "GREEN", type: "TWO"},
            {color: "GREEN", type: "THREE"},
            {color: "GREEN", type: "FOUR"},
            {color: "GREEN", type: "FIVE"},
            {color: "GREEN", type: "SIX"},
            {color: "GREEN", type: "SEVEN"},
            {color: "GREEN", type: "EIGHT"},
            {color: "GREEN", type: "NINE"},

            {color: "RED", type: "ZERO"},
            {color: "RED", type: "ONE"},
            {color: "RED", type: "TWO"},
            {color: "RED", type: "THREE"},
            {color: "RED", type: "FOUR"},
            {color: "RED", type: "FIVE"},
            {color: "RED", type: "SIX"},
            {color: "RED", type: "SEVEN"},
            {color: "RED", type: "EIGHT"},
            {color: "RED", type: "NINE"},

            {color: "YELLOW", type: "ZERO"},
            {color: "YELLOW", type: "ONE"},
            {color: "YELLOW", type: "TWO"},
            {color: "YELLOW", type: "THREE"},
            {color: "YELLOW", type: "FOUR"},
            {color: "YELLOW", type: "FIVE"},
            {color: "YELLOW", type: "SIX"},
            {color: "YELLOW", type: "SEVEN"},
            {color: "YELLOW", type: "EIGHT"},
            {color: "YELLOW", type: "NINE"},
        ],
        special: [
            {color: "BLUE", type: "REVERSE"},
            {color: "BLUE", type: "BLOCK"},
            {color: "BLUE", type: "PLUS_TWO"},

            {color: "GREEN", type: "REVERSE"},
            {color: "GREEN", type: "BLOCK"},
            {color: "GREEN", type: "PLUS_TWO"},

            {color: "RED", type: "REVERSE"},
            {color: "RED", type: "BLOCK"},
            {color: "RED", type: "PLUS_TWO"},

            {color: "YELLOW", type: "REVERSE"},
            {color: "YELLOW", type: "BLOCK"},
            {color: "YELLOW", type: "PLUS_TWO"},

            {color: "ANY", type: "COLOR_CHANGE"},
            {color: "ANY", type: "PLUS_FOUR"},
        ],
        cover: {color: "ANY", type: "UNO_CARD"}
    }
}
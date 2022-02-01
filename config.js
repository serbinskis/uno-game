module.exports = {
    PORT: 80, //Port
    DIRECTION_FORWARD: 1, //Normal direction, dont change this
    DIRECTION_REVERSE: -1, //Reverse direction, dont change this
    NEXT_GAME_TIMEOUT: 10, //Time before next game starts (seconds)
    TURN_DELAY: Math.round(2.0*1000), //Delay between turns (ms)
    UNO_CARD_AMOUNT: 2, //Amount of cards to take when someone presses uno
    MAX_IMAGE_SIZE: 1024*1024*5, //Maximum size of image in bytes

    //Maximum amount of players,
    MAX_PLAYERS: {
        default: 4,
        minimum: 2,
        maximum: 100,
    },

    //Maximum amount of cards which can hold player
    MAX_CARDS: {
        default: 100,
        minimum: 2,
        maximum: 999,
    },

    //Amount of cards every player will get
    START_CARDS: {
        default: 8,
        minimum: 1,
        maximum: 100,
    },

    DRAW_TO_MATCH: true, //Draw cards until get playable one
    CAN_STACK_CARDS: true, //Can put same cards at one turn
    CAN_JUMP_IN: true, //Can jump in when cards are same
    CAN_UNO: true, //Can do uno when 1 card

    error_codes: {
        "200": "OK",
        "400": "Bad request",
        "404": "Not Found",
        "500": "Internal Server Error",

        "1001": "There was an error uploading avatar!",
        "1002": "Game already started!",
        "1003": "Max players!",
        "1004": "Invalid username! Username is too short or too long!",
        "1005": "Invalid invite! Must be 8 symbols a-z, 0-9.",
        "1006": "File is too big!",

        "2001": "You have been kicked from this room!",
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
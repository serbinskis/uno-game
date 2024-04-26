import fs from 'fs';
import config from './config';
import crypto from 'crypto';
import Canvas from 'canvas';
import wutils from 'wobbychip-utils';
import wtimer from 'wobbychip-utils/timer';
import { Server, Socket } from 'socket.io';
import { UnoPlayer } from './player';
import { UnoEvents } from './events';

export class UnoGame {
    static games: { [room_id: string]: UnoGame } = {};
    io: Server;
    opts: any;
    deleted: boolean = false;
    room_id: string;
    owner_id: string;
    players: { [player_id: string]: UnoPlayer } = {};
    players_json: { [player_id: string]: any } = {};
    cards: { [player_id: string]: any } = {};
    current_move: string = '';
    current_card: { color: string; type: string; } = config.cards.cover;
    stack: number = 0;
    started: boolean = false;
    skipped: boolean = false;
    choose_color: boolean = false;
    choose_id: string = null;
    turn_delay: number = null;
    player_delay: number = null;
    player_delay_date: Date;
    uno_id: string = null;
    winner_id: string = null;
    direction: number = config.DIRECTION_FORWARD;

    start_cards: number = config.START_CARDS.default;
    max_players: number = config.MAX_PLAYERS.default;
    max_cards: number = config.MAX_CARDS.default;
    player_time: number = config.PLAYER_TIME.default;
    draw_to_match: boolean = config.DRAW_TO_MATCH;
    can_stack_cards: boolean = config.CAN_STACK_CARDS;
    can_jump_in: boolean = config.CAN_JUMP_IN;
    can_uno: boolean = config.CAN_UNO;
    can_rejoin: boolean = config.CAN_REJOIN;


    constructor(io: Server, opts: any) {
        this.io = io;
        this.opts = opts;
        this.room_id = opts.room_id;
        this.owner_id = opts.owner_id;
        this.start_cards = wutils.between(opts.start_cards, config.START_CARDS.minimum, config.START_CARDS.maximum) ? opts.start_cards : config.START_CARDS.default;
        this.max_players = wutils.between(opts.max_players, config.MAX_PLAYERS.minimum, config.MAX_PLAYERS.maximum) ? opts.max_players : config.MAX_PLAYERS.default;
        this.max_cards = wutils.between(opts.max_cards, config.MAX_CARDS.minimum, config.MAX_CARDS.maximum) ? opts.max_cards : config.MAX_CARDS.default;
        this.player_time = wutils.between(opts.player_time, config.PLAYER_TIME.minimum, config.PLAYER_TIME.maximum) ? opts.player_time : config.PLAYER_TIME.default;
        this.draw_to_match = (opts.draw_to_match != null) ? ((typeof opts.draw_to_match === 'string') ? (opts.draw_to_match == 'ON') : opts.draw_to_match) : config.DRAW_TO_MATCH;
        this.can_stack_cards = (opts.can_stack_cards != null) ? ((typeof opts.can_stack_cards === 'string') ? (opts.can_stack_cards == 'ON') : opts.can_stack_cards) : config.CAN_STACK_CARDS;
        this.can_jump_in = (opts.can_jump_in != null) ? ((typeof opts.can_jump_in === 'string') ? (opts.can_jump_in == 'ON') : opts.can_jump_in) : config.CAN_JUMP_IN;
        this.can_uno = (opts.can_uno != null) ? ((typeof opts.can_uno === 'string') ? (opts.can_uno == 'ON') : opts.can_uno) : config.CAN_UNO;
        this.can_rejoin = (opts.can_rejoin != null) ? ((typeof opts.can_rejoin === 'string') ? (opts.can_rejoin == 'ON') : opts.can_rejoin) : config.CAN_REJOIN;

        UnoGame.games[opts.room_id] = this;
    }

    static async createAvatar(buffer: any): Promise<string> {
        try {
            const hex = crypto.createHash('sha1').update(buffer).digest('hex');
            if (fs.existsSync(`${config.AVATARS_DIR}/${hex}.png`)) { return hex; }

            const frameImage = await Canvas.loadImage('website/resources/frame.png');
            const avatarImage = await Canvas.loadImage(buffer);
            const canvas = Canvas.createCanvas(frameImage.width, frameImage.height);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'black';
            ctx.fillRect(13, 13, 104, 104);
            ctx.drawImage(avatarImage, 13, 13, 104, 104);
            ctx.drawImage(frameImage, 0, 0);

            if (!fs.existsSync(config.AVATARS_DIR)) { fs.mkdirSync(config.AVATARS_DIR); }
            fs.writeFileSync(`${config.AVATARS_DIR}/${hex}.png`, canvas.toBuffer());
            return hex;
        } catch(e) {
            return null;
        }
    }

    static generateCard(includeSpecial: boolean): { color: string; type: string; } {
        if (includeSpecial && (wutils.randomRange(1, 2) == 2)) {
            return config.cards.special[wutils.randomRange(0, config.cards.special.length-1)];
        }
    
        return config.cards.standart[wutils.randomRange(0, config.cards.standart.length-1)];
    }

    static getRoom(arg0: Socket | string): UnoGame {
        if (typeof arg0 === 'string') {
            return UnoGame.games[arg0] ? UnoGame.games[arg0] : null;
        } else {
            return UnoGame.games[(arg0 as any).room_id] ? UnoGame.games[(arg0 as any).room_id] : null;
        }
    }

    deleteRoom(): void {
        this.deleted = true;
        if (this.turn_delay) { wtimer.stop(this.turn_delay); }
        if (this.player_delay) { wtimer.stop(this.player_delay); }
        delete UnoGame.games[this.room_id];
    }

    //Generate starting cards for player
    generateCards(player_id: string, includeSpecial: boolean): { [card_id: string]: any; } {
        if (!this.cards[player_id]) { this.cards[player_id] = {} }

        for (var i = 0; i < this.start_cards; i++) {
            this.cards[player_id][wutils.uuidv4(true)] = UnoGame.generateCard(includeSpecial);
        }

        this.getPlayer(player_id).setCardCount(this.start_cards);
        return this.cards[player_id];
    }

    //Remove player from game and return id of a new owner
    removePlayer(player_id: string): string {
        if (this.started) {
            var player = this.getPlayer(player_id);
            player.disconnectPlayer();
            this.players_json[player_id].disconnected = true;
            if (player.isLeft()) { this.players_json[player_id].left = true }
        } else {
            var player = this.getPlayer(player_id);
            player.setLeft(true);
            player.removePlayer();
            delete this.players[player_id];
            delete this.players_json[player_id];
        }

        //If left player is not last and he was owner then select new owner
        if ((this.getOnline(true) != 0) && (this.owner_id == player_id)) {
            for (const player of this.getPlayers()) {
                if (!player.isOnline(true)) { continue; }
                return (this.owner_id = player.getId());
            }
        }

        return this.owner_id;
    }

    emit(event: string, ...args: any[]): boolean {
        return this.io.sockets.to(this.room_id).emit(event, ...args);
    }

    addCard(player_id: string, card_id: string, card: { color: string; type: string; }): { color: string; type: string; } {
        var player = this.getPlayer(player_id);
        player.setCardCount(player.getCardCount()+1);
        return (this.cards[player_id][card_id] = card);
    }

    setPlayer(socket: Socket, options: { username: string, avatar: string, player_id: string, card_count: number }): UnoPlayer {
        this.players_json[options.player_id] = options;
        return (this.players[options.player_id] = new UnoPlayer(socket, Object.assign({ room_id: this.room_id }, options)));
    }

    getPlayer(player_id: string): UnoPlayer {
        return this.players[player_id] ? this.players[player_id] : null;
    }

    getPlayers(): UnoPlayer[] {
        return Object.values(this.players);
    }

    getPlayerCards(player_id: string): any {
        return this.cards[player_id];
    }

    getPlayerSocket(player_id: string): Socket {
        return this.getPlayer(player_id).getSocket();
    }

    getPlayersJSON(): any {
        return this.players_json;
    }

    getId(): string {
        return this.room_id;
    }

    getOnline(includeDisconnected: boolean): number {
        return this.getPlayers().filter((e) => e.isOnline(includeDisconnected)).length;
    }

    getOwner(): string {
        return this.owner_id;
    }

    setOwner(owner_id: string): string {
        return (this.owner_id = owner_id);
    }

    isStarted(): boolean {
        return this.started;
    }

    setStarted(started: boolean): boolean {
        return (this.started = started);
    }

    isChoosingColor(): boolean {
        return this.choose_color;
    }

    setChoosingColor(choose_color: boolean): boolean {
        return (this.choose_color = choose_color);
    }

    getChoosingId(): string {
        return this.choose_id;
    }

    setChoosingId(choose_id: string): string {
        return (this.choose_id = choose_id);
    }

    getPlayerDelay(): number {
        return this.player_delay;
    }

    //Will return aproximate player delay in seconds since last time it was started
    //FUCK, have no clue how to explain this
    getCurrentPlayerDelay(): number {
        if (!this.player_delay) { return 0; }
        return Math.round(this.player_time-((new Date().getTime() - this.player_delay_date.getTime())/1000));
    }

    getDirection(): number {
        return this.direction;
    }

    getCurrentMove(): string {
        return this.current_move;
    }

    setCurrentMove(current_move: string): string {
        return (this.current_move = current_move);
    }

    getCurrentCard(): { color: string; type: string; } {
        return this.current_card;
    }

    setCurrentCard(current_card: any): any {
        return (this.current_card = current_card);
    }

    setUno(uno_id: string): string {
        return (this.uno_id = uno_id);
    }

    getUno(): string {
        return this.uno_id;
    }

    setWinner(winner_id: string): string {
        return (this.winner_id = winner_id);
    }

    getWinner(): string {
        return this.winner_id;
    }

    isWinner() {
        return (this.winner_id != null);
    }

    isSkipped() {
        return this.skipped;
    }

    setStack(stack: number): number {
        return (this.stack = stack);
    }

    getStack(): number {
        return this.stack;
    }

    getMaxPlayers(): number {
        return this.max_players;
    }

    canJumpIn(): boolean {
        return this.can_jump_in;
    }

    canUno(): boolean {
        return this.can_uno;
    }

    canRejoin(): boolean {
        return this.can_rejoin;
    }

    getMaxCards(): number {
        return this.max_cards;
    }

    getPlayerTime(): number {
        return this.player_time;
    }

    drawToMatch(): boolean {
        return this.draw_to_match;
    }

    canStackCards(): boolean {
        return this.can_stack_cards;
    }

    async resetRoom(): Promise<void> {
        //Stop timers if they are running
        if (this.turn_delay) { wtimer.stop(this.turn_delay); }
        if (this.player_delay) { wtimer.stop(this.player_delay); }

        //This amount before winner screen appears (500) + wait little more (1000)
        await wutils.Wait(config.NEXT_GAME_TIMEOUT*1000 + 1500);
        if (this.deleted) { return; }

        //Get list of players to select random for first move
        var players: UnoPlayer[] = this.getPlayers().filter((e) => e.isOnline(true));

        //Recreate room - this will replace existing room
        var new_room = new UnoGame(this.io, this.opts);
        new_room.players = this.players;
        new_room.players_json = this.players_json;
        new_room.setStarted(true);
        new_room.setOwner(this.getOwner());
        new_room.setCurrentMove(players[wutils.randomRange(0, players.length-1)].getId()); //Select random player
        new_room.setCurrentCard(UnoGame.generateCard(false)); //Generate first card

        //Generate cards for players and send info
        for (const player of new_room.getPlayers()) {
            var cards: any = new_room.generateCards(player.getId(), true); //Generate starting cards
            player.emit('join', { code: 200, players: new_room.getPlayersJSON(), owner_id: new_room.getOwner() });
            player.emit('start', { code: 200, cards: cards, current_card: new_room.getCurrentCard(), current_move: new_room.getCurrentMove(), player_time: new_room.getPlayerTime() });
       }

       new_room.startPlayerTimer();
    }

    changeColor(color: string): boolean {
        //Check if current card is PLUS_FOUR or COLOR_CHANGE
        if ((this.current_card.type != 'PLUS_FOUR') && (this.current_card.type != 'COLOR_CHANGE')) { return false; }
        this.setChoosingColor(false);
        this.current_card = { color: color, type: this.current_card.type }
        this.emit('change_color', { color: color, type: this.current_card.type });
        return true;
    }

    setTurnDelay(turn_delay: number): number {
        return (this.turn_delay = turn_delay);
    }

    getTurnDelay(): number {
        return this.turn_delay;
    }

    startTurnDelay(player_id: string, next_by: number) {
        if (this.turn_delay) { wtimer.stop(this.turn_delay); }

        //Delay next move after selecting color
        this.turn_delay = wtimer.start(() => {
            this.current_move = this.nextPlayer(player_id, next_by); //Get and set next player
            this.turn_delay = null; //Clear delay variable
            this.uno_id = null; //Clear uno variable
            this.emit('next_move', { next_move: this.current_move, player_time: this.player_time });
            this.startPlayerTimer();
        }, config.TURN_DELAY);
    }

    startPlayerTimer(): void {
        //+ If game finishes, like there is a winner, crash happends
        //game.js:324 -> var socket = this.getPlayer(this.current_move).getSocket();
        //Cannot read properties of null (reading 'getSocket')

        //+ If player leaves timer does not reset, It just executes faster
        //Probaly should execute startPlayerTimer() inside disconnect event

        //+ If draw_to_match enabled timer will rerun.
        //Instead better make loop and new variable skipped

        //+ Also this will not prevent save or place dialog
        //Better if it would be skipped aswell

        //- BTW this will not work if player is stacking, since
        //when player is stacking the turn dealy is active which prevents
        //taking cards, so timer by default when taking cards will not work

        if (this.player_delay) { wtimer.stop(this.player_delay); }
        this.player_delay_date = new Date();

        this.player_delay = wtimer.start(() => {
            this.skipped = true;
            var socket: Socket = this.getPlayer(this.current_move).getSocket();
            var color = config.colors[wutils.randomRange(0, config.colors.length-1)];

            var isChoosingColor = this.isChoosingColor();
            var choosingId = this.getChoosingId();

            if (isChoosingColor) { UnoEvents.execute(this.io, socket, 'change_color', { color: color }); }
            if (choosingId) { UnoEvents.execute(this.io, socket, 'save_card', { card_id: choosingId }); }
            if (!isChoosingColor && !choosingId) UnoEvents.execute(this.io, socket, 'take_card');
            this.skipped = false;
        }, this.player_time*1000 + 500);

        var player = this.getPlayer(this.current_move);
        if (player.isDisconnected()) { wtimer.finish(this.player_delay); }
        if ((this.player_time <= 0) && !player.isDisconnected()) { wtimer.stop(this.player_delay); }
    }

    startPlayerDisconnect(player_id: string) {
        //Some weird error in here
        var player: UnoPlayer = this.getPlayer(player_id);
        player.disconnect_delay = wtimer.start(() => {
            if (this.deleted) { return; }
            player.setLeft(true);
            this.players_json[player_id].left = true;
            this.emit('disconnected', { left_id: player_id });
        }, config.REJOIN_TIME);
    }

    stopPlayerDisconnect(player_id: string) {
        wtimer.stop(this.getPlayer(player_id).disconnect_delay);
    }

    nextPlayer(player_id: string, by: number): string {
        var players_id = Object.keys(this.players);
        var index = players_id.indexOf(player_id);
        if (index == -1) { return null; } // -1, not found

        index += this.direction;

        while (index > players_id.length-1) {
            index = index - players_id.length;
        }

        while (index < 0) {
            index = players_id.length + index;
        }

        var player_id = players_id[index];
        var player: UnoPlayer = this.getPlayer(player_id);

        //Return only if last by and player has not left
        return ((by <= 1) && player.isOnline(false)) ? player_id : this.nextPlayer(player_id, (!player.isOnline(false) ? by : by-1));
    }

    sendWhoCanJumpIn(blocked_id?: string): void {
        for (const player of this.getPlayers()) {
            //Yes, I know, blocked_id may be undefined, and, WHO CARES
            if (!player.isOnline(true) || (player.getId() == blocked_id)) { continue; }

            //FUCK if I am current player then this (player.getId() == blocked_id) will prevent
            //me from getting info

            //Don't send info to current playing player if stacking is disabled
            if ((player.getId() == this.current_move) && !this.canStackCards()) { continue; }

            var cards = Object.entries(this.getPlayerCards(player.getId())).filter(([_, card]: any) => {
                var card_color = (card.color != 'ANY') ? card.color : this.current_card.color;
                return ((card_color == this.current_card.color) && (card.type == this.current_card.type));
            }).map(([card_id, _]) => card_id);

            if (cards.length > 0) { player.emit('can_jump_in', { cards: cards }); }
        }
    }

    canPlayCard(card: any, update?: boolean): any[] {
        var next_by: number = 1;
        var pick_color: boolean = false;

        switch (card.type) {
            case 'REVERSE': //Can put on same color or same type, reverse direction, can be put after stack was taken
                if (this.stack > 0 || (card.color != this.current_card.color && card.type != this.current_card.type)) { return [false]; }
                if (update) { this.direction *= config.DIRECTION_REVERSE; }
                break;
            case 'BLOCK': //Can put on same color or same type, just skip by 1 more, can be put after stack was taken
                if (this.stack > 0 || (card.color != this.current_card.color && card.type != this.current_card.type)) { return [false]; }
                next_by += 1;
                break;
            case 'PLUS_TWO': //Cannot put PLUS_TWO on PLUS_FOUR, but can put it on anything else with same color, can be put after stack was taken
                if ((this.stack > 0 && this.current_card.type == 'PLUS_FOUR') || (card.color != this.current_card.color && card.type != this.current_card.type)) { return [false]; }
                if (update) { this.stack += 2; }
                break;
            case 'PLUS_FOUR': //PLUS_FOUR can be aplied to everything there is no limits, so no need to check color or type
                pick_color = true;
                if (update) { this.stack += 4; }
                break;
            case 'COLOR_CHANGE': //Cannot be put on PLUS_FOUR and PLUS_TWO, but can put it on anything else with different color, can be put after stack was taken
                if ((this.stack > 0 && (this.current_card.type == 'PLUS_FOUR' || this.current_card.type == 'PLUS_TWO'))) { return [false]; }
                pick_color = true;
                break;
            default:
                if (this.stack > 0 || ((card.color != this.current_card.color) && (card.type != this.current_card.type))) { return [false]; }
        }

        return [true, next_by, pick_color];
    }
}
import wutils from 'wobbychip-utils';
import wtimer from 'wobbychip-utils/timer';
import config from '../config';
import { Server, Socket } from 'socket.io';
import { UnoPlayer } from '../player';
import { UnoGame } from '../game';

export class EventPlaceCard {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        //Check if data is valid, must contain card_id
        if (!data?.card_id) { return; }

        //Check conditions when card can be placed
        if (!room.isStarted() || room.isChoosingColor()) { return; }

        //Get current card
        var card = room.getPlayerCards(player.getId())[data.card_id];
        if (!card) { return; }

        //Check if player has time to stack card and if card is same color and type
        if (room.getTurnDelay()) {
            var jump_in = ((room.getCurrentMove() != player.getId()) && room.canJumpIn()); //Check if player can jump in
            var card_color = (card.color != 'ANY') ? card.color : room.getCurrentCard().color;
            if (!(room.canStackCards() || jump_in) || (card_color != room.getCurrentCard().color) || (card.type != room.getCurrentCard().type)) { return; }
        } else {
            if (room.getCurrentMove() != player.getId()) { return; } //If it's not delay then player cant jump in
        }

        //Store information here
        var can_play_card = room.canPlayCard(card, true);
        if (!can_play_card[0]) { return; }
        var next_by = can_play_card[1];
        var pickcolor = can_play_card[2];

        room.setCurrentCard(card); //Update current card
        delete room.getPlayerCards(player.getId())[data.card_id]; //Remove card from player
        room.setChoosingId(null); //Clear choose if player was choosing
        player.setCardCount(player.getCardCount()-1); //Decrease players card count

        if (jump_in) {
            room.startPlayerTimer();
            room.emit('next_move', { next_move: player.getId(), player_time: room.getPlayerTime(), jumped_in: room.getCurrentMove() }); //If someone jumped in then change move to them
            room.setCurrentMove(player.getId()); //Change current move to new player
            wtimer.stop(room.getTurnDelay()); //Stop delay, and clear it
            room.setTurnDelay(null); //New delay will be created bellow
        }

        data = {
            new_card: card, //new placed card
            stack: room.getStack(), //Count of stacked cards
            remove_card_id: data.card_id, //used to remove card from player
            direction: room.getDirection(), //What, direction normal or reverse
            pickcolor: pickcolor, //Should player pick color
            player_id: player.getId(), //Whos playing
            card_count: player.getCardCount(), //What is new count
        }

        //If it should be uno button
        if ((player.getCardCount() == 1) && room.canUno()) {
            room.setUno(player.getId());
            data.uno_id = player.getId();
            data.uno_x = (200+wutils.randomRange(0, 150))*(wutils.randomRange(1, 2) == 1 ? -1 : 1);
            data.uno_y = wutils.randomRange(-100, 100);
        }

        //Check if player won
        if (player.getCardCount() == 0) {
            room.setCurrentMove(null);
            room.setWinner(player.getId());
            data.winner_id = player.getId();
            data.timeout = config.NEXT_GAME_TIMEOUT;

            room.emit('place_card', data);
            return room.resetRoom();
        }

        //Check if and who was blocked
        if (next_by >= 2) {
            data.blocked = room.nextPlayer(player.getId(), 1);
        }

        if (pickcolor) {
            room.setChoosingColor(true);
        } else {
            if (room.canJumpIn()) { room.sendWhoCanJumpIn(data.blocked); } //If player not selecting color, send info who can jump in 
        }

        //Send data
        room.emit('place_card', data);

        //If selecting color, clear delay
        if (pickcolor) {
            wtimer.stop(room.getTurnDelay());
            return room.setTurnDelay(null);
        }

        //Reset timer every time player stack their card
        if (room.getTurnDelay()) {
            return wtimer.change(room.getTurnDelay(), config.TURN_DELAY);
        }

        //Start timer between next player will get his turn
        room.startTurnDelay(player.getId(), next_by);
    }
}
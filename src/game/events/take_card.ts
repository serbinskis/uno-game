import wutils from 'wobbychip-utils';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';

export class EventTakeCard {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        if (!room.isStarted() || room.isChoosingColor() || room.getTurnDelay() || room.getChoosingId() || (room.getCurrentMove() != player.getId())) { return; }

        //Check if player has cards to play, and if he is just skipping his turn
        var can_play_card_before = Object.values(room.getPlayerCards(player.getId())).some(card => room.canPlayCard(card)[0]);
        var take_count = (room.getStack() > 0) ? room.getStack() : 1;
        var can_play_card_after = false;  //Check if player got needed card to play
        var cards = {}

        while ((take_count != 0) && (player.getCardCount() < room.getMaxCards())) {
            var card_id = wutils.uuidv4(true); //Generate uid
            var card = UnoGame.generateCard(true); //Generate card
            if (!can_play_card_after) { can_play_card_after = room.canPlayCard(card)[0]; }

            cards[card_id] = card; //This will be sent to player
            room.addCard(player.getId(), card_id, card); //Save also on server side

            //If player ran out of time and draw to match is enabled, player will take cards until he can play
            //Should take in count that draw to match has no power if player is taking stack
            var should_repeat = (room.isSkipped() && room.drawToMatch() && !(room.getStack() > 0) && !can_play_card_before && !can_play_card_after);
            if (!should_repeat) { take_count -= 1; } //Decrease amount to take
        }

        //if ((room.getStack() > 0) || can_play_card_before || room.isSkipped()) {

        //If player was taking stack or had card to play skip his turn
        if ((room.getStack() > 0) || can_play_card_before || room.isSkipped()) {
            can_play_card_after = false;
            room.setCurrentMove(room.nextPlayer(player.getId(), 1));
        } else {
            room.setChoosingId(can_play_card_after ? Object.keys(cards)[0] : null); //If player got playable card, ask him to play or save
            room.setCurrentMove((can_play_card_after || room.drawToMatch()) ? player.getId() : room.nextPlayer(player.getId(), 1)); //Dont change current move if player is choosing
        }

        room.setStack(0);
        player.emit('take_card', { cards: cards, choose: can_play_card_after });
        room.emit('take_card', {
            stack: room.stack,
            next_move: room.getCurrentMove(),
            player_time: room.getPlayerTime(),
            update: { do_update: (Object.keys(cards).length > 0), player_id: player.getId(), card_count: player.getCardCount() }
        });

        room.startPlayerTimer();
    }
}
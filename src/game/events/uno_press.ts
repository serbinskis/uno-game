import config from '../config';
import wutils from 'wobbychip-utils';
import wtimer from 'wobbychip-utils/timer';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';

export class EventUnoPress {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        if (!room.isStarted() || !room.getUno()) { return; }

        if (room.getUno() == player.getId()) {
            room.setUno(null);
            if (room.getTurnDelay()) { wtimer.change(room.getTurnDelay(), config.TURN_DELAY); }
            return room.emit('uno_press'); //Remove uno button
        }

        //Get uno players cards
        var player_cards: any = room.getPlayerCards(player.getId());

        //uno_id contains id of a player with 1 card left
        var target_player = room.getPlayer(room.getUno());
        room.setUno(null); //Clear uno variable
        var cards = {}

        for (var i = 0; i < config.UNO_CARD_AMOUNT; i++) {
            if (target_player.getCardCount() >= room.getMaxCards()) { break; }
            var card_id: string = wutils.uuidv4(true); //Generate uid
            var card = UnoGame.generateCard(true) //Generate card

            cards[card_id] = card; //This will be sent to player
            room.addCard(target_player.getId(), card_id, card); //Save also on server side
        }

        //Send data to the player
        target_player.emit('take_card', { cards: cards });

        //Update card count for other players
        room.emit('uno_press', { uno_id: target_player.getId(), card_count: target_player.getCardCount() });
        if (room.getTurnDelay()) { wtimer.finish(room.getTurnDelay()); }
    }
}
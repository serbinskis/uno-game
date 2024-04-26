import wutils from 'wobbychip-utils';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';

export class EventStart {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        //Check if operation can be done
        if (room.isStarted() || (room.getOwner() != player.getId()) || (room.getOnline(true) == 0)) { return; }

        //Start game and set random player as first
        var players: UnoPlayer[] = room.getPlayers().filter((e) => e.isOnline(true));
        room.setStarted(true);
        room.setCurrentMove(players[wutils.randomRange(0, players.length-1)].getId()); //Select random player
        room.setCurrentCard(UnoGame.generateCard(false)); //Generate first card

        //Generate cards for players
        for (const player of room.getPlayers()) {
            var cards: any = room.generateCards(player.getId(), true); //Generate starting cards

            //Send info to the player
            player.getSocket().emit('start', { code: 200, cards: cards, current_card: room.getCurrentCard(), current_move: room.getCurrentMove(), player_time: room.getPlayerTime() });
       }

       room.startPlayerTimer();
    }
}
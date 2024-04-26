import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';

export class EventSaveCard {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        if (!data?.card_id) { return; }

        //Get current room
        if (!room.isStarted() || (room.getCurrentMove() != player.getId()) || !room.getChoosingId()) { return; }

        //Check if specific card exists
        if (!room.getPlayerCards(player.getId())[data.card_id]) { return; }

        //Set next player and clear choosing id
        room.setCurrentMove(room.nextPlayer(player.getId(), 1));
        room.setChoosingId(null);

        //Send data and start timer
        io.sockets.to(room.getId()).emit('next_move', { next_move: room.getCurrentMove(), player_time: room.getPlayerTime() });
        room.startPlayerTimer();
    }
}
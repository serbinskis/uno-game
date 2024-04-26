import config from '../config';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';
import { EventDisconnect } from './disconnect';

export class EventKick {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        //Check if data is valid
        if ((typeof data?.player_id !== 'string')) { return; }

        //Player must be owner and can't kick himself
        if ((room.getOwner() != player.getId()) || (room.getOwner() == data.player_id)) { return; }

        //Get player socket from player id and check if player is already left
        var target_player = room.getPlayer(data.player_id);
        if (!target_player || target_player.isLeft()) { return; }

        //Kick player by disconnecting it's socket
        target_player.setLeft(true);

        if (!target_player.isDisconnected()) {
            target_player.emit('kick', { message: config.error_codes[2001] });
            target_player.getSocket().disconnect();
        } else {
            EventDisconnect.execute(io, socket, target_player, room);
        }
    }
}
import { Server, Socket } from 'socket.io';
import { UnoPlayer } from '../player';
import { UnoGame } from '../game';

export class EventDisconnect {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        //Remove player and log that player left
        var new_owner = room.removePlayer(player.getId());
        console.log(`[${socket.handshake.address.split(':').pop()}] ${player.getUsername()}(${player.getId()}) disconnect room: ${room.getId()}`);

        var info = { new_owner: new_owner, player_time: room.getPlayerTime() } //Store info here
        var players_online = room.getOnline(true); //Count online players in room
        if (!room.canRejoin()) { player.setLeft(true); }
        info[player.isLeft() ? 'left_id' : 'disconnected_id'] = player.getId();
        if (!player.isLeft()) { room.startPlayerDisconnect(player.getId()); }

        //If not last player then set new playing, and clear stack
        if ((players_online != 0) && (room.getCurrentMove() == player.getId())) {
            //If player who left was choosing color, select random color
            if (!room.isWinner()) {
                room.startPlayerTimer(); //Trigger game to do auto events for a player
                if (room.canJumpIn()) { room.sendWhoCanJumpIn(); } //Send info who can jump in

                //Delay next move after selecting color
                room.startTurnDelay(player.getId(), 1);
            } else {
                room.setCurrentMove(room.nextPlayer(player.getId(), 1));
                room.startPlayerTimer();
                (info as any).stack = room.setStack(0);
                (info as any).current_move = room.getCurrentMove();
            }
        }

        //If last player left delete room
        if (players_online > 0) {
            if (!room.isWinner()) { room.emit('disconnected', info); }
        } else {
            room.deleteRoom();
        }
    }
}
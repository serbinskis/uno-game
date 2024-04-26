import config from '../config';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';
import { UnoPlayer } from '../player';

export class EventChangeColor {
    static execute(io: Server, socket: Socket, player: UnoPlayer, room: UnoGame, data?: any): any {
        //Check if data is valid
        if (!data?.color || !config.colors.includes(data.color)) { return; }

        //Check if operation can be done
        if (!room.isStarted() || !room.isChoosingColor() || room.getTurnDelay() || (room.getCurrentMove() != player.getId())) { return; }

        //Update card color, this method also checks if color can be changed
        if (!room.changeColor(data.color)) { return; }

        if (room.canJumpIn()) { room.sendWhoCanJumpIn(); } //Send info who can jump in
        room.startTurnDelay(player.getId(), 1); //Set delay for next player
    }
}
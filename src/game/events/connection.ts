import config from '../../config';
import sutils from 'serbinskis-utils';
import { Server, Socket } from 'socket.io';

export class EventConnection {
    static execute(io: Server, socket: Socket, data?: any): any {
        //Generate uid for socket
        (socket as any).player_id = sutils.uuidv4(true);

        //Send settings to user
        socket.emit('settings', { max_players: config.MAX_PLAYERS, max_cards: config.MAX_CARDS, start_cards: config.START_CARDS, player_time: config.PLAYER_TIME });
    }
}
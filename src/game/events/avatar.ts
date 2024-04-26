import config from '../config';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';

export class EventAvatar {
    static async execute(io: Server, socket: Socket, data?: any): Promise<any> {
        //Check if size was sent, if size is number and if it is smaller than allowed
        if (!isNaN(data?.size) && (data.size <= config.MAX_IMAGE_SIZE)) {
            return socket.emit('avatar', { code: 200, accepted: true });
        }

        //Check if we are reciving image buffer
        if (!Buffer.isBuffer(data)) {
            return socket.emit('avatar', { code: 1006, message: config.error_codes[1006] });
        }

        //Create avatar and send back code
        var avatarCode = await UnoGame.createAvatar(data);
        console.log(`Created avatar: ${avatarCode}.png by socket: ${(socket as any).uid}`);

        if (avatarCode != null) {
            socket.emit('avatar', { code: 200, avatarCode: avatarCode });
        } else {
            socket.emit('avatar', { code: 1001, message: config.error_codes[1001] });
        }
    }
}
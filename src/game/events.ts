import { Server, Socket } from 'socket.io';
import { EventConnection } from './events/connection';
import { EventDisconnect } from './events/disconnect';
import { EventJoin } from './events/join';
import { EventStart } from './events/start';
import { EventTakeCard } from './events/take_card';
import { EventPlaceCard } from './events/place_card';
import { EventSaveCard } from './events/save_card';
import { EventChangeColor } from './events/change_color';
import { EventUnoPress } from './events/uno_press';
import { EventKick } from './events/kick';
import { EventAvatar } from './events/avatar';
import { UnoGame } from './game';
import { UnoPlayer } from './player';


export class UnoEvents {
    static execute(io: Server, socket: Socket, event_name: string, ...args: any): void {
        var isPlayer: boolean = UnoPlayer.isPlayer(socket);
        if (isPlayer) { var player: UnoPlayer = UnoPlayer.getPlayer(socket); }
        if (isPlayer) { var room: UnoGame = player.getRoom(); }

        switch (event_name) {
            case 'connection': { EventConnection.execute(io, socket, args[0]); break; }

            case 'disconnect': { if (isPlayer) { EventDisconnect.execute(io, socket, player, room, args[0]); } break; }

            case 'join': { if (!isPlayer) { EventJoin.execute(io, socket, args[0]); } break; }

            case 'start': { if (isPlayer) { EventStart.execute(io, socket, player, room, args[0]); } break; }

            case 'take_card': { if (isPlayer) { EventTakeCard.execute(io, socket, player, room, args[0]); } break; }

            case 'place_card': { if (isPlayer) { EventPlaceCard.execute(io, socket, player, room, args[0]); } break; }

            case 'save_card': { if (isPlayer) { EventSaveCard.execute(io, socket, player, room, args[0]); } break; }

            case 'change_color': { if (isPlayer) { EventChangeColor.execute(io, socket, player, room, args[0]); } break; }

            case 'uno_press': { if (isPlayer) { EventUnoPress.execute(io, socket, player, room, args[0]); } break; }

            case 'kick': { if (isPlayer) { EventKick.execute(io, socket, player, room, args[0]); } break; }

            case 'avatar': { EventAvatar.execute(io, socket, args[0]); break; }
        }
    }
}
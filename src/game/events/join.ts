import fs from 'fs';
import config from '../config';
import { Server, Socket } from 'socket.io';
import { UnoGame } from '../game';

export class EventJoin {
    static execute(io: Server, socket: Socket, data?: any): any {
        //Check if username is string and does match
        if ((typeof data?.username !== 'string') || !data.username.match(/^.{2,24}$/)) {
            return socket.emit('join', { code: 1004, message: config.error_codes[1004] });
        }

        //Check if invite is string and does match
        if ((typeof data?.invite !== 'string') || !data.invite.match(/^.[0-9a-z]{7,7}$/)) {
            return socket.emit('join', { code: 1005, message: config.error_codes[1005] });
        }

        //Check if player_id is string, btw, it can be empty
        if (typeof data?.player_id !== 'string') {
            return socket.emit('join', { code: 400, message: config.error_codes[400] });
        }

        //Make options for room
        var opts = {
            room_id: data.invite,
            owner_id: (socket as any).player_id,
            start_cards: data.start_cards,
            max_players: data.max_players,
            max_cards: data.max_cards,
            player_time: data.player_time,
            draw_to_match: data.draw_to_match,
            can_stack_cards: data.can_stack_cards,
            can_jump_in: data.can_jump_in,
            can_uno: data.can_uno,
            can_rejoin: data.can_rejoin,
        }

        //Get existing or create a new room
        var room = UnoGame.getRoom(data.invite) || new UnoGame(io, opts);

        //Check if player can rejoin the room
        var rplayer = room.getPlayer(data.player_id);
        var isRejoining = (rplayer != null) ? (rplayer.isDisconnected() && !rplayer.isLeft()) : false;
        var card_count = isRejoining ? rplayer.getCardCount() : 0;

        //If game is already started then you can't join
        if (room.isStarted() && !isRejoining) {
            return socket.emit('join', { code: 1002, message: config.error_codes[1002] });
        }

        //Check if max players
        if (room.getOnline(false) >= room.getMaxPlayers()) {
            return socket.emit('join', { code: 1003, message: config.error_codes[1003] });
        }

        //Check if avatar exists
        data.avatar = fs.existsSync(`./website/avatars/${data.avatar}.png`) ? `avatars/${data.avatar}.png` : 'resources/defaultAvatar.png';

        //Add or replace player in the room
        var player_id = isRejoining ? rplayer.getId() : (socket as any).player_id;
        var player_json = { username: data.username, avatar: data.avatar, player_id: player_id, card_count: card_count };
        if (isRejoining) { room.stopPlayerDisconnect(rplayer.getId()); }
        var player = room.setPlayer(socket, player_json);

        //Log who joined
        console.log(`[${socket.handshake.address.split(':').pop()}] ${player.getUsername()}(${player.getId()}) joined room: ${room.getId()}`);

        //Send new player info to already connected players
        room.emit('new_player', player_json);

        //Join player to the same room
        socket.join(room.getId());

        //Send info of room to a new player
        player.emit('join', { code: 200, room_id: room.getId(), players: room.getPlayersJSON(), owner_id: room.getOwner(), player_id: player.getId() });

        if (isRejoining) {
            //btw kick should set player as left not as disconnected
            //send info about the game to the rejoined player
            var cards = room.getPlayerCards(player.getId());
            var player_time = room.getCurrentPlayerDelay();
            player.getSocket().emit('start', { code: 200, cards: cards, current_card: room.getCurrentCard(), current_move: room.getCurrentMove(), player_time: player_time });
        }
    }
}
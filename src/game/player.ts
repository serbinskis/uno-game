import { Socket } from 'socket.io';
import { UnoGame } from './game';

export class UnoPlayer {
    static players: { [player_id: string]: UnoPlayer } = {};
    socket: Socket;
    player_id: string;
    room_id: string;
    avatar: string;
    username: string;
    card_count: number
    left: boolean = false;
    disconnected: boolean = false;
    disconnect_delay: number = null;

    constructor(socket: Socket, opts: any) {
        this.socket = socket;
        this.player_id = opts.player_id;
        this.room_id = opts.room_id;
        this.card_count = opts.card_count;
        this.avatar = opts.avatar;
        this.username = opts.username;

        (socket as any).player_id = this.player_id;
        (socket as any).room_id = this.room_id;
        UnoPlayer.players[this.player_id] = this;
    }

    static isPlayer(socket: Socket): boolean {
        return (socket as any).room_id && (socket as any).player_id && (UnoGame.getRoom((socket as any).room_id) != null);
    }

    static getPlayer(socket: Socket): UnoPlayer {
        return UnoPlayer.players[(socket as any).player_id] ? UnoPlayer.players[(socket as any).player_id] : null;
    }

    removePlayer() {
        delete UnoPlayer.players[this.player_id];
        delete (this.socket as any).room_id;
    }

    disconnectPlayer() {
        this.disconnected = true;
    }

    isLeft(): boolean {
        return this.left;
    }

    setLeft(left: boolean): boolean {
        return (this.left = left);
    }

    isDisconnected(): boolean {
        return this.disconnected;
    }

    getId(): string {
        return this.player_id;
    }

    getUsername(): string {
        return this.username;
    }

    getSocket(): Socket {
        return this.socket;
    }

    emit(event: string, ...args: any[]): boolean {
        return this.socket.emit(event, ...args);
    }

    isOnline(includeDisconnected: boolean): boolean {
        return includeDisconnected ? (!this.left && !this.disconnected) : !this.left;
    }

    getRoom(): UnoGame {
        return UnoGame.getRoom((this.socket as any).room_id);
    }

    getCardCount(): number {
        return this.card_count;
    }

    setCardCount(card_count: number) {
        this.getRoom().getPlayersJSON()[this.player_id].card_count = card_count;
        return (this.card_count = card_count);
    }
}

import { EventEmitter } from './Emitter.js';

export class Activity {
    private name: string;
    private type: number;
    private details?: string;
    private state?: string;
    private largeImage?: string;
    private largeText?: string;
    private smallImage?: string;
    private smallText?: string;
    private start?: number;
    private end?: number;

    constructor(name: string, type: number) {
        this.name = name;
        this.type = type;
    }

    setDetails(details: string): Activity {
        this.details = details;
        return this;
    }

    setState(state: string): Activity {
        this.state = state;
        return this;
    }

    setLargeImage(url: string, text?: string): Activity {
        this.largeImage = url;
        this.largeText = text;
        return this;
    }

    setSmallImage(url: string, text?: string): Activity {
        this.smallImage = url;
        this.smallText = text;
        return this;
    }

    setTimestamps(start: number, end: number): Activity {
        this.start = start;
        this.end = end;
        return this;
    };

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            details: this.details,
            timestamps: {
                start: this.start,
                end: this.end
            },
            state: this.state,
            created_at: Date.now(),
            assets: {
                large_image: this.largeImage,
                large_text: this.largeText,
                small_image: this.smallImage,
                small_text: this.smallText
            }
        } as IActivityTemplate;
    }
}

class WebSocketManager extends EventEmitter {

    protected ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
    }

    protected async connect() {

        this.ws = new WebSocket(`ws://localhost:${1488|35654}`);

        this.ws.onopen = this.onopen.bind(this);

        this.ws.onclose = this.onclose.bind(this);

        this.ws.onerror = this.onerror.bind(this);

        this.ws.onmessage = this.onmessage.bind(this);

    }

    protected onopen() {
        console.log("WebSocket connection opened.");
        this.startHeartbeat();
        console.log("Event 'ready' emitted");
        this.emit('ready');
    }
    
    protected onclose(event: CloseEvent) {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
        this.stopHeartbeat();
    }

    protected onerror(event: Event) {
        console.log("WebSocket error:");
        console.error(event);
        this.emit('error');
        this.ws?.close();
    }

    protected onmessage(event: MessageEvent) {
        console.log("WebSocket message received:", event.data);
        var message = JSON.parse(event.data.toString());
        console.log("Parsed message:", message);
        this.emit('message');
    }

    public send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log("Sending data:", data);
            this.ws.send(JSON.stringify(data));
        } else {
            console.error("WebSocket is not open. Cannot send data.");
        }
    }

    public close() {
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        console.log("Closing WebSocket connection");
        this.ws.close();
    }

    private startHeartbeat() {
        this.stopHeartbeat(); // Ensure no previous heartbeat is running
        this.heartbeatInterval = setInterval(() => {
            this.send('heartbeat');
        }, 30000); // Send heartbeat every 30 seconds
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

}

export class Client extends WebSocketManager {

    private activity: Activity | null = null;


    constructor() {
        super();
        this.connect();
    }

    public async connect() {
        await super.connect();
    }

    public async setActivity(activity: Activity) {
        this.activity = activity;
        super.send({state: true, activity: this.activity?.toJSON()});
    }

    public async clearActivity() {
        this.activity = null;
        super.send({
            state: false
        });
    }

    public async close() {
        super.close();
    }

}
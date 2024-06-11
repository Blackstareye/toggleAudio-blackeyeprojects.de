import Printer from "./util/Printer.js";

export default class CommandQueue {

    _commandQueue = null;

    _consumeService = null;

    timeout = 1000*10; // 10 seconds
    
    static instance = null;



    constructor() {
        this._commandQueue = new Map();
        this.startconsumeQueue();
    }

    static create() {
        // singleton
        if(CommandQueue.instance) {
            console.log(`Instance is already there..`);
            return CommandQueue.instance;
        } else {
            console.log(`Instance is not there creating one`);
            CommandQueue.instance =  new CommandQueue();
            return CommandQueue.instance;
        }
    }

    printQueue() {
        return Printer.printBeautyMap(this._commandQueue);
    }

    consumeQueue() {
        if (this._commandQueue.size != 0) {
            let deleted = [];

            this._commandQueue.forEach(
                (value, key) => {
                    console.log(`Consuming...`);
                    console.log(`The key is ${key} and value is ${value}`);
                    value();
                    deleted.push(key);
                }
            );
            deleted.map(k => this._commandQueue.delete(k));
        }
    }

    addToQueue(command_id, func) {
        this._commandQueue.set(command_id, func);
    }

    startconsumeQueue() {
        console.log(`Queue Object: ${this._commandQueue}`);
        this._consumeService = setInterval(() => this.consumeQueue(), this.timeout);
    }


    destroy() {
        clearInterval(this._consumeService);
        this._consumeService = null;
        CommandQueue.instance = null;
    }
}
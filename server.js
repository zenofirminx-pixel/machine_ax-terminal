const WebSocket = require("ws");
const pty = require("node-pty");

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({
    port: PORT
});

console.log("AX Terminal Engine running on port", PORT);


wss.on("connection", (ws) => {

    console.log("New terminal connected");


    const shell = "/bin/bash";

    const terminal = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME
    });


    terminal.onData((data) => {
        ws.send(JSON.stringify({
            type: "data",
            data: data
        }));
    });


    ws.on("message", (message) => {

        const data = JSON.parse(message);


        if(data.type === "data"){
            terminal.write(data.data);
        }


        if(data.type === "resize"){
            terminal.resize(
                data.cols,
                data.rows
            );
        }

    });


    ws.on("close", () => {
        terminal.kill();
        console.log("Terminal closed");
    });

});

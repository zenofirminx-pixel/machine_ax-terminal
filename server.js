const WebSocket = require("ws");
const pty = require("node-pty");

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({
    port: PORT
});

console.log("AX Terminal Engine running on port", PORT);


wss.on("connection", (ws) => {

    console.log("New terminal connected");


    let currentEngine = "bash";


    const engines = {
        bash: "/bin/bash",
        zsh: "/bin/zsh",
        python: "python3",
        node: "node"
    };


    let terminal = createTerminal(currentEngine);


    function createTerminal(engine){

        const shell = engines[engine] || engines.bash;


        const p = pty.spawn(shell, [], {
            name: "xterm-color",
            cols: 80,
            rows: 24,
            cwd: process.env.HOME
        });


        p.onData((data) => {

            ws.send(JSON.stringify({
                type: "data",
                data: data
            }));

        });


        return p;
    }



    ws.on("message", (message) => {

        const data = JSON.parse(message);


        if(data.type === "data"){

            const input = data.data.trim();


            if(input.startsWith("use ")){

                const choice = input
                    .replace("use ", "")
                    .trim()
                    .toLowerCase();


                if(engines[choice]){


                    terminal.kill();


                    currentEngine = choice;


                    terminal = createTerminal(choice);


                    ws.send(JSON.stringify({
                        type:"data",
                        data:
                        `\r\nSwitched to ${choice}\r\n`
                    }));


                    return;
                }


                ws.send(JSON.stringify({
                    type:"data",
                    data:
                    "\r\nAvailable: bash zsh python node\r\n"
                }));

                return;
            }



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
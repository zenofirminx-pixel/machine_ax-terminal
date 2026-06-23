const WebSocket = require("ws");
const pty = require("node-pty");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

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


    let axMode = false;
    let axSource = [];


    terminal.onData((data) => {
        ws.send(JSON.stringify({
            type: "data",
            data: data
        }));
    });



    ws.on("message", (message) => {

        const data = JSON.parse(message);


        if(data.type === "data"){

            const input = data.data.trim();


            // Début compilation AX
            if(input === "axbuild"){

                axMode = true;
                axSource = [];

                ws.send(JSON.stringify({
                    type:"data",
                    data:"\r\n[AX Compiler]\r\nColle ton code AX3D.\r\nTape END seul pour compiler.\r\n> "
                }));

                return;
            }



            // Réception du code AX
            if(axMode){

                if(input === "END"){

                    axMode = false;


                    const fileName =
                        "temp_" + Date.now() + ".axs";


                    fs.writeFileSync(
                        fileName,
                        axSource.join("\n")
                    );


                    ws.send(JSON.stringify({
                        type:"data",
                        data:"\r\nCompilation...\r\n"
                    }));



                    exec(
                        `python3 ax_compiler.py ${fileName}`,
                        (error, stdout, stderr)=>{


                            let result = stdout || stderr;


                            ws.send(JSON.stringify({
                                type:"data",
                                data: result + "\r\n"
                            }));


                            fs.unlinkSync(fileName);


                        }
                    );


                    return;
                }


                axSource.push(data.data);

                return;
            }



            // Terminal normal
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
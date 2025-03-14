import makeWASocket, { 
  delay, 
  useMultiFileAuthState, 
  DisconnectReason, 
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import readline from "readline";
import PastebinAPI from "pastebin-js";
import fs from "fs";
import { Boom } from "@hapi/boom";


function clearState() {

async function start() {
  try {
    /** Initialize auth state */
    const { state, saveCreds } = await useMultiFileAuthState("./auth_ts");

    /** Create WhatsApp socket */
    let sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"),
    });

    
  conn.ev.process(async (events) => {
    if (events["connection.update"]) {
        const update = events["connection.update"];
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            await delay(10000);
            if (fs.existsSync(v)) {
                const db = fs.readFileSync(v, "utf8");
                let _cxl = await pastebin.createPaste({
                    text: db,
                    title: "session_id",
                    format: null,
                    privacy: 1,  
                    expiration: "N"  
                });

                const get_id = `${get_prefa}${_cxl.trim().replace("https://pastebin.com/", "")}`;
                if (conn.user?.id) {
                    await conn.sendMessage(conn.user.id, {
                        text: `*Note:* Don't share this _id with anyone\n *_Session ID_*: ${get_id}`
                    });
                } else {
                    console.error("_id is undefined_");
                    process.exit(0);
                }
            }
        }

        if (connection === "close") {
            const _why = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const reason = DisconnectReason[_why] || "unknown reason 😂";
            console.log(`Connection closed: ${reason}`);
            if (_why !== DisconnectReason.loggedOut) {
                console.log("Retrying connection...");
                await delay(3000);
                startPair();
            } else {
                Clean();
                process.exit(0);
            }
        }
    }
});

    


/** Start the WhatsApp connection */
start();


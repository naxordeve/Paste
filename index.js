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
import express from "express";
import path from "path";
import { fileURLToPath } from "url";




    
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

conn.ev.on("creds.update", saveCreds);
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.get("/", (req, res) => {                  
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/pair", async (req, res) => { 
    try {
        let phone = req.query.code;
        if (!phone) {
            res.status(418).json({ message: "_Provide your phone number_📱" });
            return;
        }

        await delay(1500);
        phone = phone.replace(/[^0-9]/g, ""); 
        
        if (!conn.authState.creds.registered) {
            const code = await conn.requestPairingCode(phone);
            if (!res.headersSent) {
                res.json({ code: code?.match(/.{1,4}/g)?.join("-") });
                return;
            }
        } else {
            res.status(400).json({ message: "Already registered" });
            return;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error getting pairing code" });
        return;
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));

startPair();
  




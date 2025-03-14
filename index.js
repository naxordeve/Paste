import makeWASocket, { 
  delay, 
  useMultiFileAuthState, 
  DisconnectReason, 
  Browsers
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import { Boom } from "@hapi/boom";
import express from "express";
import path from "path";
import { Pastebin } from "pastedeno";  
import { dev_api_key, authi, get_prefa, username, user_password } from "./vars/config.js";  
const pastebin = new Pastebin({  
  api_dev_key: dev_api_key,  
  api_user_name: username,  
  api_user_password: user_password,  
});  
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function Clean() {
  try {
    const sessionDir = path.join(__dirname, "session");
    if (fs.existsSync(sessionDir)) {
      fs.readdirSync(sessionDir).forEach((file) => {
        const filePath = path.join(sessionDir, file);
        fs.unlinkSync(filePath);
      });
    }
  } catch (error) {
    console.error(error);
  }
}


async function startPair() {
  try {
    const sessionDir = path.join(__dirname, "session");
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    let conn = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "fatal" }),
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

conn.ev.on("creds.update", saveCreds);
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

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

    /** Pairing code request if not already registered */
    if (usePairingCode && !sock.authState.creds.registered) {
      const phoneNumber = await question("Enter your active WhatsApp number: ");
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`Pairing code: ${code}`);
    }

    /** Handle connection events */
    sock.ev.process(async (events) => {
      if (events["connection.update"]) {
        const update = events["connection.update"];
        const { connection, lastDisconnect } = update;

        /** If connection is open, upload session file to Pastebin */
        if (connection === "open") {
          await delay(10000);
          if (fs.existsSync(authFile)) {
            const fileData = fs.readFileSync(authFile, 'utf8');
            let link = await pastebin.createPaste({
              text: fileData,
              title: "session_id",
              format: null,
              privacy: 1,
            });
            console.log(`Session ID link: ${link}`);

            const sessionID = link.replace("https://pastebin.com/", "");
            await sock.sendMessage(sock.user.id, { text: `_session_id:_ ${sessionID}` });
            process.exit(0);
          } else {
            console.error("Auth file not found!");
          }
        }

        /** Handle disconnection cases */
        if (connection === "close") {
          let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
          switch (reason) {
            case DisconnectReason.connectionClosed:
              console.log('[Connection closed, reconnecting....!]');
              start();
              break;
            case DisconnectReason.connectionLost:
              console.log('[Connection lost, reconnecting....!]');
              start();
              break;
            case DisconnectReason.loggedOut:
              console.log('[Logged out, clearing state....]');
              clearState();
              process.exit(0);
              break;
            case DisconnectReason.restartRequired:
              console.log('[Restart required, restarting....]');
              start();
              break;
            case DisconnectReason.timedOut:
              console.log('[Timed out, reconnecting....]');
              start();
              break;
            case DisconnectReason.badSession:
              console.log('[Bad session, clearing state and restarting....]');
              clearState();
              start();
              break;
            case DisconnectReason.connectionReplaced:
              console.log('[Connection replaced, restarting....]');
              start();
              break;
            default:
              console.error('[Unknown disconnect reason, restarting....]');
              start();
              break;
          }
        }
      }
    });

    /** Update credentials when needed */
    sock.ev.on("creds.update", saveCreds);

  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

/** Start the WhatsApp connection */
start();


const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const { exec } = require("child_process");
require("dotenv").config();

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;

        const chatId = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        if (text.startsWith(".music ")) {
            const query = text.replace(".music ", "").trim();
            await sock.sendMessage(chatId, { text: "Downloading music from YouTube, please wait..." });

            const fileName = `music_${Date.now()}.mp3`;
            const cmd = `yt-dlp -x --audio-format mp3 -o "${fileName}" "ytsearch1:${query}"`;

            exec(cmd, async (error) => {
                if (error) {
                    await sock.sendMessage(chatId, { text: "Failed to download music." });
                } else {
                    await sock.sendMessage(chatId, {
                        document: fs.readFileSync(fileName),
                        mimetype: "audio/mpeg",
                        fileName: `${query}.mp3`
                    });
                    fs.unlinkSync(fileName);
                }
            });
        }
    });
}

startBot();
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");


//authentification, On utilise Bailleys une librairie whatsapp qui permet 
//de se connecté à whatsapp 
//authSate qui authentifie l'utilisateur depuis Bailleys et genère un QR code , une fois scanner on sauvegarde les identifiants pour ne plus scanner à chaque demarrage
async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const socket = makeWASocket({ auth: state })
    socket.ev.on('connection.update', (data) => {
        const { qr, connection } = data
        if (qr) {
            qrcode.generate(qr, { small: true })
        }
        console.log(connection)
        if (connection === 'close') {
            console.log(data.lastDisconnect?.error)
            if (data.lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
                startBot()
            }
        }
    })

    socket.ev.on('creds.update', saveCreds)

    socket.ev.on('messages.upsert', (data) => {
        const { messages } = data
        for (const message of messages) {
            if (message.key.fromMe  || message.key.remoteJid === 'status@broadcast') {
                continue
            }
            const texte = message.message.conversation || message.message.extendedTextMessage?.text
            console.log(message.key.remoteJid, texte)
        }
    })

}

startBot()
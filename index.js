const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const groupes = require('./src/handlers/groupes')
const messages= require('./src/handlers/message')





async function startBot() {
    //Authentification *******************
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

    //Gestion des messages ****************************/

    socket.ev.on('messages.upsert', async (data) => {
        await messages.gererMessage(socket, data)
    })

    //Gestion de groupes *****************************/

    socket.ev.on('group-participants.update', async (data) => {
        await groupes.gererMembres(socket, data)
    })
}

startBot()
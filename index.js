const { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require('fs')
const path = require('path')
const commandes = require('./commandes')

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

    socket.ev.on('messages.upsert', async (data) => {
        const { messages, type } = data
        if (type !== 'notify') { return }
        for (const message of messages) {
            const texte = message.message?.conversation || message.message?.extendedTextMessage?.text || message?.message?.imageMessage?.caption
            if (message.key.remoteJid === 'status@broadcast' || message.key.fromMe && !texte?.startsWith('⚡')) {
                continue
            }
            if (texte?.startsWith('⚡')) {
                const texteSanPrefixe = texte.slice(1)
                const [commande, ...arrgs] = texteSanPrefixe.split(' ')
                const commandeNormalisee = commande.toLowerCase()
                console.log(commande, arrgs)

                const cmd = commandes[commandeNormalisee]
                if (cmd) {
                    await cmd.execute(socket, message.key.remoteJid, arrgs, message)
                } else {
                    await socket.sendMessage(message.key.remoteJid, { text: 'Commande inconnue, tape ⚡aide pour voir les commandes disponibles' })
                }
                console.log(message.key.remoteJid, texte)
            }

            const estImage = message.message?.imageMessage
            const estVideo = message.message?.videoMessage
            if (estImage || estVideo) {
                const dossier = path.join('media', message.key.remoteJid)
                const date = new Date().toISOString().replace(/:/g,'-')
                const extension = estImage?'jpg':'mp4'
                const buffer = await downloadMediaMessage(message, 'buffer', {})
                const cheminFichier = path.join(dossier, `${date}.${extension}`)
                
                fs.mkdirSync(dossier, {recursive:true})
                fs.writeFileSync(cheminFichier, buffer)
                console.log('Media sauvegarder :', cheminFichier)
              
            }

            const estVueUnique = message.message?.viewOnceMessageV2 || message.key?.isViewOnce
            if(estVueUnique){
                console.log('Médias vue unique reçu de :', message.key.remoteJid,)
            }
        }
    })

}

startBot()

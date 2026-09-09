const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const commandes = require('../commandes')
const style = require('../style')
const fs = require('fs')
const path = require('path')



const tabEmoji = ['🖤', '⚜️', '👀', '🐳', '😂', '🙄', '✨', '🌚']

async function gererMessage(socket, data) {
    const { messages, type } = data
    if (type !== 'notify') { return }

    for (const message of messages) {
        if (message.key.remoteJid === 'status@broadcast') {

            const reactionAleatoire = tabEmoji[Math.floor(Math.random() * tabEmoji.length)]
            await socket.sendMessage(message.key.participant, {
                react: {
                    text: reactionAleatoire,
                    key: message.key
                }
            }, { statusJidList: [message.key.participant], broadcast: true })
            console.log(reactionAleatoire, message.key.participant)
        }

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
                await style.envoieReponse(socket, message.key.remoteJid, 'Commande inconnue, tape ⚡aide pour voir les commandes disponibles')
            }
            console.log(message.key.remoteJid, texte)
        }




//Sauvegarde automatique des médias reçus
        const estImage = message.message?.imageMessage
        const estVideo = message.message?.videoMessage
        if (estImage || estVideo) {
            const dossier = path.join(__dirname,'..','..','medias', message.key.remoteJid)
            const date = new Date().toISOString().replace(/:/g, '-')
            const extension = estImage ? 'jpg' : 'mp4'
            const buffer = await downloadMediaMessage(message, 'buffer', {})
            const cheminFichier = path.join(dossier, `${date}.${extension}`)

            fs.mkdirSync(dossier, { recursive: true })
            fs.writeFileSync(cheminFichier, buffer)
            console.log('Media sauvegarder :', cheminFichier)

        }

        const estVueUnique = message.message?.viewOnceMessageV2 || message.key?.isViewOnce
        if (estVueUnique) {
            console.log('Médias vue unique reçu de :', message.key.remoteJid,)
        }
    }

}

module.exports = { gererMessage }
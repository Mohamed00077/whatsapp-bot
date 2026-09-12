const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const commandes = require('../commandes')
const moderation = require('../moderation')
const style = require('../style')
const fs = require('fs')
const path = require('path');
const ia = require('../ia')



const tabEmoji = ['🖤', '⚜️', '👀', '🐳', '😂', '🙄', '✨', '🌚']

async function gererMessage(socket, data) {
    const { messages, type } = data
    if (type !== 'notify') { return }

    for (const message of messages) {
        //Reaction aléatoire sur les statuts automaquement mais ça ne fonctionne pas pour l'instant je sais pas pk !
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

        //Condition de déclanchement du bot : le bot ne doit pas répondre à tout les messages 
        //donc ici on met une condition pour qu'il réponde seulement au message commençant par '⚡' qui sert à dinstinguer une commande
        const texte = message.message?.conversation || message.message?.extendedTextMessage?.text || message?.message?.imageMessage?.caption
        if (message.key.remoteJid === 'status@broadcast' || message.key.fromMe && !texte?.startsWith('⚡')) {
            continue
        }

        //Le bot ne répond qu'au commande disponible  
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
        //
        else if (!message.key.remoteJid.endsWith('@g.us') && message.key.remoteJid !== 'status@broadcast') {
            const presence = ia.chargeStatutAbsent()
            if (presence.actif) {
                const nouveauMessage = ia.chargeConversation()
                nouveauMessage[message.key.remoteJid] = nouveauMessage[message.key.remoteJid] || []
                nouveauMessage[message.key.remoteJid].push({ role: 'user', content: texte })
                const reponse = await ia.demanderReponse(nouveauMessage[message.key.remoteJid])
                nouveauMessage[message.key.remoteJid].push({ role: 'assistant', content: reponse })
                ia.sauvegardeConversation(nouveauMessage)
                await style.envoieReponse(socket, message.key.remoteJid, `${reponse}`, { titre: "Réponse automatique IA" })
            }
        }

        //Sauvegarde automatique des médias reçus

        const estImage = message.message?.imageMessage
        const estVideo = message.message?.videoMessage
        if (estImage || estVideo) {
            const dossier = path.join(__dirname, '..', '..', 'medias', message.key.remoteJid)
            const date = new Date().toISOString().replace(/:/g, '-')
            const extension = estImage ? 'jpg' : 'mp4'
            const buffer = await downloadMediaMessage(message, 'buffer', {})
            const cheminFichier = path.join(dossier, `${date}.${extension}`)

            fs.mkdirSync(dossier, { recursive: true })
            fs.writeFileSync(cheminFichier, buffer)
            console.log('Media sauvegarder :', cheminFichier)

        }
        //****** */
        const estVueUnique = message.message?.viewOnceMessageV2 || message.key?.isViewOnce
        if (estVueUnique) {
            console.log('Médias vue unique reçu de :', message.key.remoteJid,)
        }

        //Ici on détecte les liens && les vocaux envoyé dans les groupe pour les supprimer automatiquement
        if (message.key.remoteJid?.endsWith('@g.us')) {
            const infractions = moderation.chargeInfraction()
            const verificationInfraction = infractions[message.key.remoteJid]?.[message.key?.participant]
            if (verificationInfraction?.muteJusqua && verificationInfraction?.muteJusqua > Date.now()) {
                await socket.sendMessage(message.key.remoteJid, { delete: message.key })
                continue
            }
            if (moderation.contientLien(texte) || message.message?.audioMessage?.ptt === true) {
                const user = message.key?.participant
                const numeroAffiche = user?.split('@') || ['quelqu\'un']
                const messageeAvertissement = "Ce genre de contenu est interdit dans ce groupe !!!!"
                await socket.sendMessage(message.key.remoteJid, { delete: message.key })
                const infractions = moderation.chargeInfraction()
                infractions[message.key.remoteJid] = infractions[message.key.remoteJid] || {}
                infractions[message.key.remoteJid][user] = infractions[message.key.remoteJid][user] || { count: 0 }
                infractions[message.key.remoteJid][user].count = infractions[message.key.remoteJid][user].count + 1
                moderation.sauvegardeInfraction(infractions)
                const nombreInfraction = infractions[message.key.remoteJid][user].count
                if (nombreInfraction === 1) {
                    await style.envoieReponse(socket, message.key.remoteJid, `${messageeAvertissement} @${numeroAffiche[0]}`, { titre: 'infraction', avecAvatar: true, mentions: [user] })
                } else if (nombreInfraction === 2) {
                    infractions[message.key.remoteJid][user].muteJusqua = Date.now() + (60 * 60 * 1000)
                    moderation.sauvegardeInfraction(infractions)
                    await style.envoieReponse(socket, message.key.remoteJid, `Utilisateur @${numeroAffiche[0]} mutée pour 1h`)
                } else {
                    await socket.groupParticipantsUpdate(message.key.remoteJid, [user], 'remove')
                    await style.envoieReponse(socket, message.key.remoteJid, `Utilisateur @${numeroAffiche[0]} Bannie !`)
                }


            }
        }

    }

}

module.exports = { gererMessage }
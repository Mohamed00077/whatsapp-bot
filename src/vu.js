// commandes/vu.js
// Usage : répondre (reply/quote) à un média vue unique reçu avec ⚡vu
// pour le télécharger et le renvoyer dans le chat.

const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
    async execute(socket, remoteJid, args, message) {
        const contextInfo = message.message?.extendedTextMessage?.contextInfo

        const quotedMessage = contextInfo?.quotedMessage
        const quotedStanzaId = contextInfo?.stanzaId
        const quotedParticipant = contextInfo?.participant

        if (!quotedMessage || !quotedStanzaId) {
            await socket.sendMessage(remoteJid, { text: 'Réponds directement à un média vue unique avec ⚡vu pour le récupérer.' })
            return
        }

        // Déballage éventuel : WhatsApp peut wrapper le contenu de 3 façons différentes
        const contenuVueUnique =
            quotedMessage.viewOnceMessageV2?.message ||
            quotedMessage.viewOnceMessage?.message ||
            quotedMessage.viewOnceMessageV2Extension?.message

        const contenu = contenuVueUnique || quotedMessage

        const estImage = contenu?.imageMessage
        const estVideo = contenu?.videoMessage
        const estAudio = contenu?.audioMessage

        if (!estImage && !estVideo && !estAudio) {
            await socket.sendMessage(remoteJid, { text: "Le message cité n'est pas un média vue unique reconnu." })
            return
        }

        // Reconstruction d'un objet "message" minimal exploitable par downloadMediaMessage
        const messagePourTelechargement = {
            key: {
                remoteJid,
                id: quotedStanzaId,
                participant: quotedParticipant,
                fromMe: false
            },
            message: contenu
        }

        try {
            const buffer = await downloadMediaMessage(messagePourTelechargement, 'buffer', {})
            const legende = args.join(' ') || undefined

            if (estImage) {
                await socket.sendMessage(remoteJid, { image: buffer, caption: legende })
            } else if (estVideo) {
                await socket.sendMessage(remoteJid, { video: buffer, caption: legende })
            } else if (estAudio) {
                await socket.sendMessage(remoteJid, {
                    audio: buffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: estAudio.ptt || false
                })
            }
        } catch (err) {
            console.error('Échec récupération vue unique :', err?.message || err)
            await socket.sendMessage(remoteJid, { text: "Impossible de récupérer ce média :expiré côté WhatsApp)." })
        }
    }
}
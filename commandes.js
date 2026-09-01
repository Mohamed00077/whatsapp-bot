const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { evaluate } = require('mathjs')
const sharp = require('sharp')
const fs = require('fs')
const NOTES_FICHIER = 'notes.json'

function chargeNote() {
    if (fs.existsSync(NOTES_FICHIER)) {
        const contenu = fs.readFileSync(NOTES_FICHIER, 'utf-8')
        return JSON.parse(contenu)

    } else {
        return {}
    }
}

function sauvegardeNote(note) {
    const saveNote = JSON.stringify(note)
    fs.writeFileSync(NOTES_FICHIER, saveNote)
}
//Tableau de commande dynamique
const commandes = {
    ping: {
        description: 'Vérifie que le bot répond',
        execute: async (socket, remoteJid, args, message) => {
            await socket.sendMessage(remoteJid, { text: 'Pong !' })
        }
    },
    aide: {
        description: "menu de commande disponible",
        execute: async (socket, remoteJid, args, message) => {
            const liste = Object.entries(commandes).map(([nom, details]) => {
                return `⚡${nom} - ${details.description}`
            }).join('\n')
            await socket.sendMessage(remoteJid, { text: liste })
        }
    },
    uptime: {
        description: "Temps écoulé depuis le demarrage du bot",
        execute: async (socket, remoteJid, args, message) => {
            const seconde = process.uptime()
            const heure = Math.floor(seconde / 3600)
            const minuteRestante = Math.floor((seconde % 3600) / 60)
            const secondeRestante = Math.floor(seconde % 60)
            await socket.sendMessage(remoteJid, { text: `Le bot tourne depuis ${heure}h ${minuteRestante}min ${secondeRestante}s` })

        }
    },
    calc: {
        description: "Mini calculatrice pour effectuer rapidement les opérations de base",
        execute: async (socket, remoteJid, args, message) => {
            const entrer = args.join(' ')
            try {
                const resultat = evaluate(entrer)
                await socket.sendMessage(remoteJid, { text: `Résultat: ${resultat}` })
            } catch {
                await socket.sendMessage(remoteJid, { text: "Expression invalide, réessaie." })
            }
        }
    },
    note: {
        description: 'Ajoute une note pour la retrouver plus tard : ⚡note <texte>',
        execute: async (socket, remoteJid, args, message) => {
            const texte = args.join(' ')
            const notes = chargeNote()
            notes[remoteJid] = notes[remoteJid] || []
            notes[remoteJid].push(texte)
            sauvegardeNote(notes)
            await socket.sendMessage(remoteJid, { text: `Note ajoutée : ${texte}` })
        }
    },
    notes: {
        description: 'Voire toutes les notes enregistrer pour cette discution !',
        execute: async (socket, remoteJid, args, message) => {
            const notes = chargeNote()
            const mesNotes = notes[remoteJid]
            if (!mesNotes || mesNotes.length === 0) {
                await socket.sendMessage(remoteJid, { text: "Aucune note enregistrer pour cette discussion" })
                return
            }
            const liste = mesNotes.map((note, index) => {
                return `${index + 1} : ${note}`
            }).join('\n')
            await socket.sendMessage(remoteJid, { text: liste })
        }
    },
    sticker: {
        description: 'convertir les images en sticker',
        execute: async (socket, remoteJid, args, message) => {
            try {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
                let messageAtraiter
                if (quotedMessage?.imageMessage) {
                    messageAtraiter = { key: message.key, message: quotedMessage }
                } else {
                    messageAtraiter = message
                }
                const buffer = await downloadMediaMessage(messageAtraiter, 'buffer', {})
                const stickerBuffer = await sharp(buffer)
                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp()
                    .toBuffer()
                await socket.sendMessage(remoteJid, { sticker: stickerBuffer })
            } catch {
                await socket.sendMessage(remoteJid, { text: "Envoyez une image à convertir" })
            }
        }
    },

    traduire: {
        description: "Traduire du texte EN<==>FR",
        execute: async (socket, remoteJid, args, message) => {
            const [langueSource, langueCible, ...motsTexte] = args

            const objetCite = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
            const quotedMessage = objetCite?.conversation || objetCite?.extendedTextMessage?.text
            let texteFinale = motsTexte.join(' ')
            if (motsTexte.length === 0 && quotedMessage) {
                texteFinale = quotedMessage
            }


            const textATraduire = encodeURIComponent(texteFinale)
            const url = `https://api.mymemory.translated.net/get?q=${textATraduire}&langpair=${langueSource}|${langueCible}`
            try {
                const reponse = await fetch(url)
                const donnes = await reponse.json()
                const traduction = donnes.responseData.translatedText
                await socket.sendMessage(remoteJid, { text: traduction })
            } catch {
                await socket.sendMessage(remoteJid, { text: "Erreur lors de la traduction" })
            }

        }
    }
}

module.exports = commandes
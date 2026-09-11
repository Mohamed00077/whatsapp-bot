const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const { evaluate } = require('mathjs')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const vu = require('./vu')
const musique = require('./musique')
const style = require('./style')
const NOTES_FICHIER = path.join(__dirname, '..', 'data', 'notes.json')




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
            await style.envoieReponse(socket, remoteJid, 'Pong !')
        }
    },
    aide: {
        description: "menu de commande disponible",
        execute: async (socket, remoteJid, args, message) => {
            const liste = Object.entries(commandes).map(([nom, details]) => {
                return style.formateCommande(nom, details.description)
            }).join('\n\n')
            await style.envoieReponse(socket, remoteJid, liste, { titre: 'Menu du bot', avecAvatar: true })
        }
    },
    uptime: {
        description: "Temps écoulé depuis le demarrage du bot",
        execute: async (socket, remoteJid, args, message) => {
            const seconde = process.uptime()
            const heure = Math.floor(seconde / 3600)
            const minuteRestante = Math.floor((seconde % 3600) / 60)
            const secondeRestante = Math.floor(seconde % 60)
            await style.envoieReponse(socket, remoteJid, `Le bot tourne depuis ${heure}h ${minuteRestante}min ${secondeRestante}s`)
        }
    },
    calc: {
        description: "Mini calculatrice pour effectuer rapidement les opérations de base",
        execute: async (socket, remoteJid, args, message) => {
            const entrer = args.join(' ')
            try {
                const resultat = evaluate(entrer)
                await style.envoieReponse(socket, remoteJid, `Résultat: ${resultat}`)
            } catch {
                await style.envoieReponse(socket, remoteJid, "Expression invalide, réessaie.")
            }
        }
    },
    note: {
        description: 'Ajoute une note pour la retrouver plus tard',
        execute: async (socket, remoteJid, args, message) => {
            const texte = args.join(' ')
            const notes = chargeNote()
            notes[remoteJid] = notes[remoteJid] || []
            notes[remoteJid].push(texte)
            sauvegardeNote(notes)
            await style.envoieReponse(socket, remoteJid, `Note ajoutée : ${texte}`)
        }
    },
    notes: {
        description: 'Voire toutes les notes enregistrer pour cette discution !',
        execute: async (socket, remoteJid, args, message) => {
            const notes = chargeNote()
            const mesNotes = notes[remoteJid]
            if (!mesNotes || mesNotes.length === 0) {
                await style.envoieReponse(socket, remoteJid, "Aucune note enregistrer pour cette discussion")
                return
            }
            const liste = mesNotes.map((note, index) => {
                return `${index + 1} : ${note}`
            }).join('\n')
            await style.envoieReponse(socket, remoteJid, liste, { titre: 'Tes notes', avecAvatar: true })
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
                await style.envoieReponse(socket, remoteJid, "Envoyez une image à convertir")
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
                await style.envoieReponse(socket, remoteJid, traduction, { titre: 'Traduction' })
            } catch {
                await style.envoieReponse(socket, remoteJid, "Erreur lors de la traduction")
            }

        }
    },


    statut: {
        description: 'Sauvegarde un statut avec cette commande juste en y répondant',
        execute: async (socket, remoteJid, args, message) => {
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quotedMessage?.imageMessage && !quotedMessage?.videoMessage) {
                await style.envoieReponse(socket, remoteJid, "Erreur")
                return
            }
            const estImage = quotedMessage?.imageMessage
            const estVideo = quotedMessage?.videoMessage
            const statut = { key: message.key, message: quotedMessage }
            const buffer = await downloadMediaMessage(statut, 'buffer', {})
            const date = new Date().toISOString().replace(/:/g, '-')
            const extension = estImage ? 'jpg' : 'mp4'
            const dossier = path.join('statut', message.key.remoteJid)
            const cheminFichier = path.join(dossier, `${date}.${extension}`)
            fs.mkdirSync(dossier, { recursive: true })
            fs.writeFileSync(cheminFichier, buffer)
            console.log('Media sauvegarder :', cheminFichier)
            await style.envoieReponse(socket, remoteJid, "Statut sauvegardé !🤞")
        }
    },
    vu:{
        description: 'Récupère un média vue unique ',
        execute : vu.execute
    },
    play:{
        description :'Recherche et envoie un morceau libre de droit',
        execute: musique.execute
    }

}

module.exports = commandes
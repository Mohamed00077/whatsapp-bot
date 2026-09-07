const fs = require('fs')
const path = require('path')

// ==================== CONFIGURATION ====================
// Modifie ces valeurs pour personnaliser le style de ton bot

const SIGNATURE = '\n\n_🤖 Réponse automatique • Bot WhatsApp_'

// Dépose toutes tes images d'avatar (png/jpg) dans ce dossier.
// Le bot en choisira une au hasard à chaque réponse, envoyée comme image
// avec le texte attaché en légende (un seul message).
const DOSSIER_AVATARS = path.join(__dirname, 'assets', 'avatars')

// =========================================================


// ---- Police unicode "gras" (fausse police, vrais caractères unicode) ----
// Array.from() est utilisé ici (et pas split('')) car ces caractères sont
// codés sur 2 unités en JavaScript : split('') les aurait coupés en deux
// et corrompu le texte affiché.
const ALPHABET_NORMAL = Array.from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
const ALPHABET_GRAS = Array.from('𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵')

function texteStylise(texte) {
    return Array.from(texte)
        .map((caractere) => {
            const index = ALPHABET_NORMAL.indexOf(caractere)
            return index !== -1 ? ALPHABET_GRAS[index] : caractere
        })
        .join('')
}

// ---- Signature ajoutée en bas de chaque réponse du bot ----
function ajouteSignature(texte) {
    return `${texte}${SIGNATURE}`
}

// ---- Mise en forme d'une commande pour le menu ⚡aide ----
// Nom en gras (police unicode), description en italique (formatage natif WhatsApp,
// car les descriptions contiennent des accents/symboles non couverts par la police unicode).
// Le nom et la description sont sur des lignes séparées pour éviter que le retour
// à la ligne automatique ne coupe le texte n'importe où quand la description est longue.
function formateCommande(nom, description) {
    return `⚡ ${texteStylise(nom)}\n\`\`\`${description}\`\`\``
}

// ---- Choix d'une image d'avatar au hasard ----
const EXTENSIONS_ACCEPTEES = ['.png', '.jpg', '.jpeg']

function listeFichiersAvatars() {
    if (!fs.existsSync(DOSSIER_AVATARS)) {
        return []
    }
    return fs.readdirSync(DOSSIER_AVATARS)
        .filter((nomFichier) => EXTENSIONS_ACCEPTEES.includes(path.extname(nomFichier).toLowerCase()))
}

function imageAvatarAleatoire() {
    const fichiers = listeFichiersAvatars()
    if (fichiers.length === 0) {
        return null
    }
    const fichierChoisi = fichiers[Math.floor(Math.random() * fichiers.length)]
    return fs.readFileSync(path.join(DOSSIER_AVATARS, fichierChoisi))
}

/**
 * Fonction centrale à utiliser à la place de socket.sendMessage(...) pour toutes
 * les réponses du bot. Elle ajoute automatiquement la signature, et peut ajouter
 * un titre stylisé. Si avecAvatar est activé, le message est envoyé comme une
 * image (choisie au hasard) avec le texte en légende, en un seul message.
 *
 * @param {object} options
 * @param {string} [options.titre] - Titre affiché en "gras unicode" au-dessus du message
 * @param {boolean} [options.avecAvatar] - Envoie le texte comme légende d'une image avatar
 */
async function envoieReponse(socket, remoteJid, texte, options = {}) {
    const { titre = null, avecAvatar = false, mentions =[] } = options

    let messageFinal = texte
    if (titre) {
        messageFinal = `${texteStylise(titre)}\n\n${texte}`
    }
    messageFinal = ajouteSignature(messageFinal)

    if (avecAvatar) {
        const image = imageAvatarAleatoire()
        if (image) {
            await socket.sendMessage(remoteJid, { image, caption: messageFinal, mentions })
            return
        }
    }

    await socket.sendMessage(remoteJid, { text: messageFinal, mentions })
}

module.exports = { envoieReponse, texteStylise, ajouteSignature, formateCommande }
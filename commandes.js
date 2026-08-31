const {evaluate} = require('mathjs')
const fs = require('fs')
const NOTES_FICHIER = 'notes.json'

function chargeNote(){
    if(fs.existsSync(NOTES_FICHIER)){
      const contenu=  fs.readFileSync(NOTES_FICHIER, 'utf-8')
      return JSON.parse(contenu)

    }else{
        return {}
    }
}

function sauvegardeNote(note){
    const saveNote = JSON.stringify(note)
    fs.writeFileSync(NOTES_FICHIER, saveNote)
}
//Tableau de commande dynamique
const commandes = {
    ping: {
        description: 'Vérifie que le bot répond',
        execute: async (socket, remoteJid, args) => {
            await socket.sendMessage(remoteJid, { text: 'Pong !' })
        }
    },
    aide:{
        description :"menu de commande disponible",
        execute : async(socket, remoteJid, args)=>{
            const liste = Object.entries(commandes).map(([nom,details])=>{
                return `⚡${nom} - ${details.description}`
            }).join('\n')
            await socket.sendMessage(remoteJid, {text: liste})
        }
    },
    uptime:{
        description: "Temps écoulé depuis le demarrage du bot",
        execute: async(socket, remoteJid, args)=>{
            const seconde= process.uptime()
            const heure = Math.floor(seconde/3600)
            const minuteRestante = Math.floor((seconde % 3600)/60)
            const secondeRestante = Math.floor(seconde % 60)
            await socket.sendMessage(remoteJid, {text:`Le bot tourne depuis ${heure}h ${minuteRestante}min ${secondeRestante}s`})

        }
    },
    calc:{
        description: "Mini calculatrice pour effectuer rapidement les opérations de base",
        execute: async(socket, remoteJid, args)=>{
           const entrer = args.join(' ')
           try{
            const resultat =evaluate(entrer)
            await socket.sendMessage(remoteJid, {text: `Résultat: ${resultat}`})
           }catch{
            await socket.sendMessage(remoteJid, {text: "Expression invalide, réessaie."})
           }
        }
    },
    note:{
        description: 'Ajoute une note pour la retrouver plus tard : ⚡note <texte>',
        execute: async (socket, remoteJid, args)=>{
            const texte = args.join(' ')
            const notes = chargeNote()
            notes[remoteJid]= notes[remoteJid]|| []
            notes[remoteJid].push(texte)
            sauvegardeNote(notes)
            await socket.sendMessage(remoteJid, {text: `Note ajoutée : ${texte}`})
        }
    },
    notes :{
        description: 'Voire toutes les notes enregistrer pour cette discution !',
        execute: async(socket, remoteJid,args)=>{
            const notes = chargeNote()
            const mesNotes = notes[remoteJid]
            if(!mesNotes || mesNotes.length ===0){
                await socket.sendMessage(remoteJid, {text: "Aucune note enregistrer pour cette discussion"})
                return
            }
            const liste = mesNotes.map((note, index) =>{
                return `${index +1} : ${note}`
            }).join('\n')
            await socket.sendMessage(remoteJid, {text: liste})
        }
    }

}

module.exports= commandes
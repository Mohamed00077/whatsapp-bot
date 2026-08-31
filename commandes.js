const {evaluate} = require('mathjs')

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
    }

}

module.exports= commandes
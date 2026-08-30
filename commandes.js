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
    }
}

module.exports= commandes
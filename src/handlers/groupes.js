const style =require('../style')


 async function gererMembres (socket, data){
            if(data.action === 'add'){
                for(const participant of data.participants){
                    const numeroTel = participant.phoneNumber?.split('@') || ['quelqu\'un']
                    const textBienvenu = "Bienvenu dans le groupe "
                    await style.envoieReponse(socket, data.id, `${textBienvenu} @${numeroTel[0]}`, {titre: "Test de message", avecAvatar : true, mentions :[participant.id]})
                }
         }
}


module.exports = {gererMembres}
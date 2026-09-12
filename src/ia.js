const fs = require('fs')
const path = require('path');

const CONVERSATION = path.join(__dirname, '..', 'data', 'conversation.json')
const STATUT = path.join(__dirname, '..', 'data', 'statut.json')

function chargeConversation() {
    if (fs.existsSync(CONVERSATION)) {
        const contenu = fs.readFileSync(CONVERSATION, 'utf-8')
        return JSON.parse(contenu)
    } else {
        return {}
    }
}

function sauvegardeConversation(nouvelleConversation) {
    const conversation = JSON.stringify(nouvelleConversation)
    fs.writeFileSync(CONVERSATION, conversation)
}

function chargeStatutAbsent(){
    if(fs.existsSync(STATUT)){
        const contenu = fs.readFileSync(STATUT, 'utf-8')
        return JSON.parse(contenu)
    }else{
        return{}
    }
}

function sauvegardeStatutAbsent(nouveauSatut){
    const statut = JSON.stringify(nouveauSatut)
    fs.writeFileSync(STATUT, statut)
}

async function demanderReponse(historique) {
    const reponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.2',
            messages: historique,
            stream: false
        })
    })
    const donnees = await reponse.json()
    return donnees.message.content
}


module.exports = { chargeConversation, sauvegardeConversation, demanderReponse, chargeStatutAbsent, sauvegardeStatutAbsent }
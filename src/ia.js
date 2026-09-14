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
    const conversation = JSON.stringify(nouvelleConversation, null, 2)
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
    const historiquePropre = historique.filter(msg => msg.content)
    const messagesAvecSysteme = [
    { role: 'system', content: "Tu discutes de façon naturelle, chaleureuse et avec humour, comme le ferait un ami proche. Réponds en 1 à 3 phrases maximum, jamais plus. Tu es le message automatique du propriétaire de ce compte, envoyé pendant son absence. Tu peux discuter normalement, faire des blagues, avoir une vraie conversation. Si on te demande de transmettre un message ou une info au propriétaire, dis simplement que tu vas lui faire remonter dès qu'il sera disponible — ne nie jamais son existence. Pour toute question factuelle précise (dates, chiffres, actualités, faits vérifiables), utilise la recherche web disponible avant de répondre. Ne donne jamais un chiffre ou une date de mémoire sans l'avoir vérifié par une recherche. Si la recherche ne donne rien de fiable, dis clairement que tu n'as pas trouvé l'information plutôt que d'inventer. Au tout premier message de la conversation, précise en une phrase courte que le propriétaire n'est pas disponible actuellement, Que tu es son assistante , puis continue naturellement sans le répéter à chaque fois." },
    ...historiquePropre
]
    const reponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
         },
        body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: messagesAvecSysteme,
            stream: false,
            tools: [{ type: 'browser_search' }]
        })
    })
    const donnees = await reponse.json()
    console.log(JSON.stringify(donnees, null, 2))
    return donnees.choices[0].message.content
}


module.exports = { chargeConversation, sauvegardeConversation, demanderReponse, chargeStatutAbsent, sauvegardeStatutAbsent }
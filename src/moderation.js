const regexLien = /https?:\/\/[^\s]+/i
const fs = require('fs')
const path = require('path')


function contientLien(texte){
        return regexLien.test(texte)
}

const INFRACTION = path.join(__dirname, '..', 'data', 'infraction.json')
const MODERATION_GROUPES = path.join(__dirname, '..', 'data', 'moderation-groupes.json')

function chargeInfraction(){
        if(fs.existsSync(INFRACTION)){
                const contenu = fs.readFileSync(INFRACTION, 'utf-8')
                return JSON.parse(contenu)
        }else{return{}}
}


function sauvegardeInfraction(nouvelleInfraction){
        const infraction = JSON.stringify(nouvelleInfraction, null, 2)
        fs.writeFileSync(INFRACTION, infraction)
}

function chargeModerationGroupes(){
        if(fs.existsSync(MODERATION_GROUPES)){
                const contenu = fs.readFileSync(MODERATION_GROUPES, 'utf-8')
                return JSON.parse(contenu)
        }else{return{}}
}

function sauvegardeModerationGroupes(nouvelleInfraction){
        const infraction = JSON.stringify(nouvelleInfraction, null, 2)
        fs.writeFileSync(MODERATION_GROUPES, infraction)
}

module.exports = {contientLien, chargeInfraction, sauvegardeInfraction, chargeModerationGroupes, sauvegardeModerationGroupes}
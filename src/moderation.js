const regexLien = /https?:\/\/[^\s]+/i
const fs = require('fs')
const path = require('path')


function contientLien(texte){
        return regexLien.test(texte)
}

const INFRACTION = path.join(__dirname, '..', 'data', 'infraction.json')

function chargeInfraction(){
        if(fs.existsSync(INFRACTION)){
                const contenu = fs.readFileSync(INFRACTION, 'utf-8')
                return JSON.parse(contenu)
        }else{return{}}
}


function sauvegardeInfraction(nouvelleInfraction){
        const infraction = JSON.stringify(nouvelleInfraction)
        fs.writeFileSync(INFRACTION, infraction)
}

module.exports = {contientLien, chargeInfraction, sauvegardeInfraction}



const regexLien = /https?:\/\/[^\s]+/i

function contientLien(texte){
        return regexLien.test(texte)
}




module.exports = {contientLien}
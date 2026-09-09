module.exports = {
    async execute(socket, remoteJid, args, message) {
        const requete = args.join(' ')

        if (!requete) {
            await socket.sendMessage(remoteJid, { text: 'Utilisation : ⚡musique <titre ou artiste>' })
            return
        }

        try {
            // 1. Recherche dans la collection Netlabels (musique libre/CC)
            const urlRecherche = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(requete)}+AND+collection:(netlabels)&fl[]=identifier&fl[]=title&fl[]=creator&rows=1&output=json`
            const reponseRecherche = await fetch(urlRecherche)
            const donneesRecherche = await reponseRecherche.json()
            const resultat = donneesRecherche?.response?.docs?.[0]

            if (!resultat) {
                await socket.sendMessage(remoteJid, { text: "Aucun résultat trouvé pour cette recherche." })
                return
            }

            // 2. Récupération de la liste des fichiers de l'item trouvé
            const urlMetadata = `https://archive.org/metadata/${resultat.identifier}`
            const reponseMetadata = await fetch(urlMetadata)
            const donneesMetadata = await reponseMetadata.json()

            const fichierAudio = donneesMetadata?.files?.find(f =>
                f.name?.toLowerCase().endsWith('.mp3') || f.name?.toLowerCase().endsWith('.ogg')
            )

            if (!fichierAudio) {
                await socket.sendMessage(remoteJid, { text: "Item trouvé mais aucun fichier audio exploitable dedans." })
                return
            }

            const urlAudio = `https://archive.org/download/${resultat.identifier}/${encodeURIComponent(fichierAudio.name)}`

            // 3. Téléchargement du fichier puis envoi dans le chat
            const reponseAudio = await fetch(urlAudio)
            const buffer = Buffer.from(await reponseAudio.arrayBuffer())

            const titre = resultat.title || requete
            const artiste = resultat.creator || 'Artiste inconnu'

            await socket.sendMessage(remoteJid, {
                audio: buffer,
                mimetype: fichierAudio.name.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg',
                fileName: `${titre}.${fichierAudio.name.split('.').pop()}`
            })
            await socket.sendMessage(remoteJid, { text: `🎵 ${titre} — ${artiste}\nSource : Internet Archive (licence libre)` })

        } catch (err) {
            console.error('Échec recherche/téléchargement musique :', err?.message || err)
            await socket.sendMessage(remoteJid, { text: "Erreur lors de la récupération du morceau." })
        }
    }
}
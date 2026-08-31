const { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require('fs');
const path = require('path');
const commandes = require('./commandes');

// Authentification avec Baileys
async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const socket = makeWASocket({ auth: state });
    socket.ev.on('connection.update', (data) => {
        const { qr, connection } = data;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        console.log(connection);
        if (connection === 'close') {
            console.log(data.lastDisconnect?.error);
            if (data.lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            }
        }
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (data) => {
        const { messages, type } = data;
        if (type !== 'notify') { return; }
        for (const message of messages) {
            if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                continue;
            }
            const texte = message.message?.conversation || message.message?.extendedTextMessage?.text;
            if (texte?.startsWith('⚡')) {
                const texteSanPrefixe = texte.slice(1);
                const [commande, ...arrgs] = texteSanPrefixe.split(' ');
                const commandeNormalisee = commande.toLowerCase();
                console.log(commande, arrgs);

                const cmd = commandes[commandeNormalisee];
                if (cmd) {
                    await cmd.execute(socket, message.key.remoteJid, arrgs);
                } else {
                    await socket.sendMessage(message.key.remoteJid, { text: 'Commande inconnue, tape ⚡aide pour voir les commandes disponibles' });
                }
                console.log(message.key.remoteJid, texte);
            }

            // GESTION ET DESENCAPSULATION DU VIEW ONCE
            let msgContenu = message.message;
            let estVueUnique = false;

            if (msgContenu?.viewOnceMessage?.message) {
                msgContenu = msgContenu.viewOnceMessage.message;
                estVueUnique = true;
            } else if (msgContenu?.viewOnceMessageV2?.message) {
                msgContenu = msgContenu.viewOnceMessageV2.message;
                estVueUnique = true;
            }

            const estImage = msgContenu?.imageMessage;
            const estVideo = msgContenu?.videoMessage;

            if (estImage || estVideo) {
                try {
                    const dossier = path.join('media', message.key.remoteJid);
                    const date = new Date().toISOString().replace(/:/g, '-');
                    const extension = estImage ? 'jpg' : 'mp4';
                    
                    const prefixe = estVueUnique ? 'vue_unique_' : '';
                    const cheminFichier = path.join(dossier, `${prefixe}${date}.${extension}`);
                    
                    // CORRECTION ICI : On reconstruit un faux message propre contenant uniquement le média extrait.
                    // Cela évite le bug de téléchargement de Baileys et casse définitivement le flag "viewOnce".
                    const messageNettoye = {
                        message: msgContenu
                    };

                    const buffer = await downloadMediaMessage(messageNettoye, 'buffer', {});
                    
                    fs.mkdirSync(dossier, { recursive: true });
                    fs.writeFileSync(cheminFichier, buffer);
                    
                    console.log(`Media sauvegardé (${estVueUnique ? 'Vue Unique' : 'Normal'}) :`, cheminFichier);

                    // ENVOI AUX ADMINISTRATEURS
                    if (estVueUnique) {
                        const jidProvenance = message.key.remoteJid;
                        const expediteur = message.key.participant || message.key.remoteJid;
                        
                        const legende = msgContenu.imageMessage?.caption || msgContenu.videoMessage?.caption || "";
                        let texteRenvoi = `🔓 *Média Vue Unique intercepté*\n\n`;
                        texteRenvoi += `👤 *De :* @${expediteur.split('@')[0]}\n`;
                        
                        if (jidProvenance.endsWith('@g.us')) {
                            texteRenvoi += `👥 *Groupe :* Provenance d'un groupe\n`;
                            if (legende) texteRenvoi += `📝 *Légende :* ${legende}\n`;

                            try {
                                const metadata = await socket.groupMetadata(jidProvenance);
                                const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

                                for (const admin of admins) {
                                    // Utilisation du buffer nettoyé qui ne contient plus l'historique du ViewOnce
                                    if (estImage) {
                                        await socket.sendMessage(admin.id, { 
                                            image: buffer, 
                                            caption: texteRenvoi,
                                            mentions: [expediteur]
                                        });
                                    } else if (estVideo) {
                                        await socket.sendMessage(admin.id, { 
                                            video: buffer, 
                                            caption: texteRenvoi,
                                            mentions: [expediteur]
                                        });
                                    }
                                }
                                console.log(`Média envoyé aux admins.`);
                            } catch (errMeta) {
                                console.error("Impossible de récupérer les admins du groupe :", errMeta);
                            }
                        }
                    }

                } catch (erreur) {
                    console.error("Erreur technique lors du traitement :", erreur);
                }
            }
        }
    });

}

startBot();



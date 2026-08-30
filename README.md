# WhatsApp Bot

Bot WhatsApp personnel construit avec [Baileys](https://github.com/WhiskeySockets/Baileys), une librairie Node.js qui se connecte directement au protocole WhatsApp Web (sans navigateur).

## Fonctionnalités prévues

- [x] Connexion via QR code avec sauvegarde de session
- [x] Reconnexion automatique après déconnexion
- [x] Écoute des messages entrants (privés et groupes)
- [ ] Réponses automatiques en cas d'absence
- [ ] Gestion de groupes (kick, mute, message de bienvenue)
- [ ] Téléchargement de médias (musique, etc.)

## Prérequis

- Node.js (v18 ou plus récent recommandé)
- Un compte WhatsApp actif

## Installation

```bash
git clone <url-du-repo>
cd whatsapp-bot
npm install
```

## Lancement

```bash
node index.js
```

Au premier lancement, un QR code s'affiche dans le terminal. Scanne-le depuis WhatsApp sur ton téléphone :
**Paramètres → Appareils connectés → Connecter un appareil**

Une fois connecté, les identifiants de session sont sauvegardés dans le dossier `auth_info/` pour éviter de rescanner à chaque redémarrage.

## ⚠️ Sécurité — important

Le dossier `auth_info/` contient les clés de session qui donnent un accès direct à ton compte WhatsApp connecté. Il est exclu du dépôt via `.gitignore` et **ne doit jamais être partagé, commité ou publié**. Si ces fichiers fuitent, déconnecte immédiatement l'appareil concerné depuis WhatsApp (Paramètres → Appareils connectés).

## Avertissement

Ce bot utilise une librairie non officielle pour automatiser un compte WhatsApp personnel, ce qui va à l'encontre des conditions d'utilisation de WhatsApp. Un usage intensif peut entraîner une suspension du compte. À utiliser en connaissance de cause.

## Stack technique

- **Runtime** : Node.js
- **Connexion WhatsApp** : [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **QR code terminal** : qrcode-terminal
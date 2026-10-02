# NDM Teams Manager — Gestion Automatique des Équipes Microsoft Teams

**Établissement :** Ensemble Scolaire Notre-Dame des Missions  
**Périmètre :** Collège (24 classes) & Lycée (13 classes) — Total : 37 classes  
**Source Utilisateurs :** Microsoft 365 / Microsoft Entra ID (via Microsoft Graph)  
**Plateforme Cible :** Microsoft Teams (modèle Équipe de classe / Class)  
**Gestionnaire :** Service Informatique (`serviceinformatique-droid`)  

---

## 📌 1. Répertoire de dépôt FileZilla

Lorsque vous vous connectez avec **FileZilla** (protocole SFTP, port 22, utilisateur `root`) sur votre conteneur **LXC Proxmox Debian 12** :

* **Répertoire distant dans lequel déposer les fichiers :**  
  ```text
  /opt/ndm-teams-manager/
  ```

* **Procédure FileZilla :**
  1. Créez le dossier `/opt/ndm-teams-manager` si nécessaire.
  2. Glissez-déposez **l'ensemble des fichiers du projet** dans ce dossier :
     - `server.ts`
     - `package.json`
     - `tsconfig.json`
     - `vite.config.ts`
     - `index.html`
     - dossiers `src/`, `scripts/`, `data/`
     - `Dockerfile`, `docker-compose.yml`

---

## 🚀 2. Scripts d'Exécution sur le Conteneur LXC Proxmox

Une fois les fichiers déposés avec FileZilla, ouvrez la console Shell du conteneur Proxmox LXC (ou connectez-vous en SSH) et exécutez les commandes suivantes :

### Option A : Déploiement Natif Debian 12 (Node.js & Systemd)

```bash
cd /opt/ndm-teams-manager
chmod +x scripts/install-all-in-one.sh
./scripts/install-all-in-one.sh
```

Le script installe automatiquement Node.js 22 LTS, npm, compile l'application, configure le service `ndm-teams.service` sous systemd et démarre l'application.

* **Vérification du service :**
  ```bash
  systemctl status ndm-teams
  ```
* **Affichage des logs en temps réel :**
  ```bash
  journalctl -u ndm-teams -f
  ```

---

### Option B : Déploiement avec Docker & Docker Compose

Si vous préférez exécuter l'application sous Docker dans votre LXC :

```bash
cd /opt/ndm-teams-manager
docker compose up -d --build
```

---

## 📦 3. Script Tout-en-un via Commande `cat` (Copier-Coller Direct)

Si vous souhaitez créer directement le script d'installation sur votre machine sans passer par FileZilla :

```bash
mkdir -p /opt/ndm-teams-manager/scripts
cat << 'EOF' > /opt/ndm-teams-manager/scripts/install-all-in-one.sh
#!/usr/bin/env bash
set -e
echo "=== Installation NDM Teams Manager sur Debian 12 LXC ==="
apt-get update && apt-get install -y curl wget git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
cd /opt/ndm-teams-manager
npm install
npm run build
cat << 'SERVICE' > /etc/systemd/system/ndm-teams.service
[Unit]
Description=NDM Teams Manager
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ndm-teams-manager
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=TENANT_ID=55b01275-e53b-4146-94a3-cb58e71ec7bf
Environment=CLIENT_ID=1b4e3135-d949-4e36-9d17-d15d3ab49743
Environment=CLIENT_SECRET=32d738c4-8b87-4936-b0a5-68bf349773df

[Install]
WantedBy=multi-user.target
SERVICE
systemctl daemon-reload
systemctl enable --now ndm-teams
echo "NDM Teams Manager opérationnel sur le port 3000 !"
EOF
chmod +x /opt/ndm-teams-manager/scripts/install-all-in-one.sh
/opt/ndm-teams-manager/scripts/install-all-in-one.sh
```

---

## 🐙 4. Script pour Pusher sur GitHub (`serviceinformatique-droid`)

Pour sauvegarder et synchroniser votre code sur GitHub :

```bash
cd /opt/ndm-teams-manager
chmod +x scripts/push-github.sh
./scripts/push-github.sh
```

Ou en une seule ligne avec vos identifiants :

```bash
git add .
git commit -m "update: Mise à jour NDM Teams Manager"
git push origin main
```

---

## ⚙️ 5. Caractéristiques Techniques & Conformité Cahier des Charges

* **100% Fonctionnel Serveur :** Aucune mise en cache côté navigateur (`Cache-Control: no-store, no-cache, must-revalidate`), toutes les actions sont instantanément synchronisées avec le backend et la base locale `/opt/ndm-teams-manager/data/db.json`.
* **Compatibilité iFrame & Mobile :** Conçu avec Tailwind CSS réactif (ordinateur, tablette, smartphone) et headers de sécurité adaptés (`X-Frame-Options: ALLOWALL`).
* **37 Classes Gérées :**
  - Collège (24 classes) : 601 à 606, 501 à 506, 401 à 406, 301 à 306.
  - Lycée (13 classes) : 201 à 205 (2nde), 101 à 104 (1ère), T01 à T04 (Terminale).
* **Gestion des Spécialités Lycée :** Un élève de Première ou Terminale n'est ajouté **qu'aux spécialités qu'il a choisies** (ex: HGGSP, NSI, Maths, Physique-Chimie, SES).
* **Mode Simulation & Différentiel :** Analyse comparative complète avant toute modification (équipes à créer, membres à ajouter, membres à retirer), sans jamais supprimer ou recréer inutilement les membres existants.
* **Protection des Équipes Manuelles :** Préservation stricte des équipes créées manuellement (champ `Gestion automatique: NON`).
* **Diagnostic Microsoft Graph en 7 Étapes :** Validation instantanée de la connectivité et des permissions requises (`User.Read.All`, `Group.Read.All`, `Team.Create`, etc.).

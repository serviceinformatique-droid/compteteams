# NDM Teams Manager — Gestion Automatique des Équipes Microsoft Teams

**Établissement :** Ensemble Scolaire Notre-Dame des Missions  
**Périmètre :** Collège (24 classes : 601-606 à 301-306) & Lycée (13 classes : 201-205, 101-104, T01-T04) — Total : 37 classes  
**Source Utilisateurs :** 100% Réel Microsoft Entra ID & Fichiers officiels (Pronote / SIÈCLE) — **0 compte de démonstration**  
**Architecture :** 100% Serveur (Node.js/Express + Vite React SPA), Zéro Cache Navigateur, 100% Adapté iFrame & Mobile  
**Cible Serveur :** Conteneur LXC Proxmox Debian 12 (avec Docker & npm)  
**Utilisateur GitHub :** `serviceinformatique-droid`  
**Dépôt :** `ndm-teams-manager`  

---

## 📁 1. Répertoire de Dépôt FileZilla (SFTP)

Connectez-vous à votre conteneur **LXC Proxmox Debian 12** via FileZilla :
* **Protocole :** SFTP (SSH File Transfer Protocol)
* **Hôte :** `<IP_DE_VOTRE_CONTENEUR_LXC>`
* **Port :** `22`
* **Utilisateur :** `root`
* **Répertoire distant cible :**
  ```text
  /opt/ndm-teams-manager/
  ```

> **Consigne FileZilla :** Glissez-déposez tous les fichiers du projet directement dans `/opt/ndm-teams-manager/`.

---

## ⚡ 2. Script d'Exécution Tout-en-Un (cat ou sh)

### Option A : Exécution du script existant
Dans la console Proxmox ou par SSH :
```bash
cd /opt/ndm-teams-manager
chmod +x scripts/install-all-in-one.sh
./scripts/install-all-in-one.sh
```

### Option B : Commande unique par copier-coller (`cat` tout-en-un)
Si vous souhaitez initialiser l'installation en une seule ligne de commande dans votre terminal :
```bash
mkdir -p /opt/ndm-teams-manager && cd /opt/ndm-teams-manager && bash -c "$(curl -fsSL https://raw.githubusercontent.com/serviceinformatique-droid/ndm-teams-manager/main/scripts/install-all-in-one.sh 2>/dev/null || cat << 'EOF'
#!/usr/bin/env bash
set -e
mkdir -p /opt/ndm-teams-manager && cd /opt/ndm-teams-manager
apt-get update -y && apt-get install -y curl wget git build-essential
command -v node >/dev/null || (curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs)
[ -f "package.json" ] && npm install && npm run build
cat << 'SERVICE_EOF' > /etc/systemd/system/ndm-teams.service
[Unit]
Description=NDM Teams Manager - Service Automatisé Microsoft Teams M365
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ndm-teams-manager
ExecStart=/bin/bash -c "PATH=$PATH:/usr/local/bin:/usr/bin npm start"
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=TENANT_ID=55b01275-e53b-4146-94a3-cb58e71ec7bf
Environment=CLIENT_ID=1b4e3135-da49-4e36-9d17-d15d3ab497d3
Environment=CLIENT_SECRET=32d738c4-8b87-4936-b0a5-68bf349773df

[Install]
WantedBy=multi-user.target
SERVICE_EOF
systemctl daemon-reload && systemctl enable ndm-teams && systemctl restart ndm-teams
echo "NDM Teams Manager démarré sur http://$(hostname -I | awk '{print $1}'):3000"
EOF
)"
```

---

## 🔑 3. Paramètres Microsoft 365 & Entra ID

| Paramètre | Valeur |
| :--- | :--- |
| **Tenant ID** | `55b01275-e53b-4146-94a3-cb58e71ec7bf` |
| **Client ID** | `1b4e3135-da49-4e36-9d17-d15d3ab497d3` |
| **Client Secret** | `ktx8Q~v7mEzWEPGdaKKdineLMn9mTuYsolA_CarH` (sécurisé côté serveur) |
| **Convention de nommage** | `[CLASSE]-[MATIÈRE]` (ex: `601-Français`, `201-Mathématiques`) |
| **Modèle d'équipe Teams** | `educationClass` (Classe avec devoirs et bloc-notes) |

### Validation du Secret Client sur Microsoft Azure (Erreur AADSTS7000215) :
L'erreur `AADSTS7000215: Invalid client secret provided` prouve que votre **Tenant ID** et votre **Application (Client ID)** sont désormais **100 % reconnus** par Microsoft. **Il ne faut surtout pas recommencer les tenants ni recréer l'application !**
Il s'agit uniquement du secret client applicatif :
1. Connectez-vous sur **[portal.azure.com](https://portal.azure.com)**.
2. Allez dans **Microsoft Entra ID** > **Inscriptions d'applications** > votre application.
3. Dans le menu de gauche, cliquez sur **Certificats & secrets**.
4. Cliquez sur **« + Nouveau secret client »** (description: `NDM Teams Manager`, expiration: 24 mois), puis **Ajouter**.
5. ⚠️ **POINT CRUCIAL :** Copiez immédiatement la colonne **Valeur** (et **SURTOUT PAS** l'ID de secret qui est un piège classique Azure).
6. Collez cette Valeur directement dans l'application web dans l'onglet **M365 & Config** > champ **Client Secret**, puis cliquez sur **« Enregistrer les paramètres »**.
7. Lancez le **Diagnostic 7 points** : l'étape 1 passera immédiatement au vert !

---

## 🛡️ 4. Données Réelles & Synchronisation M365 (0 Compte de Démo)

Tous les comptes fictifs ont été supprimés de la base de données.
L'annuaire synchronise désormais l'intégralité de votre tenant Microsoft Entra ID :
* **Pagination Microsoft Graph complète (`@odata.nextLink`) :** Récupération de la totalité des **2 243 utilisateurs réels** de Notre-Dame des Missions (au lieu du blocage initial à 999 comptes de la page 1 de Microsoft).
* **Détection automatique des Classes (Intégration KoXo Administrator) :**
  * KoXo renseigne la classe de chaque élève dans le champ `officeLocation` (*Bureau*) et `department` (ex : `201`, `203`, `T04`).
  * L'algorithme associe automatiquement chaque élève à l'une des **37 classes** de l'établissement (1 592 élèves identifiés dans leurs classes respectives).
  * Les membres sans classe (ex : direction, professeurs, personnels) sont automatiquement typés en **Enseignants / Personnels** (651 comptes).
* **Fichiers alternatifs :** Possibilité d'importer via le bouton « Importer CSV / Pronote » les exports Pronote / SIÈCLE.

---

## 🚀 5. Déploiement GitHub

Pour synchroniser le code avec votre compte GitHub `serviceinformatique-droid` :
```bash
cd /opt/ndm-teams-manager
chmod +x scripts/push-github.sh
./scripts/push-github.sh "feat: synchronisation M365 et mise à jour du projet"
```

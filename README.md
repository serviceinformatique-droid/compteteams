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
Environment=CLIENT_SECRET=ktx8Q~v7mEzWEPGdaKKdineLMn9mTuYsolA_CarH

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

## 🛡️ 4. Données Réelles & Effectifs Exacts (Filtre KoXo 2026-2027)

Tous les comptes fictifs ont été supprimés de la base de données.
L'annuaire synchronise l'intégralité de votre tenant Microsoft Entra ID avec un filtrage rigoureux basé sur les règles **KoXo Administrator** pour l'année scolaire active 2026-2027 :
* **Effectifs Réels des Élèves Actifs :** Exactement **1 174 élèves actifs** répartis dans les **37 classes** :
  * **Collège (601 à 306) :** 28 à 33 élèves par classe (ex: 601: 33, 602: 31, 604: 30, 501: 33, 401: 30, 301: 30...).
  * **Lycée 2nde (201 à 205) :** 29 à 34 élèves par classe (ex: 201: 30, 204: 34, 205: 29...).
  * **Lycée 1ère (101 à 104) :** 34 à 35 élèves par classe (ex: 101: 35, 102: 35, 103: 35, 104: 34).
  * **Lycée Terminale (T01 à T04) :** 36 à 38 élèves par classe (ex: T01: 38, T02: 36, T03: 37, T04: 37).
* **Pourquoi les effectifs étaient erronés auparavant ?**
  Dans Entra ID, d'anciens comptes d'élèves ayant obtenu leur baccalauréat en 2024 ou 2025 conservaient l'historique « T01 » dans leur département, et des comptes de salles/visio (comme `201-2@`) contenaient des numéros de classe.
  Le serveur filtre désormais strictement par le champ officiel KoXo `officeLocation` de la rentrée 2026-2027. Les 393 anciens comptes sont automatiquement classés en **Anciens élèves / Archivés** et n'alourdissent plus les effectifs réels des classes.
* **Corps professoral réel :** **117 professeurs réels** identifiés et reliés aux équipes pédagogiques.

---

## 👥 5. Création Réelle sur Teams & Grille Officielle des Professeurs

### Pourquoi les équipes n'étaient pas encore créées en direct sur Teams ?
C'est une **sécurité essentielle** : l'application ne crée pas aveuglément 260 équipes vides sur votre tenant Microsoft 365 tant que vous n'avez pas validé le plan prévisionnel et les professeurs référents.

### Intégration du Document Officiel UnDeuxTEMPS / Axess (30/09/2026) :
* **565 équipes officielles** ont été automatiquement générées et affectées pour l'intégralité des **37 classes** (601 à 606, 501 à 506, 401 à 406, 301 à 306, 201 à 205, 101 à 104, T01 à T04).
* Chaque professeur (ex: *Mme LESTANG Marie* en Français, *M. GUEDJ GUILLAUME* en Maths, *Mme LACOSTE AUDE-MARIE* en Histoire-Géo, *M. BACQUET GILLES* en Techno, etc.) est associé avec son compte réel Microsoft Entra ID comme **Propriétaire (Owner)** de l'équipe de sa matière.
* Le **Professeur Principal** de chaque classe (`mainTeacher`) est automatiquement renseigné à partir de la matière *Vie de classe*.

### Multi-Propriétaires & Co-Propriété des Administrateurs Office :
* **Multi-Propriétaires par équipe :** Chaque équipe supporte plusieurs propriétaires (Owners). Vous pouvez assigner conjointement le professeur titulaire, un co-enseignant ou suppléant, et les comptes administrateurs Office.
* **Comptes Administrateurs Office associés :**
  * `mjoubin@notredamedesmissions.com` (Mikael JOUBIN, Responsable Informatique)
  * `admin@notredamedesmissions.com` (Service Informatique NDM)
  * `admin@notredamedesmissions.onmicrosoft.com` (Admin Global Microsoft 365)
* **Bouton Global « 🛡️ Co-propriété Admins Office » :**
  Dans l'onglet **Équipes Teams**, ce bouton orange permet d'injecter en 1 clic les comptes administrateurs Office en co-propriétaires sur l'ensemble des 565 équipes Teams sans écraser les professeurs de chaque matière.
* **Création Réelle sur Microsoft Graph :**
  Lors de la création de l'équipe sur Teams, tous les propriétaires assignés sont passés directement dans `owners@odata.bind` (ou ajoutés via l'API Graph).

### Comment créer les équipes et assigner les professeurs :
1. **Création en Masse Automatisée (Recommandé) :**
   * **Vous n'avez pas besoin de créer les équipes une par une !** Cliquez simplement sur le bouton **« 🚀 Tout créer sur Teams (En masse) »** dans l'onglet *Équipes Teams*.
   * Choisissez le périmètre : **Classe sélectionnée** (ex: les 15 équipes de la classe 101 en 1 clic) ou **Toutes les équipes en attente** (les 565 équipes).
   * L'outil crée les groupes, active Teams (`PUT /groups/{id}/team`), injecte les restrictions membres, associe tous les élèves et propriétaires avec temporisation anti-blocage Microsoft.
2. **Assignation Multi-Propriétaires :**
   Sur chaque carte d'équipe, cliquez sur **« Gérer »** ou **« + Assigner »** : une fenêtre interactive s'ouvre pour cocher autant d'enseignants et d'admins que nécessaire.
3. **Co-propriété Massive des Administrateurs :**
   Cliquez sur **« 🛡️ Co-propriété Admins Office »** pour associer `mjoubin@notredamedesmissions.com` et les admins à toutes les équipes.
4. **Application des Restrictions Membres Strictes :**
   Le bouton **« 🛡️ Restrictions membres »** permet de ré-appliquer à tout moment le profil de sécurité sur toutes les équipes Teams actives.
5. **Création Unitaire Ponctuelle :**
   Le bouton vert **« Créer sur Teams »** reste disponible sur chaque équipe individuelle si vous souhaitez tester ou créer une équipe spécifique isolément.

---

## 🔒 7. Restrictions Strictes des Membres (Profil Pédagogique Conforme)

Toutes les équipes créées respectent à 100% le paramétrage de sécurité requis :

| Paramètre Teams (Graph API) | Valeur Appliquée | Contexte Pédagogique |
|---|---|---|
| `allowCreateUpdateChannels` | **Désactivé (`false`)** | Les élèves ne peuvent ni créer ni renommer de canaux |
| `allowCreatePrivateChannels` | **Désactivé (`false`)** | Interdiction formelle de canaux privés entre élèves |
| `allowDeleteChannels` | **Désactivé (`false`)** | Les élèves ne peuvent pas supprimer de canaux |
| `allowAddRemoveApps` | **Désactivé (`false`)** | Interdiction d'ajouter des applications ou bots externes |
| `allowCreateUpdateRemoveTabs` | **Désactivé (`false`)** | Interdiction de modifier les onglets de cours |
| `allowCreateUpdateRemoveConnectors`| **Désactivé (`false`)** | Interdiction d'ajouter des connecteurs |
| `allowOwnerDeleteMessages` | **Activé (`true`)** | **Les professeurs et admins peuvent modérer et supprimer tous les messages** |
| `allowUserDeleteMessages` | **Activé (`true`)** | Les élèves peuvent supprimer leurs propres erreurs |
| `allowUserEditMessages` | **Activé (`true`)** | Les élèves peuvent corriger leurs propres messages |
| `allowGiphy` / Memes | **Désactivé (`false`)** | Environnement d'apprentissage sérieux et sécurisé |

---

## 🚀 8. Déploiement GitHub

Pour synchroniser le code avec votre compte GitHub `serviceinformatique-droid` :
```bash
cd /opt/ndm-teams-manager
chmod +x scripts/push-github.sh
./scripts/push-github.sh "feat: creation en masse teams et restrictions membres pedagogiques strictes"
```

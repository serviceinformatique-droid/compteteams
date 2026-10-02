#!/usr/bin/env bash
# ==============================================================================
# SCRIPT TOUT-EN-UN D'INSTALLATION - NDM TEAMS MANAGER
# Établissement : Ensemble Scolaire Notre-Dame des Missions
# Environnement cible : LXC Proxmox Debian 12 (avec Docker & Node.js/npm)
# Répertoire d'installation recommandé : /opt/ndm-teams-manager
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}   NDM TEAMS MANAGER - INSTALLATION TOUT-EN-UN POUR PROXMOX LXC DEBIAN 12   ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Vérifier si l'utilisateur est root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERREUR] Veuillez exécuter ce script en tant que root (sudo su)${NC}"
  exit 1
fi

APP_DIR="/opt/ndm-teams-manager"
echo -e "${YELLOW}>> Répertoire de travail : ${APP_DIR}${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo -e "\n${BLUE}[1/5] Mise à jour des paquets Debian 12...${NC}"
apt-get update -y
apt-get install -y curl wget git rsync ca-certificates gnupg lsb-release build-essential

echo -e "\n${BLUE}[2/5] Vérification et installation de Node.js 22 LTS & npm...${NC}"
if ! command -v node &> /dev/null; then
  echo "Installation de Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  echo "Node.js est déjà installé : $(node -v)"
fi
echo "NPM Version : $(npm -v)"

echo -e "\n${BLUE}[3/5] Vérification et installation de Docker & Compose (pour Proxmox LXC)...${NC}"
if ! command -v docker &> /dev/null; then
  echo "Installation de Docker CE..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker est déjà installé : $(docker -v)"
fi

echo -e "\n${BLUE}[4/5] Installation des dépendances du projet et compilation...${NC}"
if [ -f "package.json" ]; then
  npm install
  npm run build
else
  echo -e "${YELLOW}[ATTENTION] Le fichier package.json n'est pas encore présent dans ${APP_DIR}.${NC}"
  echo -e "${YELLOW}Déposez les fichiers de l'application via FileZilla dans ${APP_DIR} puis relancez ce script.${NC}"
fi

echo -e "\n${BLUE}[5/5] Création et activation du service Systemd 'ndm-teams.service'...${NC}"
cat << 'EOF' > /etc/systemd/system/ndm-teams.service
[Unit]
Description=NDM Teams Manager - Service Automatisé Microsoft Teams M365
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ndm-teams-manager
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=TENANT_ID=55b01275-e53b-4146-94a3-cb58e71ec7bf
Environment=CLIENT_ID=1b4e3135-d949-4e36-9d17-d15d3ab49743
Environment=CLIENT_SECRET=32d738c4-8b87-4936-b0a5-68bf349773df

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ndm-teams.service
if [ -f "package.json" ]; then
  systemctl restart ndm-teams.service
fi

IP_ADDR=$(hostname -I | awk '{print $1}')

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN} INSTALLATION TERMINÉE AVEC SUCCÈS SUR VOTRE CONTENEUR LXC DEBIAN 12 ! ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "Accès Web (100% sans cache navigateur, adapté iFrame & mobile) :"
echo -e "${YELLOW}http://${IP_ADDR}:3000${NC}"
echo -e "\nCommandes utiles :"
echo -e "- Statut du service : ${BLUE}systemctl status ndm-teams${NC}"
echo -e "- Logs en direct    : ${BLUE}journalctl -u ndm-teams -f${NC}"
echo -e "- Redémarrage       : ${BLUE}systemctl restart ndm-teams${NC}"

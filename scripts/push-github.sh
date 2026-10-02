#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT GITHUB - SERVICE INFORMATIQUE NDM
# Utilisateur cible : serviceinformatique-droid
# Dépôt : ndm-teams-manager
# ==============================================================================

set -euo pipefail

GITHUB_USER="serviceinformatique-droid"
REPO_NAME="ndm-teams-manager"

echo "=== Préparation du dépôt Git local ==="

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

git config user.name "serviceinformatique-droid"
git config user.email "service.informatique@ndmissions.fr"

echo "=== Indexation de tous les fichiers du projet ==="
git add .

COMMIT_MSG="feat: Application NDM Teams Manager - Synchronisation M365 Teams complète (37 classes, Lycée et Collège)"
if [ "$#" -gt 0 ]; then
  COMMIT_MSG="$*"
fi

git commit -m "$COMMIT_MSG" || echo "Aucune modification à commiter"

echo "=== Configuration de l'URL distante GitHub ==="
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "=== Envoi vers GitHub (branche main) ==="
echo "Exécution de : git push -u origin main"
git push -u origin main || {
  echo ""
  echo "Si vous utilisez un Personal Access Token (PAT) GitHub :"
  echo "git push https://${GITHUB_USER}:<VOTRE_TOKEN>@github.com/${GITHUB_USER}/${REPO_NAME}.git main"
}

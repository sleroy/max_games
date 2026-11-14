#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 🎣 L'étang du Bois Neuf — lancement facile du jeu en local
#
# Comment jouer :
#   1. double-clique sur ce fichier, ou tape ./launch.sh dans un terminal ;
#   2. un petit serveur démarre et le navigateur s'ouvre tout seul ;
#   3. pour arrêter : appuie sur Ctrl+C (ou ferme la fenêtre).
#
# Astuce : ce script marche même si on le lance depuis un autre dossier.
# ---------------------------------------------------------------------------

# --- On se place dans le dossier du jeu (celui du script), où qu'on soit.
cd "$(dirname "$0")" || exit 1

NOM="🎣 L'étang du Bois Neuf"
PORT=8000

# --- 1) Python 3 est-il installé ? (c'est lui qui fournit le petit serveur)
if ! command -v python3 >/dev/null 2>&1; then
    echo "😕 Oups, Python 3 n'est pas installé sur cet ordinateur."
    echo "   Installe-le ici : https://www.python.org/downloads/"
    echo "   puis relance ce fichier."
    read -r -p "Appuie sur Entrée pour fermer…"
    exit 1
fi

# --- 2) On cherche un port libre (8000, sinon 8001, 8002…).
#     Python essaie simplement d'écouter sur le port : s'il y arrive, il est libre.
port_libre() {
    python3 -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    s.bind(('127.0.0.1', int(sys.argv[1])))
except OSError:
    sys.exit(1)
finally:
    s.close()
" "$1"
}

while ! port_libre "$PORT"; do
    PORT=$((PORT + 1))
done

URL="http://127.0.0.1:${PORT}/index.html"

# --- 3) On ouvre le navigateur juste après le démarrage du serveur.
(
    sleep 1
    case "$(uname -s)" in
        Darwin)                open "$URL" ;;
        Linux)                 xdg-open "$URL" >/dev/null 2>&1 ;;
        MINGW*|MSYS*|CYGWIN*)  cmd.exe /c start "" "$URL" ;;
    esac
) &

# --- 4) Un message tout simple, en français, pour l'enfant.
echo
echo "  $NOM est prêt !  🐟"
echo
echo "  Adresse du jeu :  $URL"
echo
echo "  Le navigateur s'ouvre tout seul. Sinon, copie l'adresse ci-dessus."
echo "  Pour ARRÊTER le jeu : appuie sur Ctrl+C."
echo

# --- 5) On démarre le serveur (uniquement accessible depuis cet ordinateur).
python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVEUR=$!

# --- Arrêt propre : on coupe le serveur et on dit au revoir.
arrete() {
    kill "$SERVEUR" 2>/dev/null
    wait "$SERVEUR" 2>/dev/null
    echo
    echo "  Serveur arrêté. Bonne pêche et à bientôt !  🎣"
    exit 0
}
trap arrete INT TERM

wait "$SERVEUR"
arrete


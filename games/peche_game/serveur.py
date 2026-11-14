#!/usr/bin/env python3
"""Petit serveur local SANS cache pour « L'étang du Bois Neuf ».

Pourquoi ce fichier ?
---------------------
Le navigateur adore garder en mémoire les anciens fichiers (index.html,
script.js, sound.js…). Résultat : après une mise à jour du jeu, c'est
l'ancien code qui continue de tourner, et des erreurs bizarres apparaissent
(par exemple « sound.setRain is not a function »).

Ce serveur ajoute l'en-tête « Cache-Control: no-store » : le navigateur
redemande toujours la dernière version des fichiers. Idéal pendant qu'on
bricole le jeu !

Usage (depuis le dossier du jeu) :
    python3 serveur.py 8000
puis ouvrir http://127.0.0.1:8000/
"""
import functools
import http.server
import os
import socketserver
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    """Sert les fichiers du dossier du jeu, sans jamais les mettre en cache."""

    def end_headers(self):
        # « no-store » : interdit au navigateur de garder une copie.
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    dossier = os.path.dirname(os.path.abspath(__file__))
    fabrique = functools.partial(Handler, directory=dossier)
    socketserver.TCPServer.allow_reuse_address = True
    # Accessible uniquement depuis cet ordinateur (127.0.0.1), comme
    # « python3 -m http.server --bind 127.0.0.1 ».
    with socketserver.TCPServer(('127.0.0.1', port), fabrique) as httpd:
        httpd.serve_forever()


if __name__ == '__main__':
    main()

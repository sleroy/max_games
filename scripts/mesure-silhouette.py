#!/usr/bin/env python3
# Mesure de la silhouette d'un poisson sur une photo de référence (PIL + numpy).
#   python3 scripts/mesure-silhouette.py <espece> '{"museau":[x,y],"pedoncule":[x,y]}' ['{"zone":[x0,y0,x1,y1]}']
# (seuils propres à chaque photo dans masque() ; masque écrit dans $MESURES, défaut /tmp/mesures-poissons)
# Segmente le poisson (croissance de région depuis un germe), redresse son axe
# (museau -> pédoncule), puis imprime la demi-hauteur et le décalage du squelette
# tous les 5 % de la longueur, normalisés par la longueur standard (museau -> base de la queue).
import sys
import json
import numpy as np
from PIL import Image, ImageFilter

import os
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'games', 'peche_game', 'assets', 'references') + os.sep
OUT = os.environ.get('MESURES', '/tmp/mesures-poissons') + os.sep
os.makedirs(OUT, exist_ok=True)


def croissance(mask, germe):
    """Composante connexe de `mask` contenant `germe` (dilatations successives)."""
    reg = np.zeros_like(mask)
    reg[germe[1], germe[0]] = True
    while True:
        d = reg.copy()
        d[1:, :] |= reg[:-1, :]
        d[:-1, :] |= reg[1:, :]
        d[:, 1:] |= reg[:, :-1]
        d[:, :-1] |= reg[:, 1:]
        d &= mask
        if (d == reg).all():
            return reg
        reg = d


def lisse(m, k=7):
    return np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MedianFilter(k))) > 127


def masque(espece):
    im = Image.open(REF + espece + '.jpg').convert('RGB')
    a = np.asarray(im).astype(float)
    lum = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    if espece == 'breme':
        # Fond : béton gris neutre (saturation ~2, luminance 108-165).
        m = (sat > 9) | (lum < 85)
        germe = (450, 350)
    elif espece == 'brochet':
        # Poisson beige pâle uniforme sur gravier bariolé : distance à la couleur du flanc.
        # Le gravier est très texturé, le corps est lisse : écart-type local faible.
        img = Image.fromarray(lum.astype('uint8'))
        moy = np.asarray(img.filter(ImageFilter.BoxBlur(6))).astype(float)
        moy2 = np.asarray(Image.fromarray(np.clip(lum ** 2 / 255, 0, 255).astype('uint8'))
                          .filter(ImageFilter.BoxBlur(6))).astype(float) * 255
        ecart = np.sqrt(np.maximum(0, moy2 - moy ** 2))
        m = (ecart < 15) & (lum > 95) & (lum < 215)
        m[:250, :] &= False
        germe = (450, 420)
    elif espece == 'silure':
        # Poisson gris éclairé sur eau sombre.
        m = lum > 48
        m[:60, :] = False   # surface de l'eau (claire) en haut de l'image
        germe = (400, 230)
    elif espece == 'gardon':
        # Poisson argenté sur fond blanc-gris uniforme (≈ 236,236,238) : écart au fond. Les nageoires
        # orange (R - B > 38) du corps sont retranchées pour ne garder que le contour du corps ;
        # la caudale (x > 690) est conservée (elle sert à mesurer sa taille).
        ecart = np.abs(a - np.array([236, 236, 238])).max(axis=2)
        m = ecart > 30
        orange = (a[:, :, 0] - a[:, :, 2]) > 38
        orange[:, :150] = False
        orange[:, 690:] = False
        m &= ~orange
        germe = (400, 290)
    elif espece == 'tanche':
        # Poisson olive sur fond blanc pur ; nageoires grises (saturation faible). Le flanc a des
        # reflets argentés désaturés et le dos un liseré presque noir : ni la saturation seule ni
        # l'écart au fond ne suffisent. On combine : haut = écart au fond (liseré sombre compris)
        # moins la dorsale (coupée sous la droite de sa base, repérée à la main : (400,76) →
        # (507,107) → (575,125)) ; bas = dernier pixel saturé de la colonne (écarte pelviennes,
        # pectorale, anale). La caudale (x > 735) est ignorée.
        full = np.abs(a - 255).max(axis=2) > 30
        sat_m = (sat > 28) & full
        img = Image.fromarray((sat_m * 255).astype('uint8'))
        sat_m = np.asarray(img.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MinFilter(15))) > 127
        hh, ww = full.shape
        m = np.zeros_like(full)
        for x in range(0, 736):
            col = full[:, x].copy()
            if 400 <= x <= 575:
                yb = np.interp(x, [400, 507, 575], [76, 107, 125])
                col[:int(yb)] = False
            ys = np.where(col)[0]
            yb_sat = np.where(sat_m[:, x])[0]
            if len(ys) and len(yb_sat):
                m[ys[0]:yb_sat[-1] + 1, x] = True
        germe = (350, 250)
    elif espece == 'black-bass':
        # Poisson clair sur fond blanc pur : écart au blanc. Les nageoires (dorsales, anale,
        # pelviennes) sont retranchées par des droites repérées à la main sur la photo ; la
        # caudale (x > 735) est ignorée.
        full = np.abs(a - 255).max(axis=2) > 28
        full = np.asarray(Image.fromarray((full * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))) > 127
        m = np.zeros_like(full)
        # base des dorsales : (330,78) -> (470,75) -> (560,95)[encoche] -> (640,120) -> (730,140)
        haut = lambda x: np.interp(x, [150, 250, 330, 470, 560, 640, 730], [135, 95, 80, 76, 92, 118, 140])
        bas = lambda x: np.interp(x, [40, 100, 180, 300, 420, 520, 640, 735], [250, 300, 330, 340, 335, 335, 270, 215])
        for x in range(0, 736):
            col = full[:, x].copy()
            col[:int(haut(x)) - 3] = False
            col[int(bas(x)) + 3:] = False
            m[:, x] = col
        germe = (400, 220)
    m = lisse(m, 9)
    reg = croissance(m, germe)
    reg = lisse(reg, 11)
    Image.fromarray((reg * 255).astype('uint8')).save(OUT + espece + '-mask.png')
    return a, reg


def redresse(reg, museau, pedoncule, pas=0.05, queue=1.25):
    """Profil le long de l'axe museau -> pédoncule (coordonnées image [x, y])."""
    m = np.array(museau, float)
    p = np.array(pedoncule, float)
    L = np.linalg.norm(p - m)
    ax = (p - m) / L
    nrm = np.array([ax[1], -ax[0]])        # normale « vers le dos » si le poisson regarde à gauche
    if nrm[1] > 0:
        nrm = -nrm                          # le dos est vers le haut de l'image
    h, w = reg.shape
    lignes = []
    t = 0.0
    while t <= queue + 1e-9:
        c = m + ax * t * L
        haut = bas = None
        for s in np.arange(-0.6 * L, 0.6 * L, 0.5):
            q = c + nrm * s
            x, y = int(round(q[0])), int(round(q[1]))
            if 0 <= x < w and 0 <= y < h and reg[y, x]:
                if bas is None:
                    bas = s
                haut = s
        if haut is None:
            lignes.append({'t': round(t, 2), 'h': 0, 'y': 0})
        else:
            lignes.append({'t': round(t, 2), 'h': round((haut - bas) / 2 / L, 4),
                           'y': round((haut + bas) / 2 / L, 4),
                           'dos': round(haut / L, 4), 'ventre': round(bas / L, 4)})
        t += pas
    return L, lignes


def couleur(a, boites):
    res = {}
    for nom, (x0, y0, x1, y1) in boites.items():
        c = np.median(a[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        res[nom] = '#%02x%02x%02x' % tuple(int(v) for v in c)
    return res


if __name__ == '__main__':
    espece = sys.argv[1]
    a, reg = masque(espece)
    ys, xs = np.where(reg)
    print('boîte', xs.min(), xs.max(), ys.min(), ys.max())
    pts = json.loads(sys.argv[2])
    L, lignes = redresse(reg, pts['museau'], pts['pedoncule'])
    print('longueur standard (px)', round(L, 1))
    for l in lignes:
        print(l)
    if len(sys.argv) > 3:
        print(json.dumps(couleur(a, json.loads(sys.argv[3])), indent=1))

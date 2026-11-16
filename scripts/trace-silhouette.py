#!/usr/bin/env python3
#   python3 scripts/trace-silhouette.py <espece>   (superposition écrite dans $MESURES)
# Contour relevé à la main (points lus sur la photo quadrillée), vérifié par
# superposition PIL, puis converti en profil normalisé (t, h, y) le long de l'axe.
import json
import sys
import numpy as np
from PIL import Image, ImageDraw

import os
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'games', 'peche_game', 'assets', 'references') + os.sep
OUT = os.environ.get('MESURES', '/tmp/mesures-poissons') + os.sep
os.makedirs(OUT, exist_ok=True)

TRACES = {
    # Perche : perche.jpg (900 x 600), poisson tourné à gauche, incliné (queue en haut) ;
    # LS = 561 px (museau 158,452 -> base de la caudale 705,328). Points lus sur la photo
    # quadrillée (grille 50 px) ; dos = ligne du corps sous les dorsales.
    'perche': {
        'museau': (158, 452), 'pedoncule': (705, 328),
        'dos': [(159, 449), (175, 427), (200, 407), (230, 385), (255, 360), (285, 332), (295, 325),
                (340, 312), (390, 302), (440, 297), (490, 292), (520, 292), (565, 297), (615, 305),
                (665, 311), (695, 305), (705, 303)],
        'ventre': [(160, 460), (180, 477), (215, 487), (265, 492), (315, 490), (350, 485), (380, 472),
                   (440, 450), (500, 435), (565, 417), (615, 397), (655, 377), (680, 362), (700, 352)],
        'oeil': (217, 436, 15),
        'points': {'opercule': (322, 440), 'bouche': (222, 474), 'pectorale_base': (332, 435),
                   'pectorale_bout': (440, 442), 'pelvienne_base': (375, 483), 'pelvienne_bout': (485, 495),
                   'dorsale_av': (300, 322), 'dorsale_ar': (505, 287), 'dorsale_pointe': (347, 222),
                   'dorsale2_av': (515, 292), 'dorsale2_ar': (650, 310), 'dorsale2_pointe': (580, 222),
                   'anale_av': (565, 418), 'anale_ar': (640, 383), 'anale_bout': (645, 445),
                   'queue_haut': (827, 230), 'queue_bas': (815, 382), 'queue_creux': (807, 332)}
    },
    # Sandre : sandre.jpg (900 x 387), poisson tourné à gauche, posé sur du gravier (fond trop
    # texturé pour un masque) ; LS = 692 px (museau 57,203 -> base de la caudale 748,232).
    # Contour relevé sur la photo quadrillée (grille 10 px) ; nageoires dorsales couchées :
    # le dos suit la ligne du corps (la 2e dorsale, dressée, est mesurée à part).
    'sandre': {
        'museau': (57, 203), 'pedoncule': (748, 232),
        'dos': [(57, 201), (70, 196), (100, 187), (140, 174), (180, 160), (220, 148), (260, 138),
                (300, 132), (340, 130), (400, 134), (440, 145), (480, 149), (500, 152), (520, 156),
                (540, 165), (560, 172), (600, 185), (640, 195), (680, 201), (720, 205), (748, 208)],
        'ventre': [(57, 208), (62, 216), (80, 232), (100, 243), (120, 250), (160, 258), (200, 264),
                   (240, 269), (280, 272), (340, 273), (400, 273), (460, 273), (520, 272), (560, 269),
                   (600, 264), (640, 259), (680, 255), (748, 255)],
        'oeil': (121, 203, 15),
        'points': {'opercule': (268, 200), 'bouche': (130, 240), 'pectorale_base': (277, 225),
                   'pectorale_bout': (352, 265), 'pelvienne_base': (300, 272), 'pelvienne_bout': (372, 318),
                   'dorsale_av': (300, 131), 'dorsale_ar': (490, 148), 'dorsale2_av': (520, 155),
                   'dorsale2_ar': (695, 200), 'dorsale2_pointe': (595, 138), 'anale_av': (560, 270),
                   'anale_ar': (650, 260), 'anale_bout': (640, 281), 'queue_haut': (857, 188),
                   'queue_bas': (850, 262), 'queue_creux': (848, 225), 'queue_bout': (858, 225)}
    },
    'brochet': {
        'museau': (885, 512), 'pedoncule': (100, 375),
        'dos': [(885, 505), (870, 490), (840, 474), (800, 457), (750, 440), (700, 420), (650, 405),
                (600, 393), (500, 370), (400, 356), (300, 348), (250, 346), (200, 346), (150, 349), (100, 356)],
        'ventre': [(885, 516), (850, 528), (800, 531), (700, 531), (600, 525), (500, 511), (400, 496),
                   (330, 484), (300, 472), (250, 452), (200, 428), (150, 407), (100, 395)],
        'oeil': (745, 478, 12),
        'points': {'opercule': (606, 470), 'bouche': (775, 512), 'pectorale': (612, 522),
                   'pelvienne': (392, 496), 'dorsale_av': (250, 346), 'dorsale_ar': (150, 349),
                   'anale_av': (250, 452), 'anale_ar': (165, 412), 'queue_haut': (18, 312),
                   'queue_bas': (35, 425), 'queue_bout': (12, 370)}
    }
}


def interp(poly, x):
    pts = sorted(poly)          # np.interp veut des abscisses croissantes (poisson tourné à gauche ou à droite)
    return float(np.interp(x, [p[0] for p in pts], [p[1] for p in pts]))


def main(espece):
    tr = TRACES[espece]
    m = np.array(tr['museau'], float)
    p = np.array(tr['pedoncule'], float)
    L = np.linalg.norm(p - m)
    ax = (p - m) / L
    nrm = np.array([ax[1], -ax[0]])
    if nrm[1] > 0:
        nrm = -nrm
    im = Image.open(REF + espece + '.jpg').convert('RGB')
    d = ImageDraw.Draw(im)
    d.line(tr['dos'], fill=(255, 0, 0), width=2)
    d.line(tr['ventre'], fill=(0, 120, 255), width=2)
    d.line([tuple(m), tuple(p)], fill=(255, 255, 0), width=1)
    ex, ey, er = tr['oeil']
    d.ellipse([ex - er, ey - er, ex + er, ey + er], outline=(0, 255, 0), width=2)
    for nom, (x, y) in tr['points'].items():
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 0, 255))
    im.save(OUT + espece + '-trace.png')

    def axe(pt):
        v = np.array(pt, float) - m
        return round(float(v @ ax) / L, 3), round(float(v @ nrm) / L, 3)

    print('L (px)', round(L, 1))
    profil = []
    for t in np.arange(0, 1.0001, 0.05):
        c = m + ax * t * L
        # intersection de la normale avec chaque ligne (recherche par pas)
        def bord(poly):
            best = None
            for s in np.arange(-0.4 * L, 0.4 * L, 0.5):
                q = c + nrm * s
                yl = interp(poly, q[0])
                if best is None or abs(q[1] - yl) < best[0]:
                    best = (abs(q[1] - yl), s)
            return best[1] / L
        dos = bord(tr['dos'])
        ven = bord(tr['ventre'])
        profil.append({'t': round(float(t), 2), 'h': round((dos - ven) / 2, 4),
                       'y': round((dos + ven) / 2, 4)})
    for l in profil:
        print(l)
    print('oeil', axe((ex, ey)), 'rayon', round(er / L, 4))
    for nom, pt in tr['points'].items():
        print(nom, axe(pt))


if __name__ == '__main__':
    main(sys.argv[1])

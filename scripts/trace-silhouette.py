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
    xs = [p[0] for p in poly][::-1]
    ys = [p[1] for p in poly][::-1]
    return float(np.interp(x, xs, ys))


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

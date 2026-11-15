// ---------------------------------------------------------------------------
// Scénario : le sonar pinge et émet des ondes jaunes quand il repère un poisson.
//
// Un « ping » de sous-marin (son) + une onde jaune qui s'étend à la surface
// partent de la bouée quand un poisson entre dans le rayon de 12 m — mais
// pas plus d'un ping toutes les 1,8 s. Ranger le sonar efface les ondes.
// ---------------------------------------------------------------------------
import {
    group, check, checkEqual,
    G, fire, stepFor,
    resetToIdle, clearLilyPads, castTo
} from './harness.mjs';

export function run() {
    group('71) Sonar : ping de sous-marin et ondes jaunes à la surface');

    // Les scénarios antérieurs peuvent avoir ACHETÉ et POSÉ le sonar : on
    // repart d'un carnet neuf pour que l'achat de ce scénario soit réel.
    if (G().reinitialiserSonar) { G().reinitialiserSonar(); }
    resetToIdle();
    clearLilyPads();
    G().setExperience(300);
    fire('boutique', 'click', { target: { dataset: { action: 'acheter', id: 'sonar' } } });
    checkEqual('le sonar est acheté', G().getExperience(), 150);

    // Un poisson NETTOYÉ de tout historique de ping : on repart de zéro.
    castTo(0, -25);
    const floatPosition = G().floatGroup.position;
    const oldPositions = G().fishes.map(fish => fish.position.clone());

    // 1) Poisson DANS le rayon : le premier balayage doit pinger.
    G().fishes.forEach((fish, index) => {
        fish.position.set(floatPosition.x + (index === 0 ? 5 : 200), -2, floatPosition.z);
    });
    fire('sonarButton', 'click');
    checkEqual('poser le sonar avec un poisson à portée pinge tout de suite',
        G().getSonarPings(), 1);
    checkEqual('une onde jaune part de la bouée', G().getOndesSonar().length, 1);
    const onde = G().getOndesSonar()[0];
    check('l’onde est jaune et transparente',
        onde.material.color.getHex() === 0xffc454 && onde.material.transparent, true);
    check('l’onde est posée à plat sur l’eau',
        Math.abs(onde.rotation.x + Math.PI / 2) < 1e-6, onde.rotation.x.toFixed(3));
    check('l’onde est centrée sur la bouée',
        onde.position.x === G().sonarBuoy.position.x
            && onde.position.z === G().sonarBuoy.position.z,
        onde.position.x + ',' + onde.position.z);

    // 2) Le ping ne se répète pas à chaque balayage (toutes les 0,2 s) :
    //    en 1 s, toujours un seul ping, et l'onde grandit sans avoir disparu.
    stepFor(1);
    checkEqual('un seul ping pendant la première seconde', G().getSonarPings(), 1);
    const ondeVivante = G().getOndesSonar()[0];
    check('l’onde grandit avec le temps', ondeVivante
        && ondeVivante.scale.x > 1 && ondeVivante.material.opacity < 0.85,
        ondeVivante ? 'échelle ' + ondeVivante.scale.x.toFixed(2) : 'absente');
    stepFor(0.5);
    check('l’onde disparaît après sa durée de vie (1,4 s)',
        G().getOndesSonar().length === 0, String(G().getOndesSonar().length));

    // 3) Poisson toujours à portée : un deuxième ping arrive après le délai.
    stepFor(1);
    check('un deuxième ping après le délai de tempo', G().getSonarPings() === 2,
        String(G().getSonarPings()));

    // 4) Plus de poisson à portée : plus aucun ping.
    G().fishes.forEach(fish => fish.position.set(200, -2, 200));
    stepFor(3);
    checkEqual('poisson parti : pas de nouveau ping', G().getSonarPings(), 2);
    checkEqual('poisson parti : plus d’onde', G().getOndesSonar().length, 0);

    // 5) Ranger le sonar efface les ondes immédiatement.
    // Deux poissons dans le rayon : si le premier est retenu (ferré ou en
    // main à la suite d'un scénario antérieur, donc ignoré par le radar),
    // le suivant reste détectable. Un seul ping quand même (délai de tempo).
    G().fishes.forEach((fish, index) => fish.position.set(
        floatPosition.x + (index <= 1 ? 5 : 200), -2, floatPosition.z));
    stepFor(2); // laisse un ping (et son onde) repartir
    check('le poisson revenu déclenche un nouveau ping', G().getSonarPings() >= 3,
        String(G().getSonarPings()));
    fire('sonarButton', 'click'); // ranger
    checkEqual('ranger le sonar efface les ondes', G().getOndesSonar().length, 0);
    const apresRangement = G().getSonarPings();
    stepFor(3);
    checkEqual('sonar rangé : plus aucun ping', G().getSonarPings(), apresRangement);

    G().fishes.forEach((fish, index) => fish.position.copy(oldPositions[index]));
}

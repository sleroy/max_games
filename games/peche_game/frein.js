// ---------------------------------------------------------------------------
// frein.js — FREIN DU MOULINET : on lâche du fil quand le poisson charge. Extrait de script.js (v154).
//
// L'état partagé passe par etat.js ; le reste est injecté par `deps`.
// Seules les fonctions sont exportées.
// ---------------------------------------------------------------------------
import { etat } from './etat.js?v=145';

export function creerFrein(deps) {
    const {
        dragButton, strugglePanel, ensureSound, sound, tutorialText, tutorialHand,
        tutorialStepDisplay, tutorialNext, tutorial, accueil, demarrerJeu, tutorialClose,
        tutorialOpen, hideJournal, journalButton, journalPanel, showJournal, journalClose,
        difficultySelect, setDifficulty, scionSelect, setScion, renderBoutique, floatSelect,
        setFloatType, effectsToggle, post, reflectionsToggle, reflections, waterReflectionTarget,
        setReflections, bigTextToggle, calmToggle, loadJournal, journal,
        appliquerTechniqueVisuelle, renderJournal
    } = deps;

    // ---------------------------------------------------------------------------
    // Frein du moulinet : on lâche du fil quand le poisson charge (la ligne ne
    // casse pas, mais le poisson reprend de la distance).
    // ---------------------------------------------------------------------------

    function setDragLoosened(value) {
        etat.dragLoosened = !!value;
        dragButton.classList.toggle('active', etat.dragLoosened);
        strugglePanel.classList.toggle('slipping', etat.dragLoosened);
    }

    dragButton.addEventListener('pointerdown', event => {
        ensureSound();
        if (dragButton.setPointerCapture && event && event.pointerId !== undefined) {
            dragButton.setPointerCapture(event.pointerId);
        }
        if (!etat.dragLoosened) { sound.drag(); }
        setDragLoosened(true);
    });
    dragButton.addEventListener('pointerup', () => setDragLoosened(false));
    dragButton.addEventListener('pointercancel', () => setDragLoosened(false));
    dragButton.addEventListener('pointerleave', () => setDragLoosened(false));

    // --- Tutoriel d'accueil (accessible depuis l’écran d’accueil) ----------------------
    function renderTutorial() {
        const etape = etat.TUTORIAL_STEPS[etat.tutorialStepIndex];
        tutorialText.textContent = etape.texte;
        tutorialHand.textContent = etape.main;
        tutorialStepDisplay.textContent = (etat.tutorialStepIndex + 1) + ' / ' + etat.TUTORIAL_STEPS.length;
        tutorialNext.textContent = (etat.tutorialStepIndex === etat.TUTORIAL_STEPS.length - 1) ? 'Jouer !' : 'Suivant';
    }

    function openTutorial() {
        etat.tutorialStepIndex = 0;
        renderTutorial();
        tutorial.classList.add('open');
    }

    function closeTutorial() {
        tutorial.classList.remove('open');
    }

    function nextTutorialStep() {
        if (etat.tutorialStepIndex >= etat.TUTORIAL_STEPS.length - 1) {
            closeTutorial();
            if (accueil && accueil.classList.contains('active')) { demarrerJeu(); }
            return;
        }
        etat.tutorialStepIndex += 1;
        renderTutorial();
    }

    tutorialNext.addEventListener('click', nextTutorialStep);
    tutorialClose.addEventListener('click', closeTutorial);
    tutorialOpen.addEventListener('click', () => {
        hideJournal();
        openTutorial();
    });

    const accueilTutoriel = document.getElementById('accueilTutoriel');
    if (accueilTutoriel) { accueilTutoriel.addEventListener('click', openTutorial); }

    // --- Carnet : ouverture, difficulté, accessibilité -------------------------
    // Le carnet s'ouvre par le bouton du menu ET par le bouton 📖 de la barre du
    // haut (à droite de ☰ Menu) : les deux passent par la même bascule.
    const carnetTopButton = document.getElementById('carnetTopButton');

    function basculerCarnet() {
        ensureSound();
        if (journalPanel.classList.contains('open')) {
            hideJournal();
        } else {
            showJournal();
        }
        if (carnetTopButton) {
            carnetTopButton.setAttribute('aria-expanded',
                journalPanel.classList.contains('open') ? 'true' : 'false');
        }
    }

    journalButton.addEventListener('click', basculerCarnet);
    if (carnetTopButton) {
        carnetTopButton.addEventListener('click', basculerCarnet);
    }
    journalClose.addEventListener('click', hideJournal);
    difficultySelect.addEventListener('change', () => setDifficulty(difficultySelect.value));
    if (scionSelect) {
        scionSelect.addEventListener('change', () => { setScion(scionSelect.value); renderBoutique(); });
    }
    floatSelect.addEventListener('change', () => {
        setFloatType(floatSelect.value);
        renderBoutique();
    });
    effectsToggle.checked = post.enabled;
    effectsToggle.addEventListener('change', () => {
        post.enabled = effectsToggle.checked !== false;
    });
    reflectionsToggle.checked = reflections.enabled;
    reflectionsToggle.disabled = !waterReflectionTarget;
    reflectionsToggle.addEventListener('change', () => {
        setReflections(reflectionsToggle.checked !== false);
        reflectionsToggle.checked = reflections.enabled;
    });
    bigTextToggle.addEventListener('change', () => {
        if (document.body) {
            document.body.classList.toggle('big-text', !!bigTextToggle.checked);
        }
    });
    calmToggle.addEventListener('change', () => {
        if (document.body) {
            document.body.classList.toggle('calm', !!calmToggle.checked);
        }
    });

    loadJournal();
    etat.techniqueCourante = journal.technique;
    appliquerTechniqueVisuelle();
    setFloatType(etat.flotteurChoix);
    renderJournal();
    renderBoutique();

    return {
        setDragLoosened, openTutorial, closeTutorial, nextTutorialStep
    };
}

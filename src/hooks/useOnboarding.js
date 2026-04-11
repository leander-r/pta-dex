import { useState, useEffect } from 'react';
import { useTrainerContext } from '../contexts/index.js';
import { useData } from '../contexts/DataContext.jsx';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';

export const useOnboarding = () => {
    const { trainer, party, reserve } = useTrainerContext();
    const { saveSlots } = useData();
    const [dismissed, setDismissed] = useState(
        () => safeLocalStorageGet('pta-onboarding-dismissed', false)
    );
    const [battleVisited, setBattleVisited] = useState(
        () => safeLocalStorageGet('pta-battle-visited', false)
    );

    useEffect(() => {
        const handler = () => setBattleVisited(true);
        window.addEventListener('pta-battle-visited', handler);
        return () => window.removeEventListener('pta-battle-visited', handler);
    }, []);

    const hasPokemon = (party?.length || 0) + (reserve?.length || 0) > 0;
    const hasMoves = [...(party || []), ...(reserve || [])].some(p =>
        (p.moves || []).length > 0
    );
    const hasSaved = (saveSlots || []).some(s => s != null);

    const steps = [
        {
            id: 'name',
            label: 'Name your trainer',
            hint: 'Enter a name in the Trainer tab → header field',
            done: !!(trainer?.name?.trim()),
            tab: 'trainer',
        },
        {
            id: 'stats',
            label: 'Allocate all stat points',
            hint: '30 points across 6 stats (min 6, max 14 each)',
            done: (trainer?.statPoints || 0) === 0 && (trainer?.levelStatPoints || 0) === 0,
            tab: 'trainer',
        },
        {
            id: 'class',
            label: 'Pick a class',
            hint: 'Classes unlock features and skill ranks',
            done: (trainer?.classes?.length || 0) > 0,
            tab: 'trainer',
        },
        {
            id: 'pokemon',
            label: 'Add a Pokémon',
            hint: 'Party holds up to 6; extras go to Reserve',
            done: hasPokemon,
            tab: 'pokemon',
        },
        {
            id: 'moves',
            label: 'Add a move',
            hint: 'Natural (level-up) and Taught are separate pools — 4 slots each',
            done: hasMoves,
            tab: 'pokemon',
        },
        {
            id: 'save',
            label: 'Save your character',
            hint: 'Use Save / Load in the sidebar to create a named snapshot',
            done: hasSaved,
            tab: null,
        },
        {
            id: 'battle',
            label: 'Try the Battle tab',
            hint: 'Track HP, roll dice, manage combat stages',
            done: battleVisited,
            tab: 'battle',
        },
    ];

    const allDone = steps.every(s => s.done);

    const dismiss = () => {
        safeLocalStorageSet('pta-onboarding-dismissed', true);
        setDismissed(true);
    };

    return { steps, allDone, dismissed, dismiss };
};

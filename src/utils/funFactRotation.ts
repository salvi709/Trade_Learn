import { MarketFunFact } from '../types';
import { MARKET_FUN_FACTS } from '../data/marketFunFacts';

const SHOWN_FACTS_KEY = 'smll_shown_facts_history_v1';
const SESSION_SHOWN_KEY = 'smll_funfact_shown_session_v1';
const LAST_FACT_ID_KEY = 'smll_last_fact_id_v1';

/**
 * Returns true if a fun fact has already been displayed during the current browser session.
 */
export function hasShownFunFactThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks that a fun fact has been shown during this session.
 */
export function markFunFactShownThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Selects the next unique, unshown market fact.
 * Avoids repetition until all facts are exhausted, and avoids repeating the immediate prior fact.
 */
export function getNextUniqueFunFact(): MarketFunFact {
  const allFacts = MARKET_FUN_FACTS;
  if (!allFacts || allFacts.length === 0) {
    throw new Error('No fun facts available');
  }

  let shownIds: string[] = [];
  let lastFactId: string | null = null;

  try {
    const stored = localStorage.getItem(SHOWN_FACTS_KEY);
    if (stored) {
      shownIds = JSON.parse(stored);
      if (!Array.isArray(shownIds)) shownIds = [];
    }
    lastFactId = localStorage.getItem(LAST_FACT_ID_KEY);
  } catch {
    shownIds = [];
  }

  // Find facts that have not been shown in the current cycle
  let available = allFacts.filter((f) => !shownIds.includes(f.id));

  // If all facts have been shown, start a new cycle while still avoiding the immediate previous fact
  if (available.length === 0) {
    shownIds = [];
    available = allFacts.filter((f) => f.id !== lastFactId);
    if (available.length === 0) available = allFacts;
  }

  // Pick deterministically or by rotating index based on cycle length to give varied experience
  // Filter out immediate last fact if possible
  const validCandidates = available.filter((f) => f.id !== lastFactId);
  const pool = validCandidates.length > 0 ? validCandidates : available;

  // Pick first available candidate in rotation
  const selectedFact = pool[0];

  // Update history
  try {
    const updatedShown = [...shownIds, selectedFact.id];
    localStorage.setItem(SHOWN_FACTS_KEY, JSON.stringify(updatedShown));
    localStorage.setItem(LAST_FACT_ID_KEY, selectedFact.id);
  } catch {
    // Ignore storage errors
  }

  return selectedFact;
}

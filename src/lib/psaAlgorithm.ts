import { DrillResult, PsaRoundData } from '../types';

export interface PsaState {
  currentRound: number;
  maxRounds: number;
  baseSens: number;
  lowSens: number;
  highSens: number;
  history: PsaRoundData[];
  isFinished: boolean;
  optimalSens: number | null;
}

/**
 * Initializes a new PSA session from a base sensitivity.
 */
export function initPsaSession(baseSens: number, maxRounds: number = 5): PsaState {
  const lowSens = Number((baseSens * 0.6).toFixed(4));
  const highSens = Number((baseSens * 1.4).toFixed(4));

  return {
    currentRound: 1,
    maxRounds,
    baseSens,
    lowSens,
    highSens,
    history: [],
    isFinished: false,
    optimalSens: null
  };
}

/**
 * Computes an objective drill performance score (0 - 100) taking into account:
 * - Accuracy (40%)
 * - Smoothness (30%)
 * - Overshoot vs Undershoot balance (20%)
 * - Average reaction time bonus/penalty (10%)
 */
export function calculateDrillScore(result: DrillResult): number {
  const { accuracy, smoothness, overshootCount, undershootCount, avgReactionTimeMs } = result;
  
  // Imbalance penalty: if all misses are overshoots, sens is likely way too fast.
  const totalFails = overshootCount + undershootCount;
  const imbalance = totalFails > 0 ? Math.abs(overshootCount - undershootCount) / totalFails : 0;
  const balanceScore = Math.max(0, 100 - (imbalance * 50));

  // Reaction time score (benchmark: 220ms is 100, 500ms is 0)
  const reactionScore = Math.max(0, Math.min(100, 100 - ((avgReactionTimeMs - 220) / 2.8)));

  const totalScore = (accuracy * 0.40) + (smoothness * 0.30) + (balanceScore * 0.20) + (reactionScore * 0.10);
  return Number(totalScore.toFixed(1));
}

/**
 * Decides next iteration bounds in the PSA binary search algorithm.
 */
export function advancePsaRound(
  state: PsaState,
  lowResult: DrillResult,
  highResult: DrillResult,
  manualChoice?: 'low' | 'high'
): PsaState {
  const lowScore = calculateDrillScore(lowResult);
  const highScore = calculateDrillScore(highResult);

  // Determine winner: user manual preference or higher algorithm score
  let chosen: 'low' | 'high';
  if (manualChoice) {
    chosen = manualChoice;
  } else {
    chosen = highScore >= lowScore ? 'high' : 'low';
  }

  const roundData: PsaRoundData = {
    round: state.currentRound,
    baseSens: state.baseSens,
    lowSens: state.lowSens,
    highSens: state.highSens,
    lowResult: { ...lowResult, score: lowScore },
    highResult: { ...highResult, score: highScore },
    chosen,
    overshootBias: chosen === 'high' 
      ? highResult.overshootCount - highResult.undershootCount
      : lowResult.overshootCount - lowResult.undershootCount
  };

  const newHistory = [...state.history, roundData];

  // If we reached the final round, calculate optimal final sensitivity
  if (state.currentRound >= state.maxRounds) {
    const finalOptimal = chosen === 'high' 
      ? Number(((state.baseSens + state.highSens) / 2).toFixed(4))
      : Number(((state.baseSens + state.lowSens) / 2).toFixed(4));

    return {
      ...state,
      history: newHistory,
      isFinished: true,
      optimalSens: finalOptimal
    };
  }

  // Calculate new bounds for next round (bracket narrowing)
  let newBase: number;
  if (chosen === 'high') {
    newBase = (state.baseSens + state.highSens) / 2;
  } else {
    newBase = (state.baseSens + state.lowSens) / 2;
  }

  // Halve the delta range each iteration
  const currentSpread = Math.abs(state.highSens - state.lowSens);
  const nextSpread = currentSpread * 0.55;
  const nextLow = Number(Math.max(0.01, newBase - (nextSpread / 2)).toFixed(4));
  const nextHigh = Number((newBase + (nextSpread / 2)).toFixed(4));

  return {
    ...state,
    currentRound: state.currentRound + 1,
    baseSens: Number(newBase.toFixed(4)),
    lowSens: nextLow,
    highSens: nextHigh,
    history: newHistory,
    isFinished: false,
    optimalSens: null
  };
}

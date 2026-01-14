/**
 * Simon Game Store (Turn-Based Multiplayer)
 *
 * Multiplayer mode B (showmatch / time trial):
 * - One timed turn per player (30/60/90s)
 * - Players watch each other's turns
 * - Wrong sequence ends the current player's turn immediately
 * - Each player gets different sequences (same difficulty, different pattern)
 */

import { create } from 'zustand';
import type { Color } from '../shared/types';
import { socketService } from '../services/socketService';
import { soundService } from '../services/soundService';

interface SimonStore {
  // Session context
  selfPlayerId: string | null;

  // Turn-based match state
  isMatchActive: boolean;
  isGameOver: boolean;
  turnTotalSeconds: number;
  turnEndsAt: number | null;
  secondsRemaining: number;
  currentTurnPlayerId: string | null;
  currentTurnPlayerName: string | null;

  // Scoreboard (playerId -> score)
  scores: Record<string, number>;

  // Current sequence for the active player (spectators see it too)
  isShowingSequence: boolean;
  isInputPhase: boolean;
  currentSequence: Color[];
  sequenceLength: number;

  // Local input (only when it's my turn)
  isMyTurn: boolean;
  playerSequence: Color[];
  canSubmit: boolean;

  // Latest scoring feedback (for contextual learning)
  lastEarned: {
    earned: number;
    speedPoints: number;
    multiplier: number;
    newScore: number;
  } | null;

  // Match result
  winner: { playerId: string; name: string; score: number } | null;
  standings: Array<{ playerId: string; name: string; score: number; rank: number }>;

  // UI
  message: string;

  // Actions
  initializeListeners: (selfPlayerId: string) => void;
  cleanup: () => void;
  resetGame: () => void;
  addColorToSequence: (color: Color) => void;
  submitSequence: (gameCode: string, playerId: string) => void;
}

let timerInterval: number | null = null;

function stopTurnTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTurnTimer() {
  stopTurnTimer();
  timerInterval = window.setInterval(() => {
    const { turnEndsAt } = useSimonStore.getState();
    if (!turnEndsAt) return;
    const remaining = Math.max(0, Math.ceil((turnEndsAt - Date.now()) / 1000));
    useSimonStore.setState({ secondsRemaining: remaining });
    if (remaining <= 0) stopTurnTimer();
  }, 250);
}

export const useSimonStore = create<SimonStore>((set, get) => ({
  selfPlayerId: null,

  isMatchActive: false,
  isGameOver: false,
  turnTotalSeconds: 60,
  turnEndsAt: null,
  secondsRemaining: 0,
  currentTurnPlayerId: null,
  currentTurnPlayerName: null,

  scores: {},

  isShowingSequence: false,
  isInputPhase: false,
  currentSequence: [],
  sequenceLength: 0,

  isMyTurn: false,
  playerSequence: [],
  canSubmit: false,

  lastEarned: null,

  winner: null,
  standings: [],

  message: 'Waiting for match to start…',

  initializeListeners: (selfPlayerId: string) => {
    const socket = socketService.getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.once('connect', () => get().initializeListeners(selfPlayerId));
      return;
    }

    set({ selfPlayerId });

    // Match start
    socket.on('simon_tb:match_start', (data: { turnTotalSeconds: number }) => {
      set({
        isMatchActive: true,
        isGameOver: false,
        winner: null,
        standings: [],
        turnTotalSeconds: data.turnTotalSeconds,
        message: 'Match starting…',
      });
    });

    // Turn start
    socket.on('simon_tb:turn_start', (data: any) => {
      const me = get().selfPlayerId;
      const isMyTurn = !!me && data.currentPlayerId === me;

      set({
        isMatchActive: true,
        currentTurnPlayerId: data.currentPlayerId,
        currentTurnPlayerName: data.currentPlayerName,
        turnEndsAt: data.turnEndsAt,
        turnTotalSeconds: data.turnTotalSeconds,
        scores: data.scores || {},
        secondsRemaining: Math.max(0, Math.ceil((data.turnEndsAt - Date.now()) / 1000)),
        isMyTurn,

        isShowingSequence: false,
        isInputPhase: false,
        currentSequence: [],
        sequenceLength: 0,
        playerSequence: [],
        canSubmit: false,
        lastEarned: null,
        message: isMyTurn ? 'Your turn!' : `Watching ${data.currentPlayerName}…`,
      });

      startTurnTimer();
    });

    // Show sequence (to everyone)
    socket.on('simon_tb:show_sequence', (data: any) => {
      set({
        isShowingSequence: true,
        isInputPhase: false,
        currentSequence: data.sequence,
        sequenceLength: data.sequenceLength,
        playerSequence: [],
        canSubmit: false,
      });
    });

    // Input phase (only current player can input)
    socket.on('simon_tb:input_phase', (data: any) => {
      const me = get().selfPlayerId;
      const isMyTurn = !!me && data.currentPlayerId === me;
      set({
        isShowingSequence: false,
        isInputPhase: isMyTurn,
        isMyTurn,
        playerSequence: [],
        canSubmit: false,
        message: isMyTurn ? 'Repeat the sequence!' : '…',
      });
    });

    // Sequence scored
    socket.on('simon_tb:sequence_scored', (data: any) => {
      const me = get().selfPlayerId;
      if (me && data.playerId === me) {
        soundService.playSuccess();
      }

      set({
        lastEarned: {
          earned: data.earned,
          speedPoints: data.speedPoints,
          multiplier: data.multiplier,
          newScore: data.newScore,
        },
        scores: { ...get().scores, [data.playerId]: data.newScore },
        message: `+${data.earned} (x${data.multiplier})`,
      });
    });

    // Turn end
    socket.on('simon_tb:turn_end', (data: any) => {
      const me = get().selfPlayerId;
      if (me && data.playerId === me) {
        soundService.playEliminated();
      }

      set({
        isInputPhase: false,
        isShowingSequence: false,
        currentSequence: [],
        playerSequence: [],
        canSubmit: false,
        message: data.reason === 'fail' ? `${data.playerName} failed — next player` : `${data.playerName} time!`,
      });
    });

    // Match finished
    socket.on('simon_tb:match_finished', (data: any) => {
      stopTurnTimer();
      set({
        isMatchActive: false,
        isInputPhase: false,
        isShowingSequence: false,
        isGameOver: true,
        winner: data.winner,
        standings: data.standings || [],
        message: 'Match finished',
      });
    });
  },

  cleanup: () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.off('simon_tb:match_start');
      socket.off('simon_tb:turn_start');
      socket.off('simon_tb:show_sequence');
      socket.off('simon_tb:input_phase');
      socket.off('simon_tb:sequence_scored');
      socket.off('simon_tb:turn_end');
      socket.off('simon_tb:match_finished');
    }

    stopTurnTimer();

    set({
      selfPlayerId: null,
      isMatchActive: false,
      isGameOver: false,
      turnTotalSeconds: 60,
      turnEndsAt: null,
      secondsRemaining: 0,
      currentTurnPlayerId: null,
      currentTurnPlayerName: null,
      scores: {},
      isShowingSequence: false,
      isInputPhase: false,
      currentSequence: [],
      sequenceLength: 0,
      isMyTurn: false,
      playerSequence: [],
      canSubmit: false,
      lastEarned: null,
      winner: null,
      standings: [],
      message: 'Waiting for match to start…',
    });
  },

  resetGame: () => {
    set({
      isMatchActive: false,
      isGameOver: false,
      isShowingSequence: false,
      isInputPhase: false,
      currentSequence: [],
      sequenceLength: 0,
      isMyTurn: false,
      playerSequence: [],
      canSubmit: false,
      lastEarned: null,
      winner: null,
      standings: [],
      message: 'Waiting for match to start…',
    });
  },

  addColorToSequence: (color: Color) => {
    set((state) => {
      if (!state.isInputPhase || !state.isMyTurn) return {};
      if (state.playerSequence.length >= state.currentSequence.length) return {};

      const newPlayerSequence = [...state.playerSequence, color];
      const canSubmit = newPlayerSequence.length === state.currentSequence.length;

      return {
        playerSequence: newPlayerSequence,
        canSubmit,
        message: canSubmit ? '✅ Submitting…' : `${newPlayerSequence.length}/${state.currentSequence.length}`,
      };
    });
  },

  submitSequence: (gameCode: string, playerId: string) => {
    const state = useSimonStore.getState();
    if (!state.canSubmit) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('simon_tb:submit_sequence', {
      gameCode,
      playerId,
      sequence: state.playerSequence,
    });

    set({
      isInputPhase: false,
      message: 'Checking…',
    });
  },
}));


/**
 * WebSocket Game Handler
 * 
 * Handles real-time game events via Socket.io.
 * Platform events are handled here, game-specific events are added separately.
 */

import { Server, Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyToken } from '../utils/auth';
import { gameService } from '../services/gameService';
import { 
  initializeColorRaceGame, 
  processRound, 
  determineWinner 
} from '../utils/colorRaceLogic';
import {
  validateInput,
  validateSequence,
  eliminatePlayer,
  advanceToNextRound,
  shouldGameEnd,
  updatePlayerProgress,
  calculateTimeoutSeconds,
  calculateTimeoutMs,
  processRoundSubmissions,
  haveAllPlayersSubmitted,
  determineSurvivalWinner,
  getCompletedRoundForPlayer,
} from '../utils/simonLogic';
import {
  SIMON_TURN_CONSTANTS,
  initializeSimonTurnGame,
  startNextTurn,
  advanceTurnIndex,
  validateSequence as validateTurnSequence,
  calculateMultiplier,
  calculateSpeedPoints,
  generateDeterministicSequence,
  determineWinner as determineTurnWinner,
} from '../utils/simonTurnLogic';
import { PLATFORM_CONSTANTS, COLOR_RACE_CONSTANTS, SIMON_CONSTANTS } from '@shared/types';
import type { Player } from '@shared/types';
import type { ColorRaceGameState, PlayerAnswer, SimonGameState, Color } from '@shared/types';

// =============================================================================
// TYPES
// =============================================================================

interface SocketWithSession extends Socket {
  playerId?: string;
  gameCode?: string;
  displayName?: string;
}

// Track disconnect timeouts for cleanup
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Track Simon game timeouts (Step 3)
const simonTimeouts = new Map<string, NodeJS.Timeout>();
// Track Simon TURN-BASED match timeouts (per player turn)
const simonTurnTimeouts = new Map<string, NodeJS.Timeout>();
// Track requested turn duration for a room (set by host at start)
const simonTurnSettingsSeconds = new Map<string, number>();

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize WebSocket handlers
 */
export function initializeGameHandlers(io: Server): void {
  io.on('connection', (socket: SocketWithSession) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Try to auto-reconnect from cookie
    handleAutoReconnect(io, socket);
    
    // Register event handlers
    registerPlatformHandlers(io, socket);
    registerGameHandlers(io, socket);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      handleDisconnect(io, socket);
    });
  });
  
  // Start room cleanup interval
  startCleanupInterval();
  
  console.log('🎮 WebSocket handlers initialized');
}

// =============================================================================
// AUTO-RECONNECTION
// =============================================================================

/**
 * Attempt to auto-reconnect player from session cookie
 */
function handleAutoReconnect(_io: Server, socket: SocketWithSession): void {
  try {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return;
    
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.session;
    if (!token) return;
    
    const payload = verifyToken(token);
    if (!payload) return;
    
    const { playerId, gameCode, displayName } = payload;
    
    // Check if room still exists
    const room = gameService.getRoom(gameCode);
    if (!room) return;
    
    // Check if player is still in room
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Update socket ID and mark connected
    gameService.updateSocketId(gameCode, playerId, socket.id);
    
    // Store session info on socket
    socket.playerId = playerId;
    socket.gameCode = gameCode;
    socket.displayName = displayName;
    
    // Join socket room
    socket.join(gameCode);
    
    // Clear any pending disconnect timeout
    const timeoutKey = `${gameCode}:${playerId}`;
    const existingTimeout = disconnectTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      disconnectTimeouts.delete(timeoutKey);
    }
    
    // Notify others that player reconnected
    socket.to(gameCode).emit('player_reconnected', { 
      playerId,
      displayName,
    });
    
    // Send current room state to reconnected player
    socket.emit('room_state', room);
    
    console.log(`✅ Auto-reconnected: ${displayName} to room ${gameCode}`);
  } catch (error) {
    console.error('❌ Auto-reconnect error:', error);
  }
}

// =============================================================================
// PLATFORM EVENT HANDLERS
// =============================================================================

/**
 * Register platform event handlers
 */
function registerPlatformHandlers(io: Server, socket: SocketWithSession): void {
  /**
   * Join room via WebSocket
   * Called after HTTP session is created
   */
  socket.on('join_room_socket', (data: { gameCode: string; playerId: string }) => {
    try {
      const { gameCode, playerId } = data;
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Verify player is in room
      const player = room.players.find(p => p.id === playerId);
      if (!player) {
        socket.emit('error', { message: 'Player not in room' });
        return;
      }
      
      // Update socket ID
      gameService.updateSocketId(gameCode, playerId, socket.id);
      
      // Store session info on socket
      socket.playerId = playerId;
      socket.gameCode = gameCode;
      socket.displayName = player.displayName;
      
      // Join socket room
      socket.join(gameCode);
      
      // Send initial room state to this player
      socket.emit('room_state', room);
      
      // Broadcast updated room state to ALL players (including this one)
      io.to(gameCode).emit('room_state_update', room);
      
      // Also notify others for UI feedback (optional)
      socket.to(gameCode).emit('player_joined', player);
      
      console.log(`🏠 Socket joined: ${player.displayName} in room ${gameCode} (${room.players.length} players)`);
    } catch (error) {
      console.error('❌ join_room_socket error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  /**
   * Leave room explicitly
   */
  socket.on('leave_room', (data: { gameCode: string; playerId: string }) => {
    try {
      const { gameCode, playerId } = data;
      
      // Remove player from room
      const removed = gameService.removePlayer(gameCode, playerId);
      
      if (removed) {
        // Leave socket room
        socket.leave(gameCode);
        
        // Notify others
        io.to(gameCode).emit('player_left', { playerId });
        
        // Broadcast updated room state to remaining players
        const room = gameService.getRoom(gameCode);
        if (room) {
          io.to(gameCode).emit('room_state_update', room);
        } else {
          // Room is empty/closed
          io.to(gameCode).emit('room_closed');
        }
        
        console.log(`👋 ${socket.displayName} left room ${gameCode} (${room?.players.length || 0} players remaining)`);
      }
      
      // Clear socket session
      socket.playerId = undefined;
      socket.gameCode = undefined;
      socket.displayName = undefined;
    } catch (error) {
      console.error('❌ leave_room error:', error);
    }
  });
  
  /**
   * Host starts the game
   */
  socket.on('start_game', (data: { gameCode: string; playerId: string; turnTotalSeconds?: number }) => {
    try {
      const { gameCode, playerId } = data;
      console.log(`🎮 DEBUG start_game: gameCode=${gameCode}, playerId=${playerId}`);
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      console.log(`🎮 DEBUG room exists: ${!!room}`);
      if (!room) {
        console.error(`❌ Room not found: ${gameCode}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Verify player is host
      const player = room.players.find(p => p.id === playerId);
      console.log(`🎮 DEBUG player found: ${!!player}, isHost: ${player?.isHost}`);
      if (!player?.isHost) {
        console.error(`❌ Player ${playerId} is not host`);
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }
      
      // Verify room is in waiting state
      console.log(`🎮 DEBUG room status: ${room.status}`);
      if (room.status !== 'waiting') {
        console.error(`❌ Room not in waiting state: ${room.status}`);
        socket.emit('error', { message: 'Game already started' });
        return;
      }

      // Store host-selected turn duration (clamped to allowed options)
      const requested = data.turnTotalSeconds ?? 60;
      const allowed = SIMON_TURN_CONSTANTS.TURN_OPTIONS_SECONDS as readonly number[];
      const selected = allowed.includes(requested) ? requested : 60;
      simonTurnSettingsSeconds.set(gameCode, selected);
      
      // Start countdown
      console.log(`✅ Starting countdown for room: ${gameCode}`);
      startCountdown(io, gameCode);
      
      console.log(`⏳ Countdown started for room: ${gameCode}`);
    } catch (error) {
      console.error('❌ start_game error:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  /**
   * Restart game (play again)
   */
  socket.on('restart_game', (data: { gameCode: string; playerId: string }) => {
    try {
      const { gameCode, playerId } = data;
      console.log(`🔄 restart_game: gameCode=${gameCode}, playerId=${playerId}`);
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      if (!room) {
        console.error(`❌ Room not found: ${gameCode}`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Reset room to waiting state
      room.status = 'waiting';
      room.gameState = null;
      
      console.log(`✅ Room ${gameCode} reset to waiting state`);
      
      // Broadcast updated room state to all players
      io.to(gameCode).emit('room_state_update', {
        ...room,
        players: room.players.map(p => ({
          id: p.id,
          displayName: p.displayName,
          avatarId: p.avatarId,
          isHost: p.isHost,
        })),
      });
      
      // Also emit game_restarted event so clients know to reset
      io.to(gameCode).emit('game_restarted', { gameCode });
      
    } catch (error) {
      console.error('❌ restart_game error:', error);
      socket.emit('error', { message: 'Failed to restart game' });
    }
  });
}

// =============================================================================
// GAME EVENT HANDLERS (Color Race)
// =============================================================================

// Track round answers for each game
const roundAnswers = new Map<string, PlayerAnswer[]>();

/**
 * Register game-specific event handlers
 */
function registerGameHandlers(io: Server, socket: SocketWithSession): void {
  /**
   * Simon Turn-Based: submit a full sequence (active player only)
   */
  socket.on('simon_tb:submit_sequence', (data: { gameCode: string; playerId: string; sequence: Color[] }) => {
    try {
      const { gameCode, playerId, sequence } = data;
      const room = gameService.getRoom(gameCode);
      if (!room || room.status !== 'active') return;

      const gameState = room.gameState as any;
      if (!gameState || gameState.gameType !== 'simon_turn') return;

      // Only current player can submit during their turn
      if (gameState.currentPlayerId !== playerId) return;
      if (gameState.phase !== 'turn_input') return;

      const expected = gameState.currentSequence as Color[];
      const isCorrect = validateTurnSequence(expected, sequence);

      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.ceil(((gameState.turnEndsAt as number) - now) / 1000));

      const player = room.players.find((p: Player) => p.id === playerId);
      const playerName = player?.displayName || 'Unknown';

      if (!isCorrect) {
        // Fail ends the turn immediately
        clearSimonTurnTimeout(gameCode);
        const playerState = gameState.players[playerId];
        const ended = {
          ...gameState,
          phase: 'between_turns',
          currentSequence: [],
        };
        gameService.updateGameState(gameCode, ended);

        io.to(gameCode).emit('simon_tb:turn_end', {
          playerId,
          playerName,
          reason: 'fail',
          finalScore: playerState?.score ?? 0,
          sequencesCompleted: playerState?.sequencesCompleted ?? 0,
          maxMultiplier: playerState?.maxMultiplier ?? 1,
        });

        // Advance to next player or finish
        setTimeout(() => {
          advanceOrFinishSimonTurnMatch(io, gameCode);
        }, 1200);

        return;
      }

      // Correct: score it, then immediately show next sequence (if time remains)
      const speedPoints = calculateSpeedPoints(secondsRemaining, gameState.turnTotalSeconds);
      const multiplier = calculateMultiplier(gameState.sequencesCompletedThisTurn);
      const earned = speedPoints * multiplier;

      const updated = { ...gameState };
      updated.players[playerId] = {
        ...updated.players[playerId],
        score: (updated.players[playerId]?.score ?? 0) + earned,
        sequencesCompleted: (updated.players[playerId]?.sequencesCompleted ?? 0) + 1,
        maxMultiplier: Math.max(updated.players[playerId]?.maxMultiplier ?? 1, multiplier),
      };

      updated.sequencesCompletedThisTurn = (updated.sequencesCompletedThisTurn ?? 0) + 1;
      updated.multiplier = calculateMultiplier(updated.sequencesCompletedThisTurn);
      updated.sequenceLength = (updated.sequenceLength ?? SIMON_TURN_CONSTANTS.INITIAL_SEQUENCE_LENGTH) + SIMON_TURN_CONSTANTS.SEQUENCE_INCREMENT;

      const nextIndex = updated.sequencesCompletedThisTurn; // 0-based
      updated.currentSequence = generateDeterministicSequence(gameCode, playerId, nextIndex, updated.sequenceLength);
      updated.phase = 'turn_showing';

      gameService.updateGameState(gameCode, updated);

      io.to(gameCode).emit('simon_tb:sequence_scored', {
        playerId,
        earned,
        speedPoints,
        multiplier,
        newScore: updated.players[playerId].score,
        sequencesCompletedThisTurn: updated.sequencesCompletedThisTurn,
        nextSequenceLength: updated.sequenceLength,
      });

      // If time is up after scoring, end turn; else show next sequence
      if (secondsRemaining <= 0) {
        clearSimonTurnTimeout(gameCode);
        io.to(gameCode).emit('simon_tb:turn_end', {
          playerId,
          playerName,
          reason: 'time',
          finalScore: updated.players[playerId].score,
          sequencesCompleted: updated.players[playerId].sequencesCompleted,
          maxMultiplier: updated.players[playerId].maxMultiplier,
        });
        setTimeout(() => advanceOrFinishSimonTurnMatch(io, gameCode), 800);
        return;
      }

      setTimeout(() => {
        showSimonTurnSequence(io, gameCode);
      }, 450);
    } catch (error) {
      console.error('❌ simon_tb:submit_sequence error:', error);
    }
  });

  /**
   * Color Race: Submit answer
   */
  socket.on('color_race:submit_answer', (data: { gameCode: string; playerId: string; color: import('@shared/types').Color }) => {
    try {
      const { gameCode, playerId, color } = data;
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      if (!room || room.status !== 'active') {
        return;
      }
      
      // Get game state
      const gameState = room.gameState as any;
      if (!gameState || gameState.gameType !== 'color_race') {
        return;
      }
      
      // Check if player already answered this round
      const answers = roundAnswers.get(gameCode) || [];
      if (answers.some(a => a.playerId === playerId)) {
        return; // Already answered
      }
      
      // Record answer with server timestamp
      const answer = {
        playerId,
        color,
        timestamp: Date.now(),
      };
      
      answers.push(answer);
      roundAnswers.set(gameCode, answers);
      
      // Check if all connected players have answered
      const connectedPlayers = room.players.filter(p => p.connected);
      
      if (answers.length >= connectedPlayers.length) {
        // Process round
        processColorRaceRound(io, gameCode, room, gameState, answers);
        
        // Clear answers for next round
        roundAnswers.set(gameCode, []);
      }
    } catch (error) {
      console.error('❌ color_race:submit_answer error:', error);
    }
  });
  
  /**
   * Simon: Submit complete sequence (Step 2, 3 & 4 - Competitive Multiplayer)
   */
  socket.on('simon:submit_sequence', (data: { gameCode: string; playerId: string; sequence: Color[] }) => {
    try {
      const { gameCode, playerId, sequence } = data;
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      if (!room || room.status !== 'active') {
        return;
      }
      
      // Get game state
      let gameState = room.gameState as SimonGameState;
      if (!gameState || gameState.gameType !== 'simon') {
        return;
      }
      
      // Verify player is still playing (Step 4: Check status)
      const playerState = gameState.playerStates[playerId];
      if (!playerState || playerState.status !== 'playing') {
        console.log(`⚠️ Player ${playerId} tried to submit but is not active`);
        return;
      }
      
      // Check if already submitted
      if (gameState.submissions[playerId]) {
        console.log(`⚠️ Player ${playerId} already submitted`);
        return;
      }
      
      // Get player info
      const player = room.players.find(p => p.id === playerId);
      const playerName = player?.displayName || 'Unknown';
      
      // Validate sequence
      const isCorrect = validateSequence(gameState, sequence);
      const timestamp = Date.now();
      
      // Step 4: Record submission (don't reveal correctness yet)
      gameState.submissions[playerId] = {
        playerId,
        sequence,
        timestamp,
        isCorrect,
      };
      gameService.updateGameState(gameCode, gameState);
      
      console.log(`📝 ${playerName} submitted (${isCorrect ? 'correct' : 'wrong'}) at ${timestamp}`);
      
      // Broadcast that player submitted (Step 4: Don't reveal correctness)
      io.to(gameCode).emit('simon:player_submitted', {
        playerId,
        playerName,
      });
      
      // Step 4: Check if all active players have submitted
      if (haveAllPlayersSubmitted(gameState)) {
        console.log(`✅ All players submitted! Processing round ${gameState.round}...`);
        
        // Cancel timeout (Step 3)
        const existingTimeout = simonTimeouts.get(gameCode);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          simonTimeouts.delete(gameCode);
        }
        
        // Process round (Step 4)
        processSimonRound(io, gameCode);
      }
    } catch (error) {
      console.error('❌ simon:submit_sequence error:', error);
    }
  });
  
  /**
   * Simon: Submit input (single color in sequence) - For Step 4 elimination
   * This is the old per-color input, keeping for Step 4+
   */
  socket.on('simon:submit_input', (data: { gameCode: string; playerId: string; color: Color; inputIndex: number }) => {
    try {
      const { gameCode, playerId, color, inputIndex } = data;
      
      // Verify room exists
      const room = gameService.getRoom(gameCode);
      if (!room || room.status !== 'active') {
        return;
      }
      
      // Get game state
      const gameState = room.gameState as SimonGameState;
      if (!gameState || gameState.gameType !== 'simon') {
        return;
      }
      
      // Verify player is still playing
      const playerState = gameState.playerStates[playerId];
      if (!playerState || playerState.status !== 'playing') {
        return;
      }
      
      // Validate input
      const isCorrect = validateInput(gameState, playerId, color, inputIndex);
      
      if (!isCorrect) {
        // Wrong input - eliminate player
        const newState = eliminatePlayer(gameState, playerId, gameState.round);
        gameService.updateGameState(gameCode, newState);
        
        // Get player info
        const player = room.players.find(p => p.id === playerId);
        
        // Broadcast elimination
        io.to(gameCode).emit('simon:player_eliminated', {
          playerId,
          playerName: player?.displayName || 'Unknown',
          reason: 'wrong_color',
        });
        
        // Check if game should end
        if (shouldGameEnd(newState)) {
          finishSimonGame(io, gameCode, newState, room);
        }
        
        return;
      }
      
      // Correct input - update progress
      let newState = updatePlayerProgress(gameState, playerId);
      gameService.updateGameState(gameCode, newState);
      
      // Emit correct feedback
      io.to(gameCode).emit('simon:input_correct', {
        playerId,
        index: inputIndex,
      });
      
      // Check if player completed the sequence
      const updatedPlayerState = newState.playerStates[playerId];
      if (updatedPlayerState.currentInputIndex >= newState.sequence.length) {
        // Player completed this round!
        console.log(`✅ Player ${playerId} completed round ${newState.round}`);
        
        // Check if all active players have completed
        const allComplete = Object.values(newState.playerStates).every(state => 
          state.status !== 'playing' || state.currentInputIndex >= newState.sequence.length
        );
        
        if (allComplete) {
          // All players completed - advance to next round
          setTimeout(() => {
            advanceSimonRound(io, gameCode);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ simon:submit_input error:', error);
    }
  });
}

// =============================================================================
// COUNTDOWN
// =============================================================================

/**
 * Start countdown before game begins
 */
function startCountdown(io: Server, gameCode: string): void {
  gameService.updateRoomStatus(gameCode, 'countdown');
  
  let count = 3;
  
  const interval = setInterval(() => {
    io.to(gameCode).emit('countdown', { count });
    
    if (count === 0) {
      clearInterval(interval);
      
      // Update status to active
      gameService.updateRoomStatus(gameCode, 'active');
      
      // Turn-based Simon is the multiplayer default (arcade showmatch)
      const gameType: 'simon' | 'simon_turn' | 'color_race' = 'simon_turn';
      
      const room = gameService.getRoom(gameCode);
      if (!room) return;
      
      if (gameType === 'simon_turn') {
        // Initialize TURN-BASED Simon match
        const turnTotalSeconds = simonTurnSettingsSeconds.get(gameCode) ?? 60;
        const gameState = initializeSimonTurnGame(room.players, turnTotalSeconds);
        gameService.updateGameState(gameCode, gameState);

        io.to(gameCode).emit('simon_tb:match_start', {
          turnOrder: room.players.map((p: Player) => ({ playerId: p.id, name: p.displayName, avatarId: p.avatarId })),
          turnTotalSeconds,
        });

        console.log(`🎮 Simon TURN started in room: ${gameCode} (${turnTotalSeconds}s per player)`);

        // Start first turn after brief delay
        setTimeout(() => {
          startSimonTurn(io, gameCode, turnTotalSeconds);
        }, 500);
        return;
      }

      // Fallback: Color Race
      const colorRaceState = initializeColorRaceGame(room.players);
      gameService.updateGameState(gameCode, colorRaceState);

      io.to(gameCode).emit('color_race:new_round', {
        round: colorRaceState.round,
        color: colorRaceState.currentColor,
        totalRounds: colorRaceState.totalRounds,
      });

      console.log(`🎮 Color Race started in room: ${gameCode}`);
    }
    
    count--;
  }, 1000);
}

function clearSimonTurnTimeout(gameCode: string) {
  const t = simonTurnTimeouts.get(gameCode);
  if (t) {
    clearTimeout(t);
    simonTurnTimeouts.delete(gameCode);
  }
}

function startSimonTurn(io: Server, gameCode: string, turnTotalSeconds: number) {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;

  const existing = room.gameState as any;
  const baseState = existing && existing.gameType === 'simon_turn' ? existing : initializeSimonTurnGame(room.players, turnTotalSeconds);
  const started = startNextTurn(gameCode, baseState);
  gameService.updateGameState(gameCode, started);

  const currentPlayerId = started.currentPlayerId!;
  const currentPlayerName = room.players.find((p: Player) => p.id === currentPlayerId)?.displayName || 'Unknown';

  io.to(gameCode).emit('simon_tb:turn_start', {
    currentPlayerId,
    currentPlayerName,
    turnEndsAt: started.turnEndsAt!,
    turnTotalSeconds: started.turnTotalSeconds,
    scores: Object.fromEntries(Object.entries(started.players).map(([id, p]) => [id, p.score])),
  });

  // Set hard turn timeout
  clearSimonTurnTimeout(gameCode);
  const timeout = setTimeout(() => {
    handleSimonTurnTimeout(io, gameCode);
  }, started.turnTotalSeconds * 1000);
  simonTurnTimeouts.set(gameCode, timeout);

  showSimonTurnSequence(io, gameCode);
}

function showSimonTurnSequence(io: Server, gameCode: string) {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;
  const gameState = room.gameState as any;
  if (!gameState || gameState.gameType !== 'simon_turn') return;

  const currentPlayerId = gameState.currentPlayerId as string;
  if (!currentPlayerId) return;

  const showing = {
    ...gameState,
    phase: 'turn_showing',
  };
  gameService.updateGameState(gameCode, showing);

  io.to(gameCode).emit('simon_tb:show_sequence', {
    currentPlayerId,
    sequence: showing.currentSequence,
    sequenceLength: showing.sequenceLength,
  });

  // After show, allow input
  const showMs = showing.currentSequence.length * (SIMON_CONSTANTS.SHOW_COLOR_DURATION_MS + SIMON_CONSTANTS.SHOW_COLOR_GAP_MS) + 500;
  setTimeout(() => {
    const now = Date.now();
    const secondsRemaining = Math.max(0, Math.ceil(((showing.turnEndsAt as number) - now) / 1000));
    const inputState = { ...showing, phase: 'turn_input' };
    gameService.updateGameState(gameCode, inputState);

    io.to(gameCode).emit('simon_tb:input_phase', {
      currentPlayerId,
      turnEndsAt: showing.turnEndsAt,
      secondsRemaining,
    });
  }, showMs);
}

function handleSimonTurnTimeout(io: Server, gameCode: string) {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;
  const gameState = room.gameState as any;
  if (!gameState || gameState.gameType !== 'simon_turn') return;

  clearSimonTurnTimeout(gameCode);

  const playerId = gameState.currentPlayerId as string;
  if (!playerId) return;
  const playerName = room.players.find((p: Player) => p.id === playerId)?.displayName || 'Unknown';
  const playerState = gameState.players[playerId];

  const ended = { ...gameState, phase: 'between_turns', currentSequence: [] };
  gameService.updateGameState(gameCode, ended);

  io.to(gameCode).emit('simon_tb:turn_end', {
    playerId,
    playerName,
    reason: 'time',
    finalScore: playerState?.score ?? 0,
    sequencesCompleted: playerState?.sequencesCompleted ?? 0,
    maxMultiplier: playerState?.maxMultiplier ?? 1,
  });

  setTimeout(() => advanceOrFinishSimonTurnMatch(io, gameCode), 800);
}

function advanceOrFinishSimonTurnMatch(io: Server, gameCode: string) {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;
  const gameState = room.gameState as any;
  if (!gameState || gameState.gameType !== 'simon_turn') return;

  const advanced = advanceTurnIndex(gameState);
  gameService.updateGameState(gameCode, advanced);

  if (advanced.phase === 'finished') {
    finishSimonTurnMatch(io, gameCode, advanced, room);
    return;
  }

  startSimonTurn(io, gameCode, advanced.turnTotalSeconds);
}

function finishSimonTurnMatch(io: Server, gameCode: string, gameState: any, room: any) {
  const winnerId = determineTurnWinner(gameState);
  const standings = Object.values(gameState.players)
    .map((p: any) => {
      const player = room.players.find((pl: Player) => pl.id === p.playerId);
      return { playerId: p.playerId, name: player?.displayName || 'Unknown', score: p.score };
    })
    .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId))
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  const winnerEntry = winnerId ? standings.find((s) => s.playerId === winnerId) : standings[0];
  if (!winnerEntry) return; // defensive: empty room
  const winner = { playerId: winnerEntry.playerId, name: winnerEntry.name, score: winnerEntry.score };

  io.to(gameCode).emit('simon_tb:match_finished', { winner, standings });
  gameService.updateRoomStatus(gameCode, 'finished');
}

// =============================================================================
// COLOR RACE GAME LOGIC
// =============================================================================

/**
 * Process a Color Race round
 */
function processColorRaceRound(
  io: Server,
  gameCode: string,
  room: any,
  gameState: ColorRaceGameState,
  answers: PlayerAnswer[]
): void {
  // Process the round
  const newState = processRound(gameState, answers);
  
  // Update game state
  gameService.updateGameState(gameCode, newState);
  
  // Get winner info for this round
  const roundWinner = room.players.find((p: Player) => p.id === newState.roundWinner);
  
  // Broadcast round result
  io.to(gameCode).emit('color_race:round_result', {
    winnerId: newState.roundWinner,
    winnerName: roundWinner?.displayName || null,
    scores: newState.scores,
  });
  
  // Check if game finished
  if (newState.phase === 'finished') {
    const winner = determineWinner(newState);
    const winnerPlayer = room.players.find((p: Player) => p.id === winner?.winnerId);
    
    io.to(gameCode).emit('color_race:game_finished', {
      winnerId: winner!.winnerId,
      winnerName: winnerPlayer!.displayName,
      finalScores: newState.scores,
    });
    
    gameService.updateRoomStatus(gameCode, 'finished');
    console.log(`🏆 Color Race finished in room ${gameCode} - Winner: ${winnerPlayer?.displayName}`);
  } else {
    // Start next round after delay
    setTimeout(() => {
      const currentRoom = gameService.getRoom(gameCode);
      if (currentRoom && currentRoom.status === 'active') {
        io.to(gameCode).emit('color_race:new_round', {
          round: newState.round,
          color: newState.currentColor,
          totalRounds: newState.totalRounds,
        });
      }
    }, COLOR_RACE_CONSTANTS.ROUND_RESULT_DELAY_MS);
  }
}

// =============================================================================
// SIMON GAME LOGIC
// =============================================================================

/**
 * Show the Simon sequence to all players
 */
function showSimonSequence(io: Server, gameCode: string, gameState: SimonGameState): void {
  const { sequence, round } = gameState;
  
  // Emit sequence start event
  io.to(gameCode).emit('simon:show_sequence', {
    round,
    sequence,
  });
  
  console.log(`🎨 Showing sequence for round ${round}: [${sequence.join(', ')}]`);
  console.log(`📡 Emitted simon:show_sequence to room ${gameCode}`);
  
  // Calculate total animation time
  // Each color shows for SHOW_COLOR_DURATION_MS + GAP
  const totalTime = sequence.length * (SIMON_CONSTANTS.SHOW_COLOR_DURATION_MS + SIMON_CONSTANTS.SHOW_COLOR_GAP_MS);
  
  // After sequence completes, start input phase (Step 2 & Step 3)
  setTimeout(() => {
    io.to(gameCode).emit('simon:sequence_complete');
    
    // Wait 500ms, then enable input
    setTimeout(() => {
      const room = gameService.getRoom(gameCode);
      if (!room || room.status !== 'active') return;
      
      const currentState = room.gameState as SimonGameState;
      if (!currentState || currentState.gameType !== 'simon') return;
      
      // Step 3: Calculate timeout based on sequence length
      const timeoutSeconds = calculateTimeoutSeconds(currentState.sequence.length);
      const timeoutMs = calculateTimeoutMs(currentState.sequence.length);
      const now = Date.now();
      const timeoutAt = now + timeoutMs;
      
      // Update game state with timeout timestamps
      const updatedState: SimonGameState = {
        ...currentState,
        phase: 'player_input',
        timeoutAt,
        timerStartedAt: now,
      };
      gameService.updateGameState(gameCode, updatedState);
      
      // Emit input phase with timeout data (Step 3)
      io.to(gameCode).emit('simon:input_phase', {
        round: currentState.round,
        timeoutAt,
        timeoutSeconds,
      });
      
      console.log(`⏰ Input phase started for round ${round} - ${timeoutSeconds}s timeout`);
      
      // Step 3: Set server-side timeout
      const timeout = setTimeout(() => {
        handleSimonTimeout(io, gameCode);
      }, timeoutMs);
      
      simonTimeouts.set(gameCode, timeout);
    }, 500);
  }, totalTime + 500);
}

/**
 * Advance to next Simon round
 */
function advanceSimonRound(io: Server, gameCode: string): void {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;
  
  const gameState = room.gameState as SimonGameState;
  if (!gameState || gameState.gameType !== 'simon') return;
  
  // Advance to next round
  const newState = advanceToNextRound(gameState);
  gameService.updateGameState(gameCode, newState);
  
  console.log(`⏭️ Advancing to round ${newState.round}`);
  
  // Show new sequence
  showSimonSequence(io, gameCode, newState);
}

/**
 * Process Simon round - award points, eliminate wrong answers (Step 4)
 */
function processSimonRound(io: Server, gameCode: string): void {
  try {
    const room = gameService.getRoom(gameCode);
    if (!room || room.status !== 'active') {
      console.log(`❌ processSimonRound: Room ${gameCode} not found or inactive`);
      return;
    }
    
    let gameState = room.gameState as SimonGameState;
    if (!gameState || gameState.gameType !== 'simon') {
      console.log(`❌ processSimonRound: Invalid game state for ${gameCode}`);
      return;
    }
    
    console.log(`🏁 Processing round ${gameState.round} for room ${gameCode}...`);
    console.log(`   Submissions:`, gameState.submissions);
    console.log(`   Player states:`, gameState.playerStates);
    
    // Process submissions (find fastest, eliminate wrong)
    console.log(`📤 Calling processRoundSubmissions...`);
    const { gameState: newState, roundWinner, eliminations } = processRoundSubmissions(gameState);
    console.log(`📥 processRoundSubmissions returned:`, { roundWinner, eliminationsCount: eliminations.length });
  gameService.updateGameState(gameCode, newState);
  
  // Prepare elimination data with player names
  const eliminationData = eliminations.map(e => {
    const player = room.players.find(p => p.id === e.playerId);
    return {
      playerId: e.playerId,
      name: player?.displayName || 'Unknown',
      reason: e.reason,
    };
  });
  
  // Prepare round winner data
  const roundWinnerData = roundWinner ? {
    playerId: roundWinner.playerId,
    name: room.players.find(p => p.id === roundWinner.playerId)?.displayName || 'Unknown',
  } : null;
  
  // Broadcast eliminations
  eliminationData.forEach(elim => {
    io.to(gameCode).emit('simon:player_eliminated', {
      playerId: elim.playerId,
      playerName: elim.name,
      reason: elim.reason,
    });
  });
  
  // Broadcast round result (Step 4)
  io.to(gameCode).emit('simon:round_result', {
    roundWinner: roundWinnerData,
    eliminations: eliminationData,
    scores: newState.scores,
    playerStatuses: Object.fromEntries(
      Object.entries(newState.playerStates).map(([id, state]) => [id, state.status])
    ),
  });
  
  console.log(`🏆 Round ${newState.round} complete - Winner: ${roundWinnerData?.name || 'None'}`);
  
  // Check end conditions
  const totalPlayers = Object.keys(newState.playerStates).length;
  const activePlayers = Object.values(newState.playerStates).filter(s => s.status === 'playing').length;
  const gameEnds = shouldGameEnd(newState);
  
  console.log(`🔍 Game check: ${totalPlayers} total, ${activePlayers} active → shouldEnd=${gameEnds}`);
  
  if (gameEnds) {
    console.log(`🎯 ENDING GAME for ${gameCode}`);
    // Wait briefly, then end game
    setTimeout(() => {
      finishSimonGame(io, gameCode, newState, room);
    }, 3000);
  } else {
    console.log(`➡️ ADVANCING to next round for ${gameCode}`);
    // Wait briefly, then advance to next round
    setTimeout(() => {
      advanceSimonRound(io, gameCode);
    }, 3000);
  }
  } catch (error) {
    console.error(`❌ ERROR in processSimonRound for ${gameCode}:`, error);
    console.error(`   Stack:`, (error as Error).stack);
  }
}

/**
 * Handle Simon timeout (Step 3 & 4 - Competitive Multiplayer)
 */
function handleSimonTimeout(io: Server, gameCode: string): void {
  const room = gameService.getRoom(gameCode);
  if (!room || room.status !== 'active') return;
  
  let gameState = room.gameState as SimonGameState;
  if (!gameState || gameState.gameType !== 'simon') return;
  
  console.log(`⏰ Timeout expired for room ${gameCode}`);
  
  // Step 4: Record timeout for all players who didn't submit
  const activePlayers = Object.values(gameState.playerStates).filter(
    state => state.status === 'playing'
  );
  
  activePlayers.forEach(playerState => {
    if (!gameState.submissions[playerState.playerId]) {
      const player = room.players.find(p => p.id === playerState.playerId);
      
      // Record timeout submission (wrong)
      gameState.submissions[playerState.playerId] = {
        playerId: playerState.playerId,
        sequence: [], // Empty = timeout
        timestamp: Date.now(),
        isCorrect: false,
      };
      
      console.log(`⏰ ${player?.displayName || 'Unknown'} timed out`);
      
      // Emit timeout event
      io.to(gameCode).emit('simon:timeout', {
        playerId: playerState.playerId,
        playerName: player?.displayName || 'Unknown',
        correctSequence: gameState.sequence,
      });
    }
  });
  
  // Update game state with timeout submissions
  gameService.updateGameState(gameCode, gameState);
  
  // Clear timeout
  simonTimeouts.delete(gameCode);
  
  // Process the round (Step 4)
  processSimonRound(io, gameCode);
}

/**
 * Finish Simon game and declare winner (Step 4: Competitive Scoring)
 */
function finishSimonGame(io: Server, gameCode: string, gameState: SimonGameState, room: any): void {
  console.log(`🏁 finishSimonGame called for ${gameCode}`);
  
  // SURVIVAL MODE:
  // 1) Highest completed round wins
  // 2) If tied, highest score wins
  const winnerId = determineSurvivalWinner(gameState);

  const standings = Object.keys(gameState.playerStates)
    .map((playerId) => {
      const player = room.players.find((p: Player) => p.id === playerId);
      const status = gameState.playerStates[playerId]?.status;
      const completedRound = getCompletedRoundForPlayer(gameState, playerId);
      const score = gameState.scores[playerId] ?? 0;
      return {
        playerId,
        name: player?.displayName || 'Unknown',
        score,
        completedRound,
        status,
        isEliminated: status !== 'playing',
      };
    })
    .sort((a, b) => {
      if (b.completedRound !== a.completedRound) return b.completedRound - a.completedRound;
      if (b.score !== a.score) return b.score - a.score;
      return a.playerId.localeCompare(b.playerId);
    });

  const winner = winnerId ? standings.find(s => s.playerId === winnerId) : standings[0];
  
  // Emit game finished with full scoreboard
  io.to(gameCode).emit('simon:game_finished', {
    winner,
    finalScores: standings,
  });
  
  gameService.updateRoomStatus(gameCode, 'finished');
  console.log(`🏆 Simon finished in room ${gameCode} - Winner: ${winner?.name} with ${winner?.score} points!`);
}

// =============================================================================
// DISCONNECT HANDLING
// =============================================================================

/**
 * Handle socket disconnect
 */
function handleDisconnect(io: Server, socket: SocketWithSession): void {
  const { playerId, gameCode, displayName } = socket;
  
  if (!playerId || !gameCode) {
    console.log(`🔌 Socket disconnected: ${socket.id} (no session)`);
    return;
  }
  
  console.log(`⚠️ Disconnect detected: ${displayName} from room ${gameCode}`);
  
  const timeoutKey = `${gameCode}:${playerId}`;
  
  // Set buffer timeout before marking as disconnected
  const bufferTimeout = setTimeout(() => {
    // Mark player as disconnected
    gameService.markPlayerDisconnected(gameCode, playerId);
    
    // Notify others
    io.to(gameCode).emit('player_disconnected', { 
      playerId,
      displayName,
    });
    
    console.log(`⏳ ${displayName} marked as disconnected (grace period started)`);
    
    // Set removal timeout
    const removalTimeout = setTimeout(() => {
      const removed = gameService.removeIfStillDisconnected(gameCode, playerId);
      
      if (removed) {
        io.to(gameCode).emit('player_left', { playerId });
        console.log(`🗑️ ${displayName} removed after timeout`);
        
        // Broadcast updated room state to remaining players
        const room = gameService.getRoom(gameCode);
        if (room) {
          io.to(gameCode).emit('room_state_update', room);
        } else {
          // Room is empty/closed
          io.to(gameCode).emit('room_closed');
        }
      }
      
      disconnectTimeouts.delete(timeoutKey);
    }, PLATFORM_CONSTANTS.DISCONNECT_GRACE_MS);
    
    disconnectTimeouts.set(timeoutKey, removalTimeout);
  }, PLATFORM_CONSTANTS.DISCONNECT_BUFFER_MS);
  
  disconnectTimeouts.set(timeoutKey, bufferTimeout);
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Start interval for cleaning up dead rooms
 */
function startCleanupInterval(): void {
  setInterval(() => {
    const cleaned = gameService.cleanupDeadRooms();
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} dead rooms`);
    }
  }, PLATFORM_CONSTANTS.ROOM_CLEANUP_INTERVAL_MS);
}

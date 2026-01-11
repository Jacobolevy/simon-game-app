/**
 * Entry Page
 * 
 * Name + avatar selection page.
 * First screen players see.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, joinGame } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';

export function EntryPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [avatarId, setAvatarId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setSession } = useAuthStore();
  const navigate = useNavigate();
  
  // Handle invite link with game code in URL
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setMode('join');
      setGameCode(joinCode.toUpperCase());
    }
  }, [searchParams]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await createSession(displayName, avatarId);
      setSession(response.session);
      navigate('/waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await joinGame(displayName, avatarId, gameCode);
      setSession(response.session);
      navigate('/waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <AppShell variant="jelly" className="flex items-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Multiplayer</h1>
          <p className="text-sm text-white/55 mt-2">Create a room or join with a code.</p>

          <GlassSurface className="mt-7 p-5 text-left">
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full h-12 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors active:scale-[0.99]"
                style={{ touchAction: 'manipulation' }}
              >
                <span aria-hidden="true">✨</span>
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full h-12 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                style={{ touchAction: 'manipulation' }}
              >
                <span aria-hidden="true">🔑</span>
                Join Room
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full h-11 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm"
                type="button"
              >
                ← Back
              </button>
            </div>
          </GlassSurface>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell variant="jelly" className="flex items-center">
      <div className="text-center">
        <button
          onClick={() => setMode(null)}
          className="inline-flex items-center gap-2 text-white/65 hover:text-white transition-colors text-sm mb-5"
          type="button"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </h2>
        <p className="text-sm text-white/55 mt-2">
          {mode === 'create' ? 'You’ll get a code to share.' : 'Enter a code or use an invite link.'}
        </p>

        <GlassSurface className="mt-7 p-5 text-left">
          <form onSubmit={mode === 'create' ? handleCreateGame : handleJoinGame} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jacob"
                minLength={3}
                maxLength={12}
                required
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">
                  Game code
                  {searchParams.get('join') && (
                    <span className="ml-2 text-[11px] text-green-300/80 font-medium">
                      (from invite link)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  maxLength={6}
                  required
                  className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 uppercase tracking-widest"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {(['1', '2', '3', '4', '5', '6', '7', '8'] as const).map((id) => {
                  const emojis = ['😀', '🎮', '🚀', '⚡', '🎨', '🎯', '🏆', '🌟'];
                  const isSelected = avatarId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAvatarId(id)}
                      className={[
                        'rounded-2xl border px-2 py-3 min-h-[52px] transition-all active:scale-[0.98]',
                        isSelected ? 'bg-white/10 border-white/30' : 'bg-white/0 border-white/10 hover:bg-white/5 hover:border-white/20',
                      ].join(' ')}
                      style={{ touchAction: 'manipulation' }}
                      aria-pressed={isSelected}
                    >
                      <span className="text-2xl">{emojis[parseInt(id, 10) - 1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-[0.99]"
              style={{ touchAction: 'manipulation' }}
            >
              {loading ? 'Loading…' : mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          </form>
        </GlassSurface>
      </div>
    </AppShell>
  );
}

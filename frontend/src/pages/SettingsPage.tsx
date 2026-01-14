import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useUserProgressStore } from '../store/userProgressStore';
import { useAuthStore } from '../store/authStore';
import { soundService } from '../services/soundService';
import { backgroundMusicService } from '../services/backgroundMusicService';
import { hapticService } from '../services/hapticService';
import { logout as apiLogout } from '../services/authService';

type MusicPreset = 'low' | 'medium' | 'high';

const MUSIC_PRESETS: Record<MusicPreset, { label: string; volume: number }> = {
  low: { label: 'Low', volume: 0.15 },
  medium: { label: 'Med', volume: 0.3 },
  high: { label: 'High', volume: 0.45 },
};

function closestPreset(vol: number): MusicPreset {
  const entries = Object.entries(MUSIC_PRESETS) as Array<[MusicPreset, { label: string; volume: number }]>;
  let best: MusicPreset = 'medium';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [k, v] of entries) {
    const d = Math.abs(vol - v.volume);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  return best;
}

export function SettingsPage() {
  const navigate = useNavigate();

  const user = useUserProgressStore((s) => s.user);
  const setUserName = useUserProgressStore((s) => s.setUserName);

  const clearSession = useAuthStore((s) => s.clearSession);

  const [draftName, setDraftName] = useState(user.name);
  const [nameError, setNameError] = useState<string>('');

  const [sfxMuted, setSfxMuted] = useState(soundService.getMuted());
  const [musicMuted, setMusicMuted] = useState(backgroundMusicService.getMuted());
  const [musicPreset, setMusicPreset] = useState<MusicPreset>(() => closestPreset(backgroundMusicService.getVolume()));

  const hapticsSupported = useMemo(() => hapticService.isAvailable(), []);
  const [hapticsEnabled, setHapticsEnabled] = useState(hapticService.getEnabled());

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (trimmed.length < 3 || trimmed.length > 12) {
      setNameError('Name must be 3–12 characters.');
      return;
    }
    setNameError('');
    setUserName(trimmed);
    hapticService.vibrateToggle();
  };

  const handleToggleSfx = async () => {
    await soundService.init();
    const next = soundService.toggleMute();
    setSfxMuted(next);
    hapticService.vibrateToggle();
  };

  const handleToggleMusicMute = async () => {
    await backgroundMusicService.init();
    const next = backgroundMusicService.toggleMute();
    setMusicMuted(next);
    hapticService.vibrateToggle();
  };

  const handleSetMusicPreset = async (preset: MusicPreset) => {
    await backgroundMusicService.init();
    backgroundMusicService.setVolume(MUSIC_PRESETS[preset].volume);
    setMusicPreset(preset);
    hapticService.vibrateToggle();
  };

  const handleToggleHaptics = () => {
    if (!hapticsSupported) return;
    const next = hapticService.toggle();
    setHapticsEnabled(next && hapticsSupported);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      try {
        await apiLogout();
      } catch {
        // Ignore network errors on logout; still clear local session
      }
      clearSession();
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <AppShell variant="jelly">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-bold text-lg leading-none">Settings</div>
            <div className="text-white/55 text-[11px]">Profile, audio, haptics</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all"
            style={{ touchAction: 'manipulation' }}
          >
            ← Home
          </button>
        </header>

        {/* Account */}
        <GlassSurface className="p-3 mb-2">
          <div className="text-white/70 text-xs font-semibold mb-2">Account</div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-white/70 mb-1.5 uppercase tracking-wide">
                Display name
              </label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Jacob"
                minLength={3}
                maxLength={12}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveName}
              className="h-11 px-3 rounded-xl bg-white text-slate-900 font-black text-xs active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              Save
            </button>
          </div>

          {nameError && (
            <div className="mt-2 bg-red-500/10 border border-red-400/30 text-red-200 px-3 py-2 rounded-xl text-xs">
              {nameError}
            </div>
          )}

          <div className="mt-2 text-white/45 text-[11px]">
            Guest profile (account login comes later).
          </div>
        </GlassSurface>

        {/* Audio */}
        <GlassSurface className="p-3 mb-2">
          <div className="text-white/70 text-xs font-semibold mb-2">Audio</div>

          <div className="flex items-center justify-between py-1">
            <div className="text-white text-sm font-semibold">SFX</div>
            <button
              type="button"
              onClick={handleToggleSfx}
              aria-pressed={!sfxMuted}
              className={[
                'h-9 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]',
                sfxMuted
                  ? 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  : 'bg-green-500/20 text-green-100 border-green-400/30',
              ].join(' ')}
              style={{ touchAction: 'manipulation' }}
            >
              {sfxMuted ? 'Off' : 'On'}
            </button>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="text-white text-sm font-semibold">Music</div>
              <button
                type="button"
                onClick={handleToggleMusicMute}
                aria-pressed={!musicMuted}
                className={[
                  'h-9 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]',
                  musicMuted
                    ? 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    : 'bg-cyan-500/20 text-cyan-100 border-cyan-400/30',
                ].join(' ')}
                style={{ touchAction: 'manipulation' }}
              >
                {musicMuted ? 'Muted' : 'On'}
              </button>
            </div>

            <div className="mt-2 text-white/45 text-[11px]">
              Uses your device volume. This fine-tunes in-game music.
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(MUSIC_PRESETS) as MusicPreset[]).map((p) => {
                const isSelected = musicPreset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSetMusicPreset(p)}
                    className={[
                      'h-9 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]',
                      isSelected
                        ? 'bg-white text-slate-900 border-white/20'
                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10',
                    ].join(' ')}
                    style={{ touchAction: 'manipulation' }}
                    aria-pressed={isSelected}
                  >
                    {MUSIC_PRESETS[p].label}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassSurface>

        {/* Haptics */}
        <GlassSurface className="p-3 mb-2">
          <div className="text-white/70 text-xs font-semibold mb-2">Haptics</div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-white text-sm font-semibold">Vibration</div>
              <div className="text-white/45 text-[11px]">
                {hapticsSupported ? 'Tactile feedback on taps.' : 'Not supported on this device/browser.'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleHaptics}
              disabled={!hapticsSupported}
              aria-pressed={hapticsEnabled}
              className={[
                'h-9 px-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]',
                !hapticsSupported
                  ? 'bg-white/5 text-white/35 border-white/10 opacity-60 cursor-not-allowed'
                  : hapticsEnabled
                    ? 'bg-purple-500/20 text-purple-100 border-purple-400/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10',
              ].join(' ')}
              style={{ touchAction: 'manipulation' }}
            >
              {hapticsEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </GlassSurface>

        {/* Logout */}
        <div className="mt-auto">
          <GlassSurface className="p-3">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-12 rounded-2xl bg-red-500/15 hover:bg-red-500/20 border border-red-400/30 text-red-100 font-black text-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ touchAction: 'manipulation' }}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </GlassSurface>
        </div>

        <ConfirmModal
          isOpen={showLogoutConfirm}
          title="Log out?"
          message="You'll return to the start screen."
          confirmText="Log out"
          cancelText="Cancel"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          danger
        />
      </div>
    </AppShell>
  );
}

export default SettingsPage;


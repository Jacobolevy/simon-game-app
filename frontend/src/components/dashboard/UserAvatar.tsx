import { UserIcon } from './icons';

export function UserAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 to-orange-500 border border-white/20 flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <UserIcon className="w-6 h-6 text-white" />
      )}
    </div>
  );
}


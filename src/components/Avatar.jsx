// Shared avatar component used across the app
// Shows photo if available, otherwise initials with color gradient
import { resolveAvatarBg } from './SettingsPage';

export default function Avatar({ profile, size = 36, style = {} }) {
  const initials = (profile?.initials || profile?.displayName?.[0] || '?').toUpperCase();
  const photoURL = profile?.photoURL;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: photoURL ? 'transparent' : resolveAvatarBg(profile?.avatarColor),
      color: '#fff', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 700,
      ...style,
    }}>
      {photoURL
        ? <img src={photoURL} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  );
}

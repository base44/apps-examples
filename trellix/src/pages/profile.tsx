import { useState } from 'react';
import { base44 } from '../sdk-client/base44-client';
import Icon from '../components/sidebar/icon';
import type { User } from '../types';

interface Props {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
}

export default function Profile({ user, onUpdate, onBack }: Props) {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await base44.auth.updateMe({ full_name: fullName });
    onUpdate(updated);
    setSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="back-btn" onClick={onBack}>← Back to boards</button>
        <h2>Profile</h2>

        <div className="profile-info">
          <div className="avatar">{(user.full_name || user.email)[0].toUpperCase()}</div>
          <p className="email">{user.email}</p>
          {user.role && <span className="role">{user.role}</span>}
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="profile-meta">
            <p><Icon name="calendar" size={14} /> Member since {new Date(user.created_date).toLocaleDateString()}</p>
            {user.is_verified && <p className="verified"><Icon name="check" size={14} /> Email verified</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

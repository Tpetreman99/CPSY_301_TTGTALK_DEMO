import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import Layout from '../components/Layout';
import { useSettings } from '../lib/SettingsContext';
import {
  subscribeToUserProfile,
  updateUserProfile,
  changePassword,
} from '../lib/chatService';

const AVATARS = [
  '👤','👩','👨','🧑','👩‍💼','👨‍💼','👩‍💻','👨‍💻',
  '👩‍🔬','👨‍🔬','👩‍🏫','👨‍🏫','🦊','🐱','🐶','🦁',
  '🐯','🐻','🦋','🌟','⚡','🔥','🎯','🚀',
];

const PRESENCE_OPTIONS = [
  { value: 'online', label: 'Available',        color: '#5a9e5a' },
  { value: 'busy',   label: 'Busy',             color: '#d93025' },
  { value: 'away',   label: 'Away',             color: '#f5a623' },
  { value: 'offline',label: 'Appear offline',   color: '#888'    },
];

export default function SettingsPage() {
  const router = useRouter();
  const { enterToSend, setEnterToSend } = useSettings();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile]           = useState(null);
  const [tab, setTab]                   = useState('profile');

  // Profile form state
  const [displayName, setDisplayName]   = useState('');
  const [avatar, setAvatar]             = useState('👤');
  const [status, setStatus]             = useState('');
  const [presence, setPresence]         = useState('online');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]     = useState('');

  // Password form state
  const [currentPw, setCurrentPw]       = useState('');
  const [newPw, setNewPw]               = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [pwSaving, setPwSaving]         = useState(false);
  const [pwMsg, setPwMsg]               = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/');
      else setFirebaseUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = subscribeToUserProfile(firebaseUser.uid, (p) => {
      setProfile(p);
      setDisplayName(p.displayName || '');
      setAvatar(p.avatar || '👤');
      setStatus(p.status || '');
      setPresence(p.presence || 'online');
    });
    return unsub;
  }, [firebaseUser]);

  const saveProfile = async () => {
    if (!firebaseUser) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateUserProfile(firebaseUser.uid, { displayName, avatar, status, presence });
      router.back();
    } catch (err) {
      setProfileMsg('Error: ' + err.message);
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    setPwMsg('');
    if (!newPw || !currentPw) { setPwMsg('Please fill in all fields.'); return; }
    if (newPw !== confirmPw)   { setPwMsg('New passwords do not match.'); return; }
    if (newPw.length < 6)      { setPwMsg('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await changePassword(firebaseUser, currentPw, newPw);
      router.back();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setPwMsg('Current password is incorrect.');
      } else {
        setPwMsg('Error: ' + err.message);
      }
      setPwSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header}>
          <h1 style={s.headerTitle}>Settings</h1>
        </div>

        <div style={s.body}>
          {/* Tab bar */}
          <div style={s.tabs}>
            {['profile', 'chat', 'security'].map((t) => (
              <button
                key={t}
                style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {tab === 'profile' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Profile</h2>

              <label style={s.label}>Display name</label>
              <input
                style={s.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />

              <label style={s.label}>Status message</label>
              <input
                style={s.input}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g. In a meeting"
              />

              <label style={s.label}>Presence</label>
              <div style={s.presenceRow}>
                {PRESENCE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    style={{
                      ...s.presenceOption,
                      ...(presence === opt.value ? s.presenceOptionActive : {}),
                    }}
                    onClick={() => setPresence(opt.value)}
                  >
                    <span style={{ ...s.presenceDot, backgroundColor: opt.color }} />
                    {opt.label}
                  </div>
                ))}
              </div>

              <label style={s.label}>Avatar</label>
              <div style={s.avatarGrid}>
                {AVATARS.map((em) => (
                  <span
                    key={em}
                    style={{ ...s.avatarOption, ...(avatar === em ? s.avatarOptionActive : {}) }}
                    onClick={() => setAvatar(em)}
                  >
                    {em}
                  </span>
                ))}
              </div>

              {profileMsg && (
                <p style={{ ...s.msg, ...(profileMsg.startsWith('Error') ? s.msgError : s.msgOk) }}>
                  {profileMsg}
                </p>
              )}
              <div style={s.btnRow}>
                <button style={s.cancelBtn} onClick={() => router.back()} disabled={profileSaving}>
                  Cancel
                </button>
                <button style={s.saveBtn} onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </div>
          )}

          {/* Chat preferences tab */}
          {tab === 'chat' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Chat preferences</h2>

              <div style={s.toggleRow}>
                <div>
                  <p style={s.toggleLabel}>Enter to send</p>
                  <p style={s.toggleSub}>
                    {enterToSend
                      ? 'Press Enter to send. Use Shift+Enter for a new line.'
                      : 'Press the Send button or Shift+Enter to send.'}
                  </p>
                </div>
                <div
                  style={{ ...s.toggle, ...(enterToSend ? s.toggleOn : {}) }}
                  onClick={() => setEnterToSend(!enterToSend)}
                >
                  <div style={{ ...s.toggleThumb, ...(enterToSend ? s.toggleThumbOn : {}) }} />
                </div>
              </div>
            </div>
          )}

          {/* Security tab */}
          {tab === 'security' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Change password</h2>

              <label style={s.label}>Current password</label>
              <input
                style={s.input}
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password"
              />

              <label style={s.label}>New password</label>
              <input
                style={s.input}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min. 6 characters)"
              />

              <label style={s.label}>Confirm new password</label>
              <input
                style={s.input}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
              />

              {pwMsg && (
                <p style={{ ...s.msg, ...(pwMsg.startsWith('Error') || pwMsg.includes('incorrect') || pwMsg.includes('match') || pwMsg.includes('least') ? s.msgError : s.msgOk) }}>
                  {pwMsg}
                </p>
              )}
              <div style={s.btnRow}>
                <button style={s.cancelBtn} onClick={() => router.back()} disabled={pwSaving}>
                  Cancel
                </button>
                <button style={s.saveBtn} onClick={savePassword} disabled={pwSaving}>
                  {pwSaving ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const DARK  = '#1a2744';
const ACCENT = '#7b7fd4';
const GREEN  = '#5a9e5a';

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f0f2f8',
  },
  header: {
    backgroundColor: GREEN,
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    margin: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 24,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    borderBottom: '2px solid #dde',
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    fontSize: 15,
    cursor: 'pointer',
    color: '#888',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: {
    color: DARK,
    borderBottom: `2px solid ${ACCENT}`,
    fontWeight: 'bold',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: DARK,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  },
  presenceRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  presenceOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 20,
    border: '1px solid #ddd',
    cursor: 'pointer',
    fontSize: 13,
    color: '#555',
  },
  presenceOptionActive: {
    borderColor: ACCENT,
    backgroundColor: '#eef0fb',
    color: DARK,
    fontWeight: 'bold',
  },
  presenceDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  avatarGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  avatarOption: {
    fontSize: 28,
    padding: 6,
    borderRadius: 8,
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  avatarOptionActive: {
    border: `2px solid ${ACCENT}`,
    backgroundColor: '#eef0fb',
  },
  msg: {
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 6,
    marginTop: 4,
  },
  msgOk: {
    backgroundColor: '#e6f4ea',
    color: '#2d6a4f',
  },
  msgError: {
    backgroundColor: '#fce8e6',
    color: '#d93025',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    padding: '11px 28px',
    backgroundColor: '#fff',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '11px 28px',
    backgroundColor: DARK,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid #eee',
    gap: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  toggleSub: {
    fontSize: 12,
    color: '#888',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleOn: {
    backgroundColor: ACCENT,
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'left 0.2s',
  },
  toggleThumbOn: {
    left: 23,
  },
};

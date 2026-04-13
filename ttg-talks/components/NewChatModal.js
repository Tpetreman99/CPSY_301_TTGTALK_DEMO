import { useState } from 'react';
import { createGroupConversation } from '../lib/chatService';

export default function NewChatModal({ users, currentUser, onClose, onOpenChat }) {
  const [tab, setTab] = useState('direct');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const filtered = users.filter(
    (u) =>
      u.id !== currentUser?.uid &&
      u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (user) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (selected.length < 1) return;
    setLoading(true);
    try {
      const memberIds = [currentUser.uid, ...selected.map((u) => u.id)];
      const conversationId = await createGroupConversation(memberIds, currentUser.uid);
      onOpenChat(conversationId, 'group');
      onClose();
    } catch (err) {
      console.error('Failed to create group', err);
      alert('Could not create group: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h3 style={s.title}>{tab === 'direct' ? 'New Chat' : 'New Group'}</h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'direct' ? s.tabActive : {}) }}
            onClick={() => { setTab('direct'); setSelected([]); }}
          >
            Direct
          </button>
          <button
            style={{ ...s.tab, ...(tab === 'group' ? s.tabActive : {}) }}
            onClick={() => { setTab('group'); setSelected([]); }}
          >
            Group
          </button>
        </div>

        <input
          style={s.search}
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div style={s.list}>
          {filtered.length === 0 && (
            <p style={s.empty}>No employees found</p>
          )}
          {filtered.map((user) => {
            const isSelected = selected.find((u) => u.id === user.id);
            return (
              <div
                key={user.id}
                style={{ ...s.userRow, ...(isSelected ? s.userRowSelected : {}) }}
                onClick={() => {
                  if (tab === 'direct') {
                    onOpenChat(user);
                    onClose();
                  } else {
                    toggleSelect(user);
                  }
                }}
              >
                <span style={s.avatar}>{user.avatar || '👤'}</span>
                <div style={s.userInfo}>
                  <p style={s.name}>{user.displayName}</p>
                  <p style={s.role}>{user.role}</p>
                </div>
                {tab === 'group' && (
                  <span style={s.checkbox}>{isSelected ? '✓' : ''}</span>
                )}
              </div>
            );
          })}
        </div>

        {tab === 'group' && (
          <div style={s.footer}>
            <p style={s.selectedCount}>
              {selected.length} participant{selected.length !== 1 ? 's' : ''} selected
            </p>
            <button
              style={{ ...s.createBtn, ...(selected.length === 0 ? s.createBtnDisabled : {}) }}
              onClick={handleCreateGroup}
              disabled={selected.length === 0 || loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const DARK = '#1a2744';

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 400,
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    borderBottom: '1px solid #eee',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#888',
    lineHeight: 1,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #eee',
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    fontSize: 14,
    cursor: 'pointer',
    color: '#888',
    fontWeight: '500',
  },
  tabActive: {
    color: DARK,
    borderBottom: `2px solid ${DARK}`,
    fontWeight: 'bold',
  },
  search: {
    margin: '12px 16px',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    padding: 20,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    gap: 12,
  },
  userRowSelected: {
    backgroundColor: '#eef0fb',
  },
  avatar: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: 14,
    color: DARK,
  },
  role: {
    margin: 0,
    fontSize: 12,
    color: '#888',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    border: '2px solid #7b7fd4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#7b7fd4',
    fontWeight: 'bold',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid #eee',
  },
  selectedCount: {
    margin: 0,
    fontSize: 13,
    color: '#666',
  },
  createBtn: {
    backgroundColor: DARK,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  createBtnDisabled: {
    backgroundColor: '#aaa',
    cursor: 'not-allowed',
  },
};

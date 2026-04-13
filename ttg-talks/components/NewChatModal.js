// this component is used for the pop up window when creating a new chat
import { useState } from 'react';
import { createOrGetDirectConversation, createGroupConversation } from '../lib/chatService';

export default function NewChatModal({ users, currentUser, onClose, onOpenChat }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const filtered = users.filter(u =>
    u.id !== currentUser?.uid &&
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const frequent = filtered.slice(0, 3);

  const toggleSelect = (user) => {
    setSelected(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const isSelected = (user) => selected.some(u => u.id === user.id);

  const handleStart = async () => {
    console.log('selected:', selected);
    console.log('selected.length:', selected.length);
    
    if (selected.length === 1) {
      console.log('opening direct chat');
      onOpenChat(selected[0]);
    } else if (selected.length > 1) {
      console.log('creating group chat');
      const memberIds = [
        currentUser.uid,
        ...selected.map(u => u.id),
      ];
      console.log('memberIds:', memberIds);
      const conversationId = await createGroupConversation(memberIds, currentUser.uid);
      console.log('conversationId:', conversationId);
      onOpenChat(conversationId, 'group');
    }
    onClose();
  };

  return (
    <div
      style={s.overlay}
      onClick={onClose}
    >
      <div
        style={s.modal}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>New chat:</span>
          <div style={s.searchBox}>
            <input
              autoFocus
              style={s.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
            />
            <span>🔍</span>
          </div>
        </div>
        {/* Frequent chats */}
        {!search && (
          <>
            <p style={s.sectionLabel}>Frequent chats:</p>
            <div style={s.frequentRow}>
              {frequent.map(u => (
                <div
                  key={u.id}
                  style={{
                    ...s.frequentCard,
                    ...(isSelected(u) ? s.frequentCardActive : {}),
                  }}
                  onClick={() => toggleSelect(u)}
                >
                  <span style={{ fontSize: 28 }}>{u.avatar}</span>
                  <p style={s.frequentName}>{u.displayName}</p>
                  <p style={s.frequentRole}>{u.role}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div style={s.chips}>
            {selected.map(u => (
              <div
                key={u.id}
                style={s.chip}
              >
                <span>{u.avatar}</span>
                <span style={s.chipName}>{u.displayName}</span>
                <span
                  style={s.chipX}
                  onClick={() => toggleSelect(u)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={s.divider} />

        {/* Search results */}
        {search.length > 0 && (
          <>
            <p style={s.sectionLabel}>Results:</p>
            <div style={s.list}>
              {filtered.map(u => (
                <div
                  key={u.id}
                  style={{
                    ...s.listRow,
                    ...(isSelected(u) ? s.listRowActive : {}),
                  }}
                  onClick={() => toggleSelect(u)}
                >
                  <span style={{ fontSize: 28 }}>{u.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <p style={s.listName}>{u.displayName}</p>
                    <p style={s.listRole}>{u.role}</p>
                  </div>
                  <div style={{
                    ...s.check,
                    ...(isSelected(u) ? s.checkActive : {}),
                  }}>
                    {isSelected(u) && (
                      <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <button
            style={s.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{
              ...s.startBtn,
              ...(selected.length === 0 ? s.startBtnDisabled : {}),
            }}
            disabled={selected.length === 0}
            onClick={handleStart}
          >
            Start chat
          </button>
        </div>

      </div>
    </div>
  );
}

const ACCENT = '#7b7fd4';
const DARK = '#1a2744';

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: '1.5rem',
    width: '100%',
    maxWidth: 480,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: '1rem',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: DARK,
    whiteSpace: 'nowrap',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#b0bccc',
    borderRadius: 20,
    padding: '6px 12px',
    height: 38,
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: '0.75rem',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dde4f0',
    border: '1px solid #b0bccc',
    borderRadius: 20,
    padding: '3px 10px 3px 6px',
    fontSize: 12,
    color: DARK,
  },
  chipName: {
    fontSize: 12,
    color: DARK,
  },
  chipX: {
    cursor: 'pointer',
    marginLeft: 4,
    fontSize: 16,
    color: '#888',
    lineHeight: 1,
  },
  divider: {
    borderTop: '1px solid #c8d0e0',
    marginBottom: '0.75rem',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#555',
    margin: '0 0 8px',
  },
  frequentRow: {
    display: 'flex',
    gap: 8,
    marginBottom: '1rem',
  },
  frequentCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #c8d0e0',
    borderRadius: 10,
    padding: '10px 8px',
    cursor: 'pointer',
    gap: 4,
    backgroundColor: '#dde4f0',
  },
  frequentCardActive: {
    borderColor: ACCENT,
    backgroundColor: '#c0cadf',
  },
  frequentName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK,
    margin: 0,
    textAlign: 'center',
  },
  frequentRole: {
    fontSize: 11,
    color: '#555',
    margin: 0,
    textAlign: 'center',
  },
  list: {
    maxHeight: 200,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    borderBottom: '1px solid #c8d0e0',
  },
  listRowActive: {
    backgroundColor: '#c0cadf',
  },
  listName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK,
  },
  listRole: {
    margin: 0,
    fontSize: 12,
    color: '#555',
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '1.5px solid #b0bccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: '1.25rem',
  },
  cancelBtn: {
    fontSize: 14,
    padding: '7px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #b0bccc',
    background: 'transparent',
    color: '#555',
  },
  startBtn: {
    fontSize: 14,
    padding: '7px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: ACCENT,
    color: '#fff',
  },
  startBtnDisabled: {
    opacity: 0.4,
    cursor: 'default',
  },
};

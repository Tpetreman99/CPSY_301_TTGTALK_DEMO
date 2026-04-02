import { useState } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { contacts, conversations } from '../lib/mockData';

export default function Layout({ children }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 0) {
      setSearchResults(contacts.filter(c =>
        c.name.toLowerCase().includes(text.toLowerCase())
      ));
    } else {
      setSearchResults([]);
    }
  };

  const openChat = (contact) => {
    setSearch('');
    setSearchResults([]);
    setSearchFocused(false);
    setActiveChat(contact.id);
    router.push(`/conversation/${contact.id}`);
  };

  const getLastMessage = (contactId) => {
    const msgs = conversations[contactId];
    if (!msgs || msgs.length === 0) return '';
    const last = msgs[msgs.length - 1];
    const sender = last.from === 'lemres'
      ? 'You'
      : contacts.find(c => c.id === last.from)?.name.split(' ')[0];
    return `${sender}: ${last.text}`;
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logoBox}>
          <span style={s.logoText}>TTG</span>
        </div>
        <button style={s.iconBtn}>＋</button>
        <button style={s.iconBtn}>⚙</button>
        <div style={{ flex: 1 }} />
        <button style={s.iconBtn} onClick={() => signOut(auth)}>⇥</button>
      </div>

      {/* Chat list */}
      <div style={s.chatList}>
        <div style={s.searchBar}>
          <input
            style={s.searchInput}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search"
          />
          <span>🔍</span>
        </div>

        {searchFocused && searchResults.length > 0 && (
          <div style={s.dropdown}>
            {searchResults.map(c => (
              <div key={c.id} style={s.dropItem} onClick={() => openChat(c)}>
                <span style={s.dropAvatar}>{c.avatar}</span>
                <div>
                  <p style={s.dropName}>{c.name}</p>
                  <p style={s.dropRole}>{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {contacts.map(contact => (
          <div
            key={contact.id}
            style={{ ...s.chatRow, ...(activeChat === contact.id ? s.chatRowActive : {}) }}
            onClick={() => openChat(contact)}
          >
            <span style={s.avatar}>{contact.avatar}</span>
            <div style={s.chatInfo}>
              <p style={s.chatName}>{contact.name}</p>
              <p style={s.chatPreview}>{getLastMessage(contact.id)}</p>
            </div>
            <span style={s.dots}>•••</span>
          </div>
        ))}
      </div>

      {/* Page content slots in here */}
      <div style={s.main}>
        {children}
      </div>
    </div>
  );
}

const ACCENT = '#7b7fd4';
const GREEN = '#5a9e5a';
const DARK = '#1a2744';

const s = {
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f0f2f8',
  },
  sidebar: {
    width: 72,
    backgroundColor: DARK,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
    gap: 16,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    border: '2px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 22,
    cursor: 'pointer',
  },
  chatList: {
    width: 300,
    backgroundColor: '#dde4f0',
    paddingTop: 12,
    overflowY: 'auto',
    position: 'relative',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#b0bccc',
    borderRadius: 20,
    margin: '0 12px 8px',
    padding: '0 12px',
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
  dropdown: {
    position: 'absolute',
    top: 54,
    left: 12,
    right: 12,
    zIndex: 99,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },
  dropAvatar: {
    fontSize: 24,
  },
  dropName: {
    fontWeight: 'bold',
    fontSize: 14,
    margin: 0,
  },
  dropRole: {
    color: '#888',
    fontSize: 12,
    margin: 0,
  },
  chatRow: {
    display: 'flex',
    alignItems: 'center',
    padding: 12,
    borderBottom: '1px solid #c8d0e0',
    cursor: 'pointer',
  },
  chatRowActive: {
    backgroundColor: '#c0cadf',
  },
  avatar: {
    fontSize: 30,
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: DARK,
    margin: 0,
  },
  chatPreview: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dots: {
    color: '#888',
    fontSize: 10,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
};
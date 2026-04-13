import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { getAllUsers, createOrGetDirectConversation } from '../lib/chatService';
import Layout from '../components/Layout';
import NewChatModal from '../components/NewChatModal';

export default function HomePage() {
  const router = useRouter();
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    async function loadUsers() {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    }
    loadUsers();
  }, []);

  const openChat = async (contactOrId, type) => {
    if (!currentUser) return;

    try {
      let conversationId;

      if (type === 'group') {
        conversationId = contactOrId;
      } else {
        conversationId = await createOrGetDirectConversation(currentUser.uid, contactOrId.id);
      }

      router.push(`/conversation/${conversationId}`);
    } catch (err) {
      console.error('Failed to open chat', err);
    }
  };

  return (
    <Layout>
      <div style={s.header}>
        <h1 style={s.headerTitle}>TTG TALKS</h1>
      </div>

      <div style={s.welcome}>
        <h2 style={s.welcomeTitle}>Welcome back!</h2>
        <p style={s.welcomeSub}>You have 28 unread messages</p>

        <div style={s.actions}>
          <div style={s.actionBtn} onClick={() => setShowNewChat(true)}>
            <span style={s.actionIcon}>＋</span>
            <span style={s.actionLabel}>Create chat</span>
          </div>

          <div style={s.actionBtn} onClick={() => router.push('/settings')}>
            <span style={s.actionIcon}>⚙</span>
            <span style={s.actionLabel}>Settings</span>
          </div>

          <div style={s.actionBtn} onClick={() => setShowLogoutConfirm(true)}>
            <span style={s.actionIcon}>⇥</span>
            <span style={s.actionLabel}>Log out</span>
          </div>
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowNewChat(false)}
          onOpenChat={openChat}
        />
      )}
    </Layout>
  );
}

const ACCENT = "#7b7fd4";
const GREEN = "#5a9e5a";

const s = {
  header: {
    backgroundColor: GREEN,
    padding: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    margin: 0,
  },
  welcome: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 40,
    color: ACCENT,
    fontStyle: "italic",
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 20,
    color: ACCENT,
    marginBottom: 48,
  },
  actions: {
    display: "flex",
    gap: 24,
  },
  actionBtn: {
    width: 140,
    height: 140,
    backgroundColor: "#e8eaf6",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    cursor: "pointer",
  },
  actionIcon: {
    fontSize: 40,
    color: ACCENT,
  },
  actionLabel: {
    color: ACCENT,
    fontSize: 16,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    width: 320,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  confirmTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2744',
  },
  confirmText: {
    margin: 0,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  confirmActions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    padding: '10px 24px',
    borderRadius: 8,
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    color: '#333',
  },
  logoutBtn: {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#d93025',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

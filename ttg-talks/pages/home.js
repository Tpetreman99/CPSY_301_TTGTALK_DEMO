import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import Layout from "../components/Layout";
import NewChatModal from "../components/NewChatModal";
import { getAllUsers, createOrGetDirectConversation } from "../lib/chatService";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const openChat = async (contactOrId, type) => {
    try {
      let conversationId;
      if (type === "group") {
        conversationId = contactOrId;
      } else {
        conversationId = await createOrGetDirectConversation(user.uid, contactOrId.id);
      }
      router.push(`/conversation/${conversationId}`);
    } catch (err) {
      console.error("Failed to open chat", err);
      alert("Could not open chat: " + err.message);
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

      {showLogoutConfirm && (
        <div style={s.overlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.confirmTitle}>Log out</h3>
            <p style={s.confirmText}>Are you sure you want to log out?</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button style={s.logoutBtn} onClick={() => signOut(auth)}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewChat && (
        <NewChatModal
          users={users}
          currentUser={user}
          onClose={() => setShowNewChat(false)}
          onOpenChat={openChat}
        />
      )}
    </Layout>
  );
}


const GREEN = "#7BB863";
const LPURPLE = "#ACB3F4";


const s = {
  header: {
    backgroundColor: GREEN,
    padding: 18
    
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
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
    color: LPURPLE,
    fontSize: 50,
    fontStyle: "italic",
    marginBottom: 8,
  },
  welcomeSub: {
    color:LPURPLE,
    fontSize: 30,
    marginBottom: 48,
  },
  actions: {
    display: "flex",
    gap: 24,
  },
  actionBtn: {
    border: '2px solid #ACB3F4',
    width: 200,
    height: 200,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    boxShadow: '0 4px 16px #121616',
  },
  actionIcon: {
    fontSize: 100,
    color: LPURPLE,
  },
  actionLabel: {
    color:LPURPLE,
    fontSize: 20,
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

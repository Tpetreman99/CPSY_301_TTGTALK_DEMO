import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getAllUsers,
  createOrGetDirectConversation,
  subscribeToConversationPreviews,
  hideConversation,
  deleteConversation,
  deleteGroupConversation,
} from "../lib/chatService";
import logo from "../assets/images/ttglogo.png";
import NewChatModal from "./NewChatModal";

export default function Layout({ children }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    }
    loadUsers();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToConversationPreviews(
      currentUser.uid,
      (convos) => {
        setConversations(convos);
      },
    );
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 0) {
      setSearchResults(
        users.filter((u) =>
          u.displayName?.toLowerCase().includes(text.toLowerCase()),
        ),
      );
    } else {
      setSearchResults([]);
    }
  };

  const openChat = async (contactOrId, type) => {
    if (!currentUser) return;
    try {
      let conversationId;
      if (type === "group") {
        conversationId = contactOrId;
      } else {
        conversationId = await createOrGetDirectConversation(
          currentUser.uid,
          contactOrId.id,
        );
        setActiveChat(contactOrId.id);
      }
      setSearch("");
      setSearchResults([]);
      setSearchFocused(false);
      router.push(`/conversation/${conversationId}`);
    } catch (err) {
      console.error("Failed to open chat", err);
      alert("Could not open chat: " + err.message);
    }
  };

  const handleHideChat = async (conversationId) => {
    try {
      await hideConversation(conversationId, currentUser.uid);
      if (router.query.id === conversationId) router.push("/home");
    } catch (err) {
      console.error("Failed to hide chat", err);
      alert("Could not hide chat: " + err.message);
    }
  };

  const handleDeleteChat = async (conversationId) => {
    if (
      !confirm(
        "Remove this chat from your list? The other participants will not be affected.",
      )
    )
      return;
    try {
      await deleteConversation(conversationId, currentUser.uid);
      if (router.query.id === conversationId) router.push("/home");
    } catch (err) {
      console.error("Failed to delete chat", err);
      alert("Could not delete chat: " + err.message);
    }
  };

  const handleDeleteGroup = async (conversationId) => {
    if (!confirm("Delete this group for everyone? This cannot be undone."))
      return;
    try {
      await deleteGroupConversation(conversationId);
      if (router.query.id === conversationId) router.push("/home");
    } catch (err) {
      console.error("Failed to delete group", err);
      alert("Could not delete group: " + err.message);
    }
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logoBox}>
          <button
            onClick={() => router.push("../home")}
            style={{ background: "none", border: "none" }}
          >
            <img src={logo.src} width={70} alt="TTG Logo" />
          </button>
        </div>
        <button style={s.iconBtn} onClick={() => setShowNewChat(true)}>
          ＋
        </button>
        <button style={s.iconBtn} onClick={() => router.push('/settings')}>⚙</button>
        <div style={{ flex: 1 }} />
        <button style={s.iconBtn} onClick={() => signOut(auth)}>
          ⇥
        </button>
      </div>

      {/* Chat list */}
      <div style={s.chatList}>
        <div style={s.searchBar}>
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search"
          />
          <span>🔍</span>
        </div>

        {searchFocused && searchResults.length > 0 && (
          <div style={s.dropdown}>
            {searchResults.map((c) => (
              <div
                key={c.id}
                style={s.dropItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => openChat(c)}
              >
                <span style={s.dropAvatar}>{c.avatar}</span>
                <div>
                  <p style={s.dropName}>{c.displayName}</p>
                  <p style={s.dropRole}>{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {conversations.map((convo) => {
          if (convo.type === "group") {
            const memberNames = convo.memberIds
              .filter((id) => id !== currentUser?.uid)
              .map((id) => {
                const user = users.find((u) => u.id === id);
                return user ? user.displayName : "";
              })
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={convo.conversationId}
                style={{ ...s.chatRow, position: "relative" }}
                onClick={() =>
                  router.push(`/conversation/${convo.conversationId}`)
                }
              >
                <span style={s.avatar}>👥</span>
                <div style={s.chatInfo}>
                  <p style={s.chatName}>{memberNames || "Group chat"}</p>
                  <p style={s.chatPreview}>{convo.lastMessageText}</p>
                </div>
                <span
                  style={s.dots}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(
                      menuOpenId === convo.conversationId
                        ? null
                        : convo.conversationId,
                    );
                  }}
                >
                  •••
                </span>
                {menuOpenId === convo.conversationId && (
                  <div style={s.chatMenu}>
                    {[
                      { label: "📦  Archive chat" },
                      { label: "✉️  Mark as unread" },
                      { label: "📄  Generate report" },
                      {
                        label: "🙈  Hide chat",
                        action: () => handleHideChat(convo.conversationId),
                      },
                      ...(convo.createdBy === currentUser?.uid ||
                      convo.admins?.includes(currentUser?.uid)
                        ? [
                            {
                              label: "🗑️  Delete group",
                              danger: true,
                              action: () =>
                                handleDeleteGroup(convo.conversationId),
                            },
                          ]
                        : []),
                    ].map(({ label, danger, action }) => (
                      <div
                        key={label}
                        style={{
                          ...s.chatMenuItem,
                          ...(danger ? s.chatMenuItemDanger : {}),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          action?.();
                        }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const contact = users.find((u) => u.id === convo.otherUserId);
          if (!contact) return null;

          return (
            <div
              key={convo.conversationId}
              style={{
                ...s.chatRow,
                position: "relative",
                ...(activeChat === contact.id ? s.chatRowActive : {}),
              }}
              onClick={() => openChat(contact)}
            >
              <div style={s.avatarWrap}>
                <span style={s.avatar}>{contact.avatar}</span>
                <span style={{ ...s.presenceDot, backgroundColor: PRESENCE_COLORS[contact.presence] || PRESENCE_COLORS.offline }} />
              </div>
              <div style={s.chatInfo}>
                <p style={s.chatName}>{contact.displayName}</p>
                <p style={s.chatPreview}>
                  {contact.status ? `${contact.status} · ` : ''}{convo.lastMessageText}
                </p>
              </div>
              <span
                style={s.dots}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(
                    menuOpenId === convo.conversationId
                      ? null
                      : convo.conversationId,
                  );
                }}
              >
                •••
              </span>
              {menuOpenId === convo.conversationId && (
                <div style={s.chatMenu}>
                  {[
                    { label: "📦  Archive chat" },
                    { label: "✉️  Mark as unread" },
                    { label: "📄  Generate report" },
                    {
                      label: "🙈  Hide chat",
                      action: () => handleHideChat(convo.conversationId),
                    },
                    {
                      label: "🗑️  Delete chat",
                      danger: true,
                      action: () => handleDeleteChat(convo.conversationId),
                    },
                  ].map(({ label, danger, action }) => (
                    <div
                      key={label}
                      style={{
                        ...s.chatMenuItem,
                        ...(danger ? s.chatMenuItemDanger : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(null);
                        action?.();
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Page content */}
      <div style={s.main}>{children}</div>

      {showNewChat && (
        <NewChatModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowNewChat(false)}
          onOpenChat={openChat}
        />
      )}
    </div>
  );
}

const DARK = "#1a2744";

const PRESENCE_COLORS = {
  online:  '#5a9e5a',
  busy:    '#d93025',
  away:    '#f5a623',
  offline: '#aaaaaa',
};

const s = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f0f2f8",
  },
  sidebar: {
    width: 72,
    backgroundColor: DARK,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    gap: 16,
  },
  logoBox: {
    paddingTop: 20,
    paddingBottom: 20,
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 50,
    cursor: "pointer",
  },
  chatList: {
    width: 300,
    backgroundColor: "#dde4f0",
    paddingTop: 12,
    overflowY: "auto",
    position: "relative",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#b0bccc",
    borderRadius: 20,
    margin: "0 12px 8px",
    padding: "0 12px",
    height: 38,
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  dropdown: {
    position: "absolute",
    top: 54,
    left: 12,
    right: 12,
    zIndex: 99,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderBottom: "1px solid #eee",
    cursor: "pointer",
  },
  dropAvatar: {
    fontSize: 24,
  },
  dropName: {
    fontWeight: "bold",
    fontSize: 14,
    margin: 0,
  },
  dropRole: {
    color: "#888",
    fontSize: 12,
    margin: 0,
  },
  chatRow: {
    display: "flex",
    alignItems: "center",
    padding: 12,
    borderBottom: "1px solid #c8d0e0",
    cursor: "pointer",
  },
  chatRowActive: {
    backgroundColor: "#c0cadf",
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
    flexShrink: 0,
  },
  avatar: {
    fontSize: 30,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid #dde4f0',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 14,
    color: DARK,
    margin: 0,
  },
  chatPreview: {
    color: "#555",
    fontSize: 12,
    marginTop: 2,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dots: {
    color: "#888",
    fontSize: 14,
    padding: "4px 6px",
    borderRadius: 4,
    cursor: "pointer",
    userSelect: "none",
  },
  chatMenu: {
    position: "absolute",
    right: 8,
    top: 36,
    zIndex: 100,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    minWidth: 160,
    overflow: "hidden",
  },
  chatMenuItem: {
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
    color: "#222",
  },
  chatMenuItemDanger: {
    color: "#d93025",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
};

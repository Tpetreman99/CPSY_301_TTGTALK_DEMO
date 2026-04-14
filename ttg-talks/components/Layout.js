import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  createOrGetDirectConversation,
  subscribeToConversationPreviews,
  subscribeToUsers,
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
    const unsubscribe = subscribeToUsers((allUsers) => {
      setUsers(allUsers);
    });
    return () => unsubscribe();
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
    ) {
      return;
    }
    try {
      await deleteConversation(conversationId, currentUser.uid);
      if (router.query.id === conversationId) router.push("/home");
    } catch (err) {
      console.error("Failed to delete chat", err);
      alert("Could not delete chat: " + err.message);
    }
  };

  const handleDeleteGroup = async (conversationId) => {
    if (!confirm("Delete this group for everyone? This cannot be undone.")) {
      return;
    }
    try {
      await deleteGroupConversation(conversationId);
      if (router.query.id === conversationId) router.push("/home");
    } catch (err) {
      console.error("Failed to delete group", err);
      alert("Could not delete group: " + err.message);
    }
  };

  const truncateMessageText = (text) => {
    if (!text) return "";
    return text.length > 20 ? `${text.slice(0, 20)}...` : text;
  };

  const getGroupDisplayName = (convo) => {
    if (convo.groupName) return convo.groupName;
    const memberNames = convo.memberIds
      .filter((id) => id !== currentUser?.uid)
      .map((id) => {
        const user = users.find((u) => u.id === id);
        return user ? user.displayName : "";
      })
      .filter(Boolean)
      .join(", ");
    return memberNames.length > 30
      ? memberNames.slice(0, 30) + "..."
      : memberNames || "Group chat";
  };

  const currentUserProfile = users.find((u) => u.id === currentUser?.uid);

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.logoBox}>
          <button
            onClick={() => router.push("../home")}
            style={{ background: "none", border: "none" }}
          >
            <img src={logo.src} width={70} alt="TTG Logo" />
          </button>
        </div>
        {currentUserProfile && (
          <div style={s.sidebarPresence}>
            <div style={s.avatarWrap}>
              <span style={s.avatar}>{currentUserProfile.avatar || "👤"}</span>
              <span
                style={{
                  ...s.presenceDot,
                  backgroundColor:
                    PRESENCE_COLORS[currentUserProfile.presence] ||
                    PRESENCE_COLORS.offline,
                  border: "2px solid #1a2744",
                }}
              />
            </div>
          </div>
        )}
        <button style={s.iconBtn} onClick={() => setShowNewChat(true)}>
          ＋
        </button>
        <button style={s.iconBtn} onClick={() => router.push("/settings")}>
          ⚙
        </button>
        <div style={{ flex: 1 }} />
        <button style={s.iconBtn} onClick={() => signOut(auth)}>
          ⇥
        </button>
      </div>

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
                <div style={s.avatarWrap}>
                  <span style={s.dropAvatar}>{c.avatar || "👤"}</span>
                  <span
                    style={{
                      ...s.presenceDot,
                      backgroundColor:
                        PRESENCE_COLORS[c.presence] ||
                        PRESENCE_COLORS.offline,
                    }}
                  />
                </div>
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
            return (
              <div
                key={convo.conversationId}
                style={{
                  ...s.chatRow,
                  position: "relative",
                  ...(router.query.id === convo.conversationId
                    ? s.chatRowActive
                    : {}),
                }}
                onClick={() =>
                  router.push(`/conversation/${convo.conversationId}`)
                }
              >
                <span style={{ ...s.avatar, marginRight: 10 }}>👥</span>
                <div style={s.chatInfo}>
                  <p style={s.chatName}>{getGroupDisplayName(convo)}</p>
                  <p style={s.chatPreview}>
                    {truncateMessageText(convo.lastMessageText)}
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
                ...(router.query.id === convo.conversationId
                  ? s.chatRowActive
                  : {}),
              }}
              onClick={() => openChat(contact)}
            >
              <div style={s.avatarWrap}>
                <span style={s.avatar}>{contact.avatar || "👤"}</span>
                <span
                  style={{
                    ...s.presenceDot,
                    backgroundColor:
                      PRESENCE_COLORS[contact.presence] ||
                      PRESENCE_COLORS.offline,
                  }}
                />
              </div>
              <div style={s.chatInfo}>
                <p style={s.chatName}>{contact.displayName}</p>
                <p style={s.chatPreview}>
                  {contact.status ? `${contact.status} · ` : ""}
                  {truncateMessageText(convo.lastMessageText)}
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

const DARK = "#333";
const TEXT = "#FFF";
const FONT = "Arial";



const PRESENCE_COLORS = {
  online: "#5a9e5a",
  busy: "#d93025",
  away: "#f5a623",
  offline: "#aaaaaa",
};

const s = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: DARK,
  },
  sidebar: {
    width: 75,
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
  sidebarPresence: {
    minHeight: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatList: {
    border: "2px solid #fff",
    color: "#fff",
    width: 400,
    backgroundColor: "#333",
    paddingTop: 12,
    overflowY: "auto",
    position: "relative",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#CBC8C8",
    borderRadius: 20,
    margin: "0 12px 8px",
    padding: "0 12px",
    height: 38,
    boxShadow: '0 4px 16px #121616'
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    color: DARK,
    fontSize: 14,
    outline: "none",
  },
  dropdown: {
    color: TEXT,
    position: "absolute",
    top: 54,
    left: 12,
    right: 12,
    zIndex: 99,
    backgroundColor: DARK,
    borderRadius: 8,
     boxShadow: '0 4px 16px #121616',
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderBottom: "1px solid #fff",
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
    padding: 15,
    borderBottom: "2px solid  #555",
    cursor: "pointer",
  },
  chatRowActive: {
    backgroundColor: "#555",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 10,
    flexShrink: 0,
  },
  avatar: {
    fontSize: 30,
  },
  presenceDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: "50%",
    border: "2px solid #dde4f0",
  },
  chatInfo: {
    flex: 1,
    borderWidth: 2,
    bordercolor: TEXT,
  },
  chatName: {
    fontFamily: FONT,
    fontWeight: "bold",
    fontSize: 18,
    color: TEXT,
    margin: 0,
  },
  chatPreview: {
    color:" #BEBFC5",
    fontSize: 12,
    marginTop: 2,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dots: {
    color: "#fff",
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
    backgroundColor: DARK,
    borderRadius: 8,
    boxShadow: "0 4px 16px #121616",
    minWidth: 160,
    overflow: "hidden",
  },
  chatMenuItem: {
    color: TEXT,
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    borderBottom: "2px solid #555",
  },
  chatMenuItemDanger: {
    color: "#d93025",
  },
  main: {
    fontFamily: TEXT,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
};
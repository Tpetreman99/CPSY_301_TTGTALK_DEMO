import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebaseConfig";
import Layout from "../../components/Layout";
import { useSettings } from "../../lib/SettingsContext";
import {
  subscribeToUsers,
  sendMessage,
  addMemberToConversation,
  removeMemberFromConversation,
  subscribeToMessages,
  deleteMessage,
  editMessage,
} from "../../lib/chatService";

export default function ConversationPage() {
  const router = useRouter();
  const { id: chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [menuMsgId, setMenuMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const { enterToSend } = useSettings();
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((allUsers) => {
      setUsers(allUsers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, "conversations", chatId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setConversation({
        id: snap.id,
        ...data,
        type:
          data.type === "group" && data.memberIds?.length === 2
            ? "direct"
            : data.type,
      });
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !chatId) return;
    try {
      await sendMessage(chatId, user.uid, input.trim());
      setInput("");
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleAddMember = async (newUser) => {
    try {
      await addMemberToConversation(chatId, newUser.id, user.uid);
      setAddSearch("");
    } catch (err) {
      alert("Could not add member: " + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Remove this member from the conversation?")) return;
    try {
      await removeMemberFromConversation(chatId, memberId);
    } catch (err) {
      alert("Could not remove member: " + err.message);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm("Delete this message?")) return;
    setMenuMsgId(null);
    try {
      await deleteMessage(msgId);
    } catch (err) {
      alert("Could not delete message: " + err.message);
    }
  };

  const handleStartEdit = (msg) => {
    setMenuMsgId(null);
    setEditingMsgId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    try {
      await editMessage(editingMsgId, editText);
      setEditingMsgId(null);
      setEditText("");
    } catch (err) {
      alert("Could not edit message: " + err.message);
    }
  };

  const handleSaveGroupName = async () => {
    try {
      await updateDoc(doc(db, "conversations", chatId), {
        groupName: nameInput.trim(),
      });
      setEditingName(false);
    } catch (err) {
      alert("Could not update group name: " + err.message);
    }
  };

  const otherMembers =
    conversation?.memberIds?.filter((id) => id !== user?.uid) ?? [];

  const headerName = conversation?.groupName
    ? conversation.groupName
    : otherMembers
        .map((id) => users.find((u) => u.id === id)?.displayName ?? "...")
        .join(", ") || "Chat";

  const directRecipient =
    otherMembers.length === 1
      ? users.find((u) => u.id === otherMembers[0]) || null
      : null;

  const isGroup = conversation?.type === "group";
  const isAdmin =
    conversation?.createdBy === user?.uid ||
    conversation?.admins?.includes(user?.uid);

  const addablUsers = users.filter(
    (u) =>
      u.id !== user?.uid &&
      !conversation?.memberIds?.includes(u.id) &&
      u.displayName?.toLowerCase().includes(addSearch.toLowerCase())
  );

  if (!chatId) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header} onClick={() => setHeaderOpen((o) => !o)}>
          <div style={s.headerInner}>
            <span style={s.avatar}>
              {isGroup ? "👥" : directRecipient?.avatar || "👤"}
            </span>
            <p style={s.name}>{headerName}</p>
          </div>
          <span style={s.chevron}>{headerOpen ? "▲" : "▼"}</span>
        </div>

        {headerOpen && conversation && (
          <div style={s.panel}>

            {/* Group name section */}
            {isGroup && (
              <>
                <p style={s.panelSection}>Group name</p>
                {editingName ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      style={s.addSearch}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter group name..."
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveGroupName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      autoFocus
                    />
                    <button
                      style={s.editSaveBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveGroupName();
                      }}
                    >
                      Save
                    </button>
                    <button
                      style={s.editCancelBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingName(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    style={{ ...s.addRow, justifyContent: "space-between" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNameInput(conversation.groupName || "");
                      setEditingName(true);
                    }}
                  >
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      color: conversation.groupName ? DARK : "#aaa",
                    }}>
                      {conversation.groupName || "No name set — click to add one"}
                    </p>
                    <span style={{ color: ACCENT, fontSize: 13 }}>✏️</span>
                  </div>
                )}
              </>
            )}

            <p style={s.panelSection}>Members</p>
            {conversation.memberIds.map((memberId) => {
              const member = users.find((u) => u.id === memberId);
              if (!member) return null;
              const isSelf = memberId === user?.uid;
              const isCreator = memberId === conversation.createdBy;
              return (
                <div key={memberId} style={s.memberRow}>
                  <span style={s.memberAvatar}>{member.avatar || "👤"}</span>
                  <div style={s.memberInfo}>
                    <p style={s.memberName}>
                      {member.displayName}
                      {isSelf ? " (you)" : ""}
                      {isCreator ? " · Admin" : ""}
                    </p>
                    <p style={s.memberRole}>{member.role}</p>
                  </div>
                  {isGroup && isAdmin && !isSelf && !isCreator && (
                    <button
                      style={s.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMember(memberId);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}

            <p style={s.panelSection}>
              {isGroup ? "Add member" : "Add member (creates group)"}
            </p>
            <input
              style={s.addSearch}
              placeholder="Search employees..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {addSearch.length > 0 && (
              <div style={s.addList}>
                {addablUsers.length === 0 && (
                  <p style={s.noResults}>No employees found</p>
                )}
                {addablUsers.map((u) => (
                  <div
                    key={u.id}
                    style={s.addRow}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMember(u);
                    }}
                  >
                    <span style={s.memberAvatar}>{u.avatar || "👤"}</span>
                    <div style={s.memberInfo}>
                      <p style={s.memberName}>{u.displayName}</p>
                      <p style={s.memberRole}>{u.role}</p>
                    </div>
                    <span style={s.addIcon}>＋</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          style={s.msgList}
          onClick={() => {
            setHeaderOpen(false);
            setMenuMsgId(null);
          }}
        >
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const sender = users.find((u) => u.id === msg.senderId);
            const isEditing = editingMsgId === msg.id;
            const menuOpen = menuMsgId === msg.id;
            return (
              <div
                key={msg.id}
                style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}
              >
                {isMe && !isEditing && (
                  <div style={s.msgMenuWrap}>
                    <span
                      style={s.msgMenuBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuMsgId(menuOpen ? null : msg.id);
                      }}
                    >
                      ⋮
                    </span>
                    {menuOpen && (
                      <div style={s.msgMenu}>
                        <div
                          style={s.msgMenuItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(msg);
                          }}
                        >
                          ✏️  Edit
                        </div>
                        <div
                          style={{ ...s.msgMenuItem, ...s.msgMenuItemDanger }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                        >
                          🗑️  Delete
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}
                >
                  {isGroup && !isMe && (
                    <p style={s.senderName}>{sender?.displayName ?? ""}</p>
                  )}
                  {isEditing ? (
                    <div>
                      <textarea
                        style={s.editInput}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          }
                          if (e.key === "Escape") {
                            setEditingMsgId(null);
                            setEditText("");
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={s.editActions}>
                        <button
                          style={s.editCancelBtn}
                          onClick={() => {
                            setEditingMsgId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </button>
                        <button style={s.editSaveBtn} onClick={handleSaveEdit}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ ...s.msgText, ...(isMe ? s.msgTextMe : {}) }}>
                      {msg.text}
                    </p>
                  )}
                  <p style={s.msgTime}>
                    {msg.createdAt
                      ?.toDate()
                      .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    {msg.editedAt ? "  · edited" : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && enterToSend) send();
            }}
            placeholder="Type a message..."
          />
          <button style={s.sendBtn} onClick={send}>
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
}

const ACCENT = "#7b7fd4";
const GREEN = "#5a9e5a";
const DARK = "#1a2744";

const s = {
  root: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: GREEN,
    padding: "12px 16px",
    cursor: "pointer",
    userSelect: "none",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    fontSize: 22,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    margin: 0,
  },
  chevron: {
    color: "#fff",
    fontSize: 12,
  },
  panel: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #dde",
    padding: "12px 16px",
    maxHeight: 340,
    overflowY: "auto",
  },
  panelSection: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    margin: "12px 0 6px",
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  memberAvatar: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    margin: 0,
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
  },
  memberRole: {
    margin: 0,
    fontSize: 12,
    color: "#888",
  },
  removeBtn: {
    fontSize: 12,
    color: "#d93025",
    background: "none",
    border: "1px solid #d93025",
    borderRadius: 6,
    padding: "3px 8px",
    cursor: "pointer",
  },
  addSearch: {
    width: "100%",
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  addList: {
    marginTop: 6,
  },
  noResults: {
    color: "#aaa",
    fontSize: 13,
    margin: "8px 0",
  },
  addRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 4px",
    borderRadius: 6,
    cursor: "pointer",
  },
  addIcon: {
    fontSize: 18,
    color: ACCENT,
    fontWeight: "bold",
  },
  msgList: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  msgRow: {
    display: "flex",
  },
  msgRowMe: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "65%",
    borderRadius: 12,
    padding: 10,
  },
  bubbleThem: {
    backgroundColor: "#fff",
  },
  bubbleMe: {
    backgroundColor: ACCENT,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "bold",
    color: ACCENT,
    margin: "0 0 3px",
  },
  msgText: {
    color: DARK,
    fontSize: 14,
    margin: 0,
  },
  msgTextMe: {
    color: "#fff",
  },
  msgTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  inputRow: {
    display: "flex",
    padding: 12,
    gap: 8,
    borderTop: "1px solid #dde",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f8",
    borderRadius: 20,
    border: "none",
    padding: "8px 16px",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    border: "none",
    padding: "8px 20px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  msgMenuWrap: {
    position: "relative",
    alignSelf: "flex-start",
    marginTop: 6,
    marginRight: 6,
    flexShrink: 0,
  },
  msgMenuBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    cursor: "pointer",
    userSelect: "none",
    borderRadius: 6,
    backgroundColor: "#e8eaf6",
    border: "1px solid #c5c8e8",
  },
  msgMenu: {
    position: "absolute",
    top: 32,
    right: 0,
    zIndex: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    minWidth: 120,
    overflow: "hidden",
  },
  msgMenuItem: {
    padding: "9px 14px",
    fontSize: 13,
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
    color: "#222",
    whiteSpace: "nowrap",
  },
  msgMenuItemDanger: {
    color: "#d93025",
  },
  editInput: {
    width: "100%",
    minWidth: 180,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  editActions: {
    display: "flex",
    gap: 6,
    marginTop: 6,
    justifyContent: "flex-end",
  },
  editCancelBtn: {
    padding: "4px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#555",
  },
  editSaveBtn: {
    padding: "4px 12px",
    borderRadius: 6,
    border: "none",
    background: ACCENT,
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    cursor: "pointer",
  },
};
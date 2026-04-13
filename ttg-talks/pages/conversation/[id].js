import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
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
  const { id } = router.query;

  const [currentUser, setCurrentUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const [groupMembers, setGroupMembers] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      setCurrentUser(user);
    });

    return unsub;
  }, [router]);

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
    async function loadConversation() {
      if (!id || !currentUser) return;

      const conversationData = await getConversationById(id);
      if (!conversationData) return;

      setConversation(conversationData);

      if (conversationData.type === 'direct') {
        const otherUserId = conversationData.memberIds.find(
          memberId => memberId !== currentUser.uid
        );
        if (otherUserId) {
          const otherUser = await getUserById(otherUserId);
          setChatUser(otherUser);
        }
      } else if (conversationData.type === 'group') {
        const members = await Promise.all(
          conversationData.memberIds
            .filter(memberId => memberId !== currentUser.uid)
            .map(memberId => getUserById(memberId))
        );
        setGroupMembers(members);
      }
    }

    loadConversation();
  }, [id, currentUser, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate();

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const otherMembers = conversation?.memberIds?.filter((id) => id !== user?.uid) ?? [];
  const headerName = otherMembers
    .map((id) => users.find((u) => u.id === id)?.displayName ?? "...")
    .join(", ") || "Chat";
  const directRecipient =
    otherMembers.length === 1
      ? users.find((u) => u.id === otherMembers[0]) || null
      : null;

    await sendMessage(id, currentUser.uid, input);

  const addablUsers = users.filter(
    (u) =>
      u.id !== user?.uid &&
      !conversation?.memberIds?.includes(u.id) &&
      u.displayName?.toLowerCase().includes(addSearch.toLowerCase())
  );

  if (!conversation) return null;
  if (conversation.type === 'direct' && !chatUser) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header} onClick={() => setHeaderOpen((o) => !o)}>
          <div style={s.headerInner}>
            <span style={s.avatar}>{isGroup ? "👥" : directRecipient?.avatar || "👤"}</span>
            <p style={s.name}>{headerName}</p>
          </div>
          <span style={s.chevron}>{headerOpen ? "▲" : "▼"}</span>
        </div>

        {headerOpen && conversation && (
          <div style={s.panel}>
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

        <div style={s.msgList} onClick={() => { setHeaderOpen(false); setMenuMsgId(null); }}>
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const sender = users.find((u) => u.id === msg.senderId);
            const isEditing = editingMsgId === msg.id;
            const menuOpen = menuMsgId === msg.id;
            return (
              <div key={msg.id} style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}>
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
                        <div style={s.msgMenuItem} onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }}>
                          ✏️  Edit
                        </div>
                        <div style={{ ...s.msgMenuItem, ...s.msgMenuItemDanger }} onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}>
                          🗑️  Delete
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
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
                        <button style={s.editCancelBtn} onClick={() => { setEditingMsgId(null); setEditText(""); }}>Cancel</button>
                        <button style={s.editSaveBtn} onClick={handleSaveEdit}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ ...s.msgText, ...(isMe ? s.msgTextMe : {}) }}>
                      {msg.text}
                    </p>
                  )}
                  <p style={s.msgTime}>
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
          <button style={s.sendBtn} onClick={send}>Send</button>
        </div>
      </div>
    </Layout>
  );
}

const ACCENT = '#7b7fd4';
const GREEN = '#5a9e5a';
const DARK = '#1a2744';

const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: GREEN,
    padding: 16,
    gap: 12,
  },
  avatar: {
    fontSize: 30,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    margin: 0,
  },
  role: {
    color: '#d0ead0',
    fontSize: 12,
    margin: 0,
  },
  msgList: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 0,
    maxWidth: '100%',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    fontSize: 24,
  },
  bubble: {
    maxWidth: '30%',
    borderRadius: 12,
    padding: 10,
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    minWidth: 0,
    overflow: 'hidden',
  },
  bubbleThem: {
    backgroundColor: '#fff',
  },
  bubbleMe: {
    backgroundColor: ACCENT,
  },
  msgText: {
    color: DARK,
    fontSize: 14,
    margin: 0,
  },
  msgTime: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
    margin: 0,
  },
  inputRow: {
    display: 'flex',
    padding: 12,
    gap: 8,
    borderTop: '1px solid #dde',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f8',
    borderRadius: 20,
    border: 'none',
    padding: '8px 16px',
    fontSize: 14,
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    border: 'none',
    padding: '8px 20px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
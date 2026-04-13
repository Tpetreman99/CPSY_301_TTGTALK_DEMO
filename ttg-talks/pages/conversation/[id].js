import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import {
  getConversationById,
  getMessagesByConversationId,
  getUserById,
  sendMessage
} from '../../lib/chatService';
import Layout from '../../components/Layout';

export default function ConversationPage() {
  const router = useRouter();
  const { id } = router.query;

  const [currentUser, setCurrentUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [conversation, setConversation] = useState(null);
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

  const { enterToSend } = useSettings();
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
    async function loadMessages() {
      if (!id) return;

      const messageData = await getMessagesByConversationId(id);
      setMessages(messageData);
    }

    loadMessages();
  }, [id]);

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

  const send = async () => {
    if (!input.trim() || !currentUser || !id) return;

    await sendMessage(id, currentUser.uid, input);

    const updatedMessages = await getMessagesByConversationId(id);
    setMessages(updatedMessages);
    setInput('');
  };

  if (!conversation) return null;
  if (conversation.type === 'direct' && !chatUser) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header}>
          {conversation.type === 'group' ? (
            <>
              <span style={s.avatar}>👥</span>
              <div>
                <p style={s.name}>
                  {groupMembers.map(m => m.displayName).join(', ')}
                </p>
                <p style={s.role}>{conversation.memberIds.length} members</p>
              </div>
            </>
          ) : (
            <>
              <span style={s.avatar}>{chatUser.avatar}</span>
              <div>
                <p style={s.name}>{chatUser.displayName}</p>
                <p style={s.role}>{chatUser.role}</p>
              </div>
            </>
          )}
        </div>

        <div style={s.msgList}>
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser?.uid;

            return (
              <div
                key={msg.id}
                style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}
              >
                {!isMe && (
                  <span style={s.msgAvatar}>
                    {conversation.type === 'group' ? '👤' : chatUser.avatar}
                  </span>
                )}
                <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                  <p style={s.msgText}>{msg.text}</p>
                  <p style={s.msgTime}>{formatMessageTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={
              conversation.type === 'group'
                ? 'Message group'
                : `Message ${chatUser.displayName.split(' ')[0]}`
            }
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
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
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
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 16,
    display: "flex",
    flexDirection: "column",
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
    justifyContent: "flex-end",
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

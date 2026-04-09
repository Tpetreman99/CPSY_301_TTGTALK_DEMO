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
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

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

  if (!conversation || !chatUser) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header}>
          <span style={s.avatar}>{chatUser.avatar}</span>
          <div>
            <p style={s.name}>{chatUser.displayName}</p>
            <p style={s.role}>{chatUser.role}</p>
          </div>
        </div>

        <div style={s.msgList}>
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser?.uid;

            return (
              <div key={msg.id} style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}>
                {!isMe && <span style={s.msgAvatar}>{chatUser.avatar}</span>}
                <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                  <p style={s.msgText}>{msg.text}</p>
                  <p style={s.msgTime}>{formatMessageTime(msg.createdAt)}</p>
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
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message ${chatUser.displayName.split(' ')[0]}...`}
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
    maxWidth: '100%'
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

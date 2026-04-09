"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebaseConfig";

import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import Layout from "../../components/Layout";

export default function ConversationPage() {
  const router = useRouter();
  const { id: chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);

  const bottomRef = useRef(null);

  // ✅ AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return unsub;
  }, [router]);

  // ✅ REAL-TIME MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  // ✅ AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ SEND MESSAGE
  const send = async () => {
    if (!input.trim() || !user) return;

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: input.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      setInput("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  if (!chatId) return null;

  return (
    <Layout>
      <div style={s.root}>
        <div style={s.header}>
          <p style={s.name}>Chat</p>
        </div>

        <div style={s.msgList}>
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;

            return (
              <div
                key={msg.id}
                style={{
                  ...s.msgRow,
                  ...(isMe ? s.msgRowMe : {}),
                }}
              >
                <div
                  style={{
                    ...s.bubble,
                    ...(isMe ? s.bubbleMe : s.bubbleThem),
                  }}
                >
                  <p style={s.msgText}>{msg.text}</p>

                  {/* Optional timestamp */}
                  {msg.createdAt && (
                    <p style={s.msgTime}>
                      {msg.createdAt.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
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
            onKeyDown={(e) => e.key === "Enter" && send()}
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

/* ✅ KEEPING YOUR STYLE STRUCTURE (TEAM SAFE) */

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
    backgroundColor: GREEN,
    padding: 16,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    margin: 0,
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
  msgText: {
    color: DARK,
    fontSize: 14,
    margin: 0,
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
};

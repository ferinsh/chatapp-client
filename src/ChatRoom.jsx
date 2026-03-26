import { useState, useEffect, useRef, useCallback } from "react";
import socket from "./socket";
import "./ChatRoom.css";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Stable color per username
const palette = ["#00e5ff","#ff3cac","#a78bfa","#34d399","#fb923c","#f472b6","#60a5fa","#facc15"];
function userColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

export default function ChatRoom({ username }) {
  const [messages, setMessages]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [typingUsers, setTyping]  = useState({});
  const [input, setInput]         = useState("");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    socket.on("history",  (hist) => setMessages(hist));
    socket.on("message",  (msg)  => setMessages((prev) => [...prev, msg]));
    socket.on("users",    (list) => setUsers(list));
    socket.on("typing",   ({ username: u, isTyping }) => {
      setTyping((prev) => {
        const next = { ...prev };
        isTyping ? (next[u] = true) : delete next[u];
        return next;
      });
    });
    return () => {
      socket.off("history");
      socket.off("message");
      socket.off("users");
      socket.off("typing");
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("message", input);
    setInput("");
    socket.emit("typing", false);
    clearTimeout(typingTimer.current);
  };

  const handleInput = useCallback((e) => {
    setInput(e.target.value);
    socket.emit("typing", true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("typing", false), 1500);
  }, []);

  const typingList = Object.keys(typingUsers).filter((u) => u !== username);

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-sm">[CHAT]</span>
        </div>
        <div className="sidebar-section">
          <p className="section-label">ONLINE — {users.length}</p>
          <ul className="user-list">
            {users.map((u) => (
              <li key={u} className="user-item">
                <span className="user-dot" style={{ background: userColor(u) }} />
                <span className={u === username ? "user-self" : ""}>{u}</span>
                {u === username && <span className="you-tag">you</span>}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main */}
      <main className="chat-main">
        <header className="chat-header">
          <span className="channel"># general</span>
          <span className="header-sub">{users.length} online</span>
        </header>

        <div className="messages">
          {messages.map((msg) =>
            msg.type === "system" ? (
              <div key={msg.id} className="msg-system">{msg.text}</div>
            ) : (
              <div key={msg.id} className={`msg ${msg.username === username ? "msg-own" : ""}`}>
                <span className="msg-avatar" style={{ background: userColor(msg.username) }}>
                  {msg.username[0].toUpperCase()}
                </span>
                <div className="msg-body">
                  <div className="msg-meta">
                    <span className="msg-user" style={{ color: userColor(msg.username) }}>
                      {msg.username}
                    </span>
                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="msg-text">{msg.text}</div>
                </div>
              </div>
            )
          )}

          {typingList.length > 0 && (
            <div className="typing-indicator">
              <span className="typing-dots"><span/><span/><span/></span>
              {typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-bar">
          <input
            autoFocus
            placeholder={`Message as ${username}…`}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            maxLength={500}
          />
          <button onClick={sendMessage} disabled={!input.trim()}>SEND</button>
        </div>
      </main>
    </div>
  );
}
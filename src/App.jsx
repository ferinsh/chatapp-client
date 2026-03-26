import { useState, useEffect } from "react";
import socket from "./socket";
import ChatRoom from "./ChatRoom";
import "./App.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [input, setInput]       = useState("");
  const [joined, setJoined]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    socket.on("connect_error", () => setError("Cannot reach server. Is it running?"));
    return () => socket.off("connect_error");
  }, []);

  const join = () => {
    const name = input.trim();
    if (!name) { setError("Enter a username"); return; }
    if (name.length < 2) { setError("At least 2 characters"); return; }
    setUsername(name);
    socket.connect();
    socket.emit("join", name);
    setJoined(true);
  };

  if (joined) return <ChatRoom username={username} />;

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-logo">
          <span className="logo-bracket">[</span>
          <span className="logo-text">CHAT</span>
          <span className="logo-bracket">]</span>
        </div>
        <p className="join-sub">realtime · end-to-end · no fluff</p>
        <div className="join-field">
          <label>USERNAME</label>
          <input
            autoFocus
            placeholder="enter handle..."
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && join()}
            maxLength={20}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <button className="join-btn" onClick={join}>
          CONNECT <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
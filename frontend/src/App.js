// frontend/src/App.js

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Admin from "./Admin";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [feedback, setFeedback] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch("http://localhost:8000/history")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const grouped = {};
          data.forEach((item) => {
            const sid = item.session_id || "default";
            if (!grouped[sid]) grouped[sid] = [];
            grouped[sid].push(item);
          });
          const sessionList = Object.keys(grouped).map((sid) => ({
            id: sid,
            title: grouped[sid][0]?.question
              ?.replace(/[*#`]/g, "")
              .slice(0, 30) || "New Chat",
          }));
          setSessions(sessionList);
        }
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          session_id: currentSessionId,
        }),
      });

      const data = await res.json();

      const botMessage = {
        type: "bot",
        text: data.answer || "No response",
        query_id: data.query_id || null,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.session_id) setCurrentSessionId(data.session_id);

      const title = input.replace(/[*#`]/g, "").slice(0, 30);
      setSessions((prev) => {
        const exists = prev.find((s) => s.id === data.session_id);
        if (!exists && data.session_id) {
          return [{ id: data.session_id, title }, ...prev];
        }
        return prev;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error connecting to backend." },
      ]);
    }

    setInput("");
    setIsLoading(false);
  };

  const handleExplain = async (index) => {
    if (expanded[index]) {
      setExpanded((prev) => ({ ...prev, [index]: false }));
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Explain this in detail:\n" + messages[index].text,
        }),
      });

      const data = await res.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], explanation: data.answer };
        return updated;
      });

      setExpanded((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedback = async (queryId, index, value) => {
    if (feedback[index]) return;

    setFeedback((prev) => ({ ...prev, [index]: value }));

    try {
      await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_id: queryId, feedback: value }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setExpanded({});
    setFeedback({});
  };

  if (showAdmin) {
    return <Admin onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="h-screen flex bg-[#0a0a0a] text-white overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-[260px] bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col shrink-0">
        <div className="p-4 text-lg font-bold border-b border-[#1a1a1a] tracking-tight">
          CodeMate AI
        </div>

        <div className="p-3">
          <button
            onClick={newChat}
            className="w-full bg-purple-600 hover:bg-purple-700 transition py-2 rounded-lg text-sm font-medium"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`p-2 text-sm rounded-lg cursor-pointer truncate transition hover:bg-[#1a1a1a] ${
                currentSessionId === s.id
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-gray-400"
              }`}
            >
              {s.title}
            </div>
          ))}
        </div>

        <div className="p-3 text-xs text-gray-500 border-t border-[#1a1a1a] flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Backend Online
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP NAV */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]">
          <span className="text-base font-medium text-gray-300">Chat</span>
          <button
            onClick={() => setShowAdmin(true)}
            className="text-sm text-gray-400 hover:text-purple-400 transition"
          >
            Admin
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          {messages.map((msg, index) => (
            <div key={index}>
              <div
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.type === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-xs mr-2 shrink-0 mt-1">
                    ðŸ¤–
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-xl max-w-[72%] text-sm leading-relaxed ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-purple-600 to-purple-800 text-white"
                      : "bg-[#111111] border border-[#1a1a1a] border-l-4 border-l-purple-600 text-gray-100 shadow-[0_0_10px_rgba(124,58,237,0.1)]"
                  }`}
                >
                  {msg.type === "bot" ? (
                    <ReactMarkdown
                      components={{
                        code({ inline, children }) {
                          return inline ? (
                            <code className="bg-[#1a1a1a] px-1 rounded text-purple-300 text-xs">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-[#0d0d0d] p-3 rounded-lg overflow-x-auto text-xs my-2 border border-[#222]">
                              <code className="text-purple-200">{children}</code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>

                {msg.type === "user" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs ml-2 shrink-0 mt-1">
                    ðŸ‘¤
                  </div>
                )}
              </div>

              {/* EXPLAIN + FEEDBACK */}
              {msg.type === "bot" && (
                <div className="ml-9 mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleExplain(index)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-purple-600 hover:text-purple-400 transition"
                  >
                    {expanded[index] ? "â–¼ Explanation" : "â–¶ Explain"}
                  </button>

                  {msg.query_id && (
                    <>
                      <button
                        onClick={() =>
                          handleFeedback(msg.query_id, index, "up")
                        }
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          feedback[index] === "up"
                            ? "border-green-500 text-green-400 bg-green-500/10"
                            : "border-[#2a2a2a] text-gray-500 hover:border-green-500 hover:text-green-400"
                        }`}
                      >
                        ðŸ‘
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(msg.query_id, index, "down")
                        }
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          feedback[index] === "down"
                            ? "border-red-500 text-red-400 bg-red-500/10"
                            : "border-[#2a2a2a] text-gray-500 hover:border-red-500 hover:text-red-400"
                        }`}
                      >
                        ðŸ‘Ž
                      </button>
                      {feedback[index] && (
                        <span className="text-xs text-gray-500 animate-pulse">
                          Thanks for feedback
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* EXPLANATION ACCORDION */}
              {expanded[index] && msg.explanation && (
                <div className="ml-9 mt-2 p-3 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-gray-300">
                  <ReactMarkdown>{msg.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-xs">
                ðŸ¤–
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="px-6 py-4 border-t border-[#1a1a1a]">
          <div className="flex items-end gap-3 bg-[#111111] border border-[#2a2a2a] focus-within:border-purple-600 rounded-2xl px-4 py-3 transition shadow-[0_0_15px_rgba(124,58,237,0.05)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-gray-500 max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 transition flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-4 h-4"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Enter to send Â· Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
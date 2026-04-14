import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Admin from "./Admin";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [feedback, setFeedback] = useState({});
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, session_id: currentSessionId }),
      });
      const data = await res.json();
      const botMessage = {
        type: "bot",
        text: data.answer || "No response",
        query_id: data.query_id || null,
        sources: data.sources || [],
      };
      setMessages((prev) => [...prev, botMessage]);
      if (data.session_id) setCurrentSessionId(data.session_id);
      const title = input.replace(/[*#`]/g, "").slice(0, 30);
      setSessions((prev) => {
        const exists = prev.find((s) => s.id === data.session_id);
        if (!exists && data.session_id) return [{ id: data.session_id, title }, ...prev];
        return prev;
      });
    } catch (err) {
      setMessages((prev) => [...prev, { type: "bot", text: "Error connecting to backend." }]);
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
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Explain this in detail:\n" + messages[index].text }),
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
      await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_id: queryId, feedback: value }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadStatus(data.message || "Uploaded!");
    } catch (err) {
      setUploadStatus("Upload failed.");
    }
    setIsUploading(false);
    setTimeout(() => setUploadStatus(""), 4000);
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

  if (showAdmin) return <Admin onBack={() => setShowAdmin(false)} />;

  return (
    <div className="h-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-[260px] bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col shrink-0">
        <div className="p-4 text-lg font-bold border-b border-[#1a1a1a] tracking-tight">CodeMate AI</div>
        <div className="p-3 space-y-2">
          <button onClick={newChat} className="w-full bg-purple-600 hover:bg-purple-700 transition py-2 rounded-lg text-sm font-medium">
            + New Chat
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-purple-600 transition py-2 rounded-lg text-sm font-medium text-gray-300 disabled:opacity-50"
          >
            {isUploading ? "Indexing..." : "Upload Code File"}
          </button>
          <input ref={fileInputRef} type="file" accept=".py,.js,.ts,.txt,.md,.java,.cpp,.c" onChange={handleUpload} className="hidden" />
          {uploadStatus && <p className="text-xs text-purple-400 text-center animate-pulse">{uploadStatus}</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`p-2 text-sm rounded-lg cursor-pointer truncate transition hover:bg-[#1a1a1a] ${
                currentSessionId === s.id ? "bg-purple-600/20 text-purple-300 border border-purple-600/30" : "text-gray-400"
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a]">
          <span className="text-base font-medium text-gray-300">Chat</span>
          <button onClick={() => setShowAdmin(true)} className="text-sm text-gray-400 hover:text-purple-400 transition">Admin</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          {messages.map((msg, index) => (
            <div key={index}>
              <div className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                {msg.type === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center mr-2 shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-400">
                      <path d="M12 2a2 2 0 012 2v1h1a3 3 0 013 3v1h.5a1.5 1.5 0 010 3H18v1a3 3 0 01-3 3h-1v1a2 2 0 01-4 0v-1H9a3 3 0 01-3-3v-1h-.5a1.5 1.5 0 010-3H6V8a3 3 0 013-3h1V4a2 2 0 012-2zm-2 8a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z"/>
                    </svg>
                  </div>
                )}
                <div className={`px-4 py-3 rounded-xl max-w-[72%] text-sm leading-relaxed ${
                  msg.type === "user"
                    ? "bg-gradient-to-br from-purple-600 to-purple-800 text-white"
                    : "bg-[#111111] border border-[#1a1a1a] border-l-4 border-l-purple-600 text-gray-100"
                }`}>
                  {msg.type === "bot" ? (
                    <ReactMarkdown components={{
                      code({ inline, children }) {
                        return inline ? (
                          <code className="bg-[#1a1a1a] px-1 rounded text-purple-300 text-xs">{children}</code>
                        ) : (
                          <pre className="bg-[#0d0d0d] p-3 rounded-lg overflow-x-auto text-xs my-2 border border-[#222]">
                            <code className="text-purple-200">{children}</code>
                          </pre>
                        );
                      },
                    }}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (msg.text)}
                </div>
                {msg.type === "user" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center ml-2 shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd"/>
                    </svg>
                  </div>
                )}
              </div>

              {msg.type === "bot" && msg.sources && msg.sources.length > 0 && (
                <div className="ml-9 mt-1 flex flex-wrap gap-1">
                  {msg.sources.map((src, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-400">
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {msg.type === "bot" && (
                <div className="ml-9 mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleExplain(index)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-purple-600 hover:text-purple-400 transition"
                  >
                    {expanded[index] ? "? Explanation" : "? Explain"}
                  </button>
                  {msg.query_id && (
                    <>
                      <button
                        onClick={() => handleFeedback(msg.query_id, index, "up")}
                        className={`text-xs px-2 py-1 rounded-full border transition flex items-center gap-1 ${
                          feedback[index] === "up" ? "border-green-500 text-green-400 bg-green-500/10" : "border-[#2a2a2a] text-gray-500 hover:border-green-500 hover:text-green-400"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.query_id, index, "down")}
                        className={`text-xs px-2 py-1 rounded-full border transition flex items-center gap-1 ${
                          feedback[index] === "down" ? "border-red-500 text-red-400 bg-red-500/10" : "border-[#2a2a2a] text-gray-500 hover:border-red-500 hover:text-red-400"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 001.423.23z"/>
                        </svg>
                      </button>
                      {feedback[index] && <span className="text-xs text-gray-500 animate-pulse">Thanks for feedback</span>}
                    </>
                  )}
                </div>
              )}

              {expanded[index] && msg.explanation && (
                <div className="ml-9 mt-2 p-3 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] text-sm text-gray-300">
                  <ReactMarkdown>{msg.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-400">
                  <path d="M12 2a2 2 0 012 2v1h1a3 3 0 013 3v1h.5a1.5 1.5 0 010 3H18v1a3 3 0 01-3 3h-1v1a2 2 0 01-4 0v-1H9a3 3 0 01-3-3v-1h-.5a1.5 1.5 0 010-3H6V8a3 3 0 013-3h1V4a2 2 0 012-2zm-2 8a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z"/>
                </svg>
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

        <div className="px-6 py-4 border-t border-[#1a1a1a]">
          <div className="flex items-end gap-3 bg-[#111111] border border-[#2a2a2a] focus-within:border-purple-600 rounded-2xl px-4 py-3 transition">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

export default App;

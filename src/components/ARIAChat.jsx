import { useState, useRef, useEffect, useCallback } from "react";

// ─── Suggested quick questions ─────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  "How do I know if my claim was triggered?",
  "Why did my premium change?",
  "What weather events trigger a payout?",
  "How long does a payout take?",
  "How do I upgrade my plan?",
];

// ─── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 items-end ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-[10px] font-black text-white">A</span>
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gray-900 text-white rounded-br-sm"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <span className="text-[10px] font-black text-white">A</span>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ARIAChat({ session, riskLevel }) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey${session?.name ? ` ${session.name.split(" ")[0]}` : ""}! 👋 I'm **ARIA**, your GigShield AI assistant. Ask me anything about your coverage, payouts, or how the risk engine works. I'm here to help! 🛡️`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [unread, setUnread]   = useState(0);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const panelRef    = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const allMessages = [...messages, userMsg];
      const res = await fetch(`/api/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map(({ role, content }) => ({ role, content })),
          workerName: session?.name,
          riskLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ARIA is unavailable right now.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open, riskLevel, session]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Button ────────────────────────────────────────────────── */}
      <button
        id="aria-chat-toggle"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
          open
            ? "bg-gray-900 rotate-0 scale-90"
            : "bg-gradient-to-br from-blue-600 to-violet-600 hover:scale-110"
        }`}
        aria-label="Open ARIA chat"
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`fixed bottom-24 right-6 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "650px", maxHeight: "calc(100vh - 120px)" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur">
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">ARIA</p>
            <p className="text-[10px] text-white/70 font-medium">Automated Rider Insurance Assistant · Online</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} />
          ))}
          {loading && <TypingDots />}
          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions — only show when few messages */}
        {messages.length <= 2 && !loading && (
          <div className="px-4 pb-3 flex flex-col gap-1.5 flex-shrink-0 border-t border-gray-100 pt-3 bg-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quick questions</p>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs text-blue-700 font-medium bg-blue-50/70 hover:bg-blue-100 border border-blue-100/50 rounded-xl px-3 py-2.5 transition-colors whitespace-normal leading-relaxed shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ARIA anything…"
            rows={1}
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            style={{ maxHeight: "100px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 py-2 text-center">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
            ARIA · Powered by GigShield AI · GigShield 2026
          </p>
        </div>
      </div>
    </>
  );
}

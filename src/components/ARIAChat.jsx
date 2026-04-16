import { useState, useRef, useEffect, useCallback } from "react";

import CookieByteBot from "./CookieByteBot";

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
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/5 overflow-hidden border border-white/10">
          <CookieByteBot />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-white text-zinc-950"
            : "rounded-bl-sm border border-white/10 bg-white/[0.05] text-zinc-100"
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
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/5 overflow-hidden border border-white/10">
        <CookieByteBot />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-3 shadow-sm">
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
      content: `Hey${session?.name ? ` ${session.name.split(" ")[0]}` : ""}! 👋 I'm **CookieByte**, your GigShield AI assistant. Ask me anything about your coverage, payouts, or how the risk engine works. I'm here to help! 🛡️`,
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

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("CookieByte JSON Parse Error:", text);
        throw new Error("I received a malformed response. Please try again in a moment. 🤖");
      }

      if (!res.ok) throw new Error(data?.error || "CookieByte is unavailable right now.");
      if (!data?.reply) throw new Error("I had trouble generating a reply. Please try again.");

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
      <div className="fixed bottom-6 right-6 z-[9999] group">
        <button
          id="aria-chat-toggle"
          onClick={() => setOpen((v) => !v)}
          className={`relative w-24 h-24 rounded-full transition-all duration-500 active:scale-95 ${
            open ? "scale-90" : "hover:scale-110"
          }`}
          aria-label="Open CookieByte chat"
        >
          {/* 3D Robot as the button */}
          <div className="absolute inset-0 z-0 bg-white/5 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
          <div className="relative z-10 h-full w-full pointer-events-none">
            <CookieByteBot />
          </div>

          {open && (
            <div className="absolute -top-2 -right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-xl">
               <svg className="h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          {unread > 0 && !open && (
            <span className="absolute -right-2 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white animate-bounce ring-4 ring-black/40">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`fixed bottom-24 right-6 z-[9999] flex w-[360px] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1116] shadow-2xl transition-all duration-300 ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "650px", maxHeight: "calc(100vh - 120px)" }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-4">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 backdrop-blur">
              <span className="text-sm font-black text-zinc-950">CB</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">CookieByte</p>
            <p className="text-[10px] text-white/70 font-medium">Automated Rider Insurance Assistant · Online</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#0b0d11] p-4" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} />
          ))}
          {loading && <TypingDots />}
          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200">
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions — only show when few messages */}
        {messages.length <= 2 && !loading && (
          <div className="flex flex-shrink-0 flex-col gap-1.5 border-t border-white/10 bg-[#0f1116] px-4 pb-3 pt-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Quick questions</p>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="whitespace-normal rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs font-medium leading-relaxed text-zinc-100 shadow-sm transition-colors hover:bg-white/[0.08]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex flex-shrink-0 items-end gap-2 border-t border-white/10 bg-[#0f1116] px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CookieByte anything…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/10"
            style={{ maxHeight: "100px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-[#0b0d11] py-2 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            CookieByte · Powered by GigShield AI · GigShield 2026
          </p>
        </div>
      </div>
    </>
  );
}

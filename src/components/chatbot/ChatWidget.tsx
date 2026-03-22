"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  listingId: string;
  listingState: string;
}

// ─── ChatWidget ───────────────────────────────────────────────────────────────

export function ChatWidget({ listingId, listingState }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI SDK v6: useChat requires explicit transport configuration
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { listingId, listingState },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "flex flex-col w-[360px] h-[480px]",
            "bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700",
            "animate-in slide-in-from-bottom-4 duration-300",
          )}
          role="dialog"
          aria-label="Property assistant chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 rounded-t-2xl bg-blue-600">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-white" />
              <span className="text-sm font-semibold text-white">Property Assistant</span>
              <span className="text-xs text-blue-200 ml-1">({listingState})</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-400 text-sm mt-8">
                <Bot className="size-8 mx-auto mb-2 text-zinc-300" />
                <p className="font-medium text-zinc-600">Ask me anything!</p>
                <p className="text-xs mt-1">
                  Property details, process questions, or schedule a showing.
                </p>
              </div>
            )}

            {messages.map((message) => {
              // In AI SDK v6, messages have `role` and `parts` (or `content`)
              const isUser = message.role === "user";
              const textContent =
                message.parts
                  ?.filter((part) => part.type === "text")
                  .map((part) => ("text" in part ? part.text : ""))
                  .join("") ?? "";

              return (
                <div
                  key={message.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      isUser
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm",
                    )}
                  >
                    {/* Handle tool call results for scheduleShowing */}
                    {message.parts
                      ?.filter((part) => part.type === "tool-invocation")
                      .map((part) => {
                        if (
                          "toolName" in part &&
                          part.toolName === "scheduleShowing" &&
                          "state" in part &&
                          part.state === "output-available"
                        ) {
                          // In AI SDK v6, tool output is in `output` (not `result`)
                          const result = (
                            part as {
                              output?: { success?: boolean; message?: string; error?: string };
                            }
                          ).output;
                          return (
                            <div
                              key={
                                "toolCallId" in part
                                  ? String(part.toolCallId)
                                  : String(Math.random())
                              }
                              className={cn(
                                "text-xs p-2 rounded-lg mt-1 border",
                                result?.success
                                  ? "bg-green-50 border-green-200 text-green-800"
                                  : "bg-red-50 border-red-200 text-red-800",
                              )}
                            >
                              {result?.success ? "Showing Scheduled" : "Error"}:{" "}
                              {result?.message ?? result?.error}
                            </div>
                          );
                        }
                        return null;
                      })}
                    {textContent}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-zinc-200 dark:border-zinc-700"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about this property..."
              className={cn(
                "flex-1 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700",
                "bg-zinc-50 dark:bg-zinc-800 px-3 py-2 outline-none",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors",
                "placeholder:text-zinc-400",
              )}
              aria-label="Chat message"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={cn(
                "flex-shrink-0 size-9 rounded-xl bg-blue-600 text-white",
                "flex items-center justify-center transition-colors",
                "hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed",
              )}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>

          {/* Powered by AI badge */}
          <div className="text-center text-[10px] text-zinc-400 pb-2">
            Powered by AI &middot; Not legal advice
          </div>
        </div>
      )}

      {/* ── Floating Toggle Button ──────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "size-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "hover:scale-105 active:scale-95",
          isOpen && "rotate-90",
        )}
        aria-label={isOpen ? "Close property assistant" : "Open property assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      </button>
    </div>
  );
}

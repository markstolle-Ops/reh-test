"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

interface AiFormAssistantProps {
  state: string;
  formName: string;
  currentField?: string;
}

export function AiFormAssistant({ state, formName, currentField }: AiFormAssistantProps) {
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/disclosures/ai-assist",
      body: {
        state,
        formName,
        fieldContext: currentField ?? "",
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">AI Form Assistant</h3>
        {currentField && (
          <p className="text-xs text-gray-500 mt-0.5">
            Helping with: <span className="font-medium">{currentField}</span>
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            Ask a question about any field in this disclosure form.
          </p>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-1">
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
                  {message.parts?.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null,
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* UPL disclaimer banner on every AI response */}
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
                  AI guidance only — not legal advice
                </div>
                <div className="max-w-[90%] rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
                  {message.parts?.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null,
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-1 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about a field..."
          disabled={isLoading}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

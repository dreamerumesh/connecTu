import { useEffect, useCallback, useContext, useRef,useState } from "react";
import { useChat } from "../contexts/ChatContext";

// helper: format time
const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SingleChat({ chatId, currentUserId, selectedUser }) {
  const {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage
  } = useChat();

  const bottomRef = useRef(null);

  const [message, setMessage] = useState("");

  // fetch messages
  useEffect(() => {
    fetchMessages(chatId);
  }, [chatId, fetchMessages]);

  // auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------- UI STATES ----------
  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-7 w-7 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const handleSendMessage = async () => {
  if (!message.trim()) return;

  try {
    await sendMessage(
      selectedUser?.phone, // receiverPhone
      message,                 // content
      "text"
    );
    setMessage("");
  } catch (err) {
    console.error("Failed to send message", err);
  }
};


  // ---------- MAIN UI ----------
  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-blue-50 overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="h-14 bg-blue-600 text-white flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-blue-400 flex items-center justify-center font-semibold">
            {selectedUser?.name?.[0]?.toUpperCase()}
          </div>

          {/* Name + status */}
          <div className="flex flex-col leading-tight">
            <span className="font-medium">
              {selectedUser?.name}
            </span>

            <span className="text-xs opacity-90">
              {selectedUser?.isOnline
                ? "Online"
                : selectedUser?.lastSeen
                  ? `Last seen ${formatTime(selectedUser.lastSeen)}`
                  : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10">
            No messages yet
          </p>
        )}

        {messages.map(msg => {
          const isMe = msg.sender === currentUserId;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] px-4 py-2 rounded-lg shadow
                  ${isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                  }`}
              >
                {/* message content */}
                <p className="text-sm whitespace-pre-wrap">
                  {msg.content}
                </p>

                {/* meta */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  {msg.isEdited && (
                    <span className="text-[10px] opacity-70">
                      edited
                    </span>
                  )}
                  <span className="text-[10px] opacity-70">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ================= INPUT ================= */}
      <div className="h-14 border-t bg-white flex items-center px-3 gap-2 shrink-0">
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>

    </div>
  );
}

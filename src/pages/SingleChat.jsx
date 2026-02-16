import { useEffect, useCallback, useContext, useRef, useState } from "react";
import { useChat } from "../contexts/ChatContext";
import { useUser } from "../contexts/UserContext";
import { IoIosArrowDown, IoMdSend, IoMdCheckmark, IoMdDoneAll } from 'react-icons/io';

// helper: format time
const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

// ⌨️ Animated typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        .typing-dot {
          animation: bounce 1.4s infinite;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #3b82f6;
          display: inline-block;
        }
        .typing-dot:nth-child(1) {
          animation-delay: 0s;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
}

export default function SingleChat() {
  const {
    messages,
    messagesLoading,
    error,
    fetchMessages,
    sendMessage,
    joinChat,
    activeChat,
    typingUsers,
    deleteMessageForEveryone,
    clearChat,
    editMessage, // ✏️
    handleTyping,
  } = useChat();

  const { user } = useUser();

  //const user = activeChat?.user;
  const chatId = activeChat?.chatId;
  const selectedUser = activeChat?.user;
  const currentUserId = user?._id;
  //console.log("Active chat user selec:", activeChat);
  // console.log("Chat id", chatId);
  //console.log("Current user id", currentUserId);
  // console.log("Selected user", selectedUser);
  const bottomRef = useRef(null);
  const lastFetchedChatRef = useRef(null);
  const messageMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null); // ✏️ Track message being edited
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, bottom: 'auto' });
  const [ isLastMessage, setIsLastMessage ] = useState(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close message dropdown
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(e.target)
      ) {
        setShowMessageMenu(null);
      }

      // Close chat (three dots) dropdown
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(e.target)
      ) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;

    if (lastFetchedChatRef.current === chatId) {
      return;
    }

    lastFetchedChatRef.current = chatId;
    fetchMessages(chatId);
  }, [chatId]);

  const prevCountRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [chatId]);

  // ⌨️ Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (typingUsers[chatId]?.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [typingUsers, chatId]);

  // ---------- UI STATES ----------
  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-[#f0f2f5]">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (messagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 bg-[#f0f2f5]">
        <div className="text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  // ⌨️ Handle input change with typing indicator
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();

    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = window.innerWidth < 768 ? 120 : 144;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    // Desktop: Enter sends, Shift+Enter new line
    // Mobile: Enter creates new line (natural textarea behavior)
    if (e.key === 'Enter' && !e.shiftKey) {
      const isMobile = window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (!isMobile) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      if (editingMessage) {
        // ✏️ Handle Edit
        await editMessage(editingMessage._id, message.trim(), isLastMessage);
        setEditingMessage(null);
        setMessage("");
        setIsLastMessage(null);
      } else {
        // 📨 Handle Send
        await sendMessage(selectedUser?.phone, message.trim(), "text");
        setMessage("");
      }

    } catch (err) {
      console.error("Failed to send/edit message", err);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // ✏️ Enter Edit Mode
  const handleEdit = (msg, isLastMessage) => {
    //console.log("Editing message:", isLastMessage);
    setIsLastMessage(isLastMessage);
    setEditingMessage(msg);
    setMessage(msg.content);
    setShowMessageMenu(null);
    textareaRef.current?.focus();
  };

  // ✏️ Cancel Edit Mode
  const cancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  };

  // ⌨️ Handle input change with typing indicator
  // const handleMessageChange = (e) => {
  //   setMessage(e.target.value);
  //   handleTyping();
  // };

  function formatLastSeen(lastSeen) {
    if (!lastSeen) return "";

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const seenDay = new Date(
      lastSeenDate.getFullYear(),
      lastSeenDate.getMonth(),
      lastSeenDate.getDate()
    );

    const diffDays = Math.floor((today - seenDay) / (1000 * 60 * 60 * 24));

    const time = lastSeenDate.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffDays === 0) {
      return `today at ${time}`;
    }

    if (diffDays === 1) {
      return `yesterday at ${time}`;
    }

    const date = lastSeenDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    return `${date} at ${time}`;
  }

  const isTyping = typingUsers[chatId]?.length > 0;

  // Long press handlers for mobile
  const handleTouchStart = (msg) => {
    if (!isMobile) return;
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessage(msg);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleDeleteMessage = (msg) => {
    const isSender = msg.sender === currentUserId;

    if (isMobile && selectedMessage) {
      // Mobile: Show delete options in a modal-like interface
      const deleteOption = window.confirm(
        isSender
          ? "Delete for everyone?\nPress OK for 'Delete for everyone'\nPress Cancel for 'Delete for me'"
          : "Delete this message for you?"
      );

      if (isSender) {
        if (deleteOption) {
          deleteMessageForEveryone(msg._id);
        } else {
          deleteMessageForMe(msg._id);
        }
      } else {
        if (deleteOption) {
          deleteMessageForMe(msg._id);
        }
      }

      setSelectedMessage(null);
    } else {
      // Desktop: This is handled by the dropdown menu
      setShowMessageMenu(null);
    }
  };

  // Calculate menu position - show above if not enough space below
  const calculateMenuPosition = (buttonElement) => {
    if (!buttonElement) return;

    const rect = buttonElement.getBoundingClientRect();
    const menuHeight = 150; // Approximate height of menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      // Show above
      setMenuPosition({ bottom: window.innerHeight - rect.top + 5, top: 'auto' });
    } else {
      // Show below (default)
      setMenuPosition({ top: rect.bottom + 5, bottom: 'auto' });
    }
  };

  // ---------- MAIN UI ----------
  return (
    <div className="flex flex-col h-full w-full bg-[#e5ddd5] md:bg-[#f0f2f5] overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="h-14 md:h-16 bg-white border-b flex items-center justify-between px-3 md:px-6 shadow-sm relative z-[100] shrink-0" style={{ width: '100%', maxWidth: '100vw', overflow: 'visible' }}>
        {selectedMessage ? (
          // Mobile selection mode header
          <>
            <button
              onClick={() => setSelectedMessage(null)}
              className="text-gray-700 hover:text-gray-900 p-2 -ml-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <span className="font-medium text-gray-800 flex-1 text-center">
              1 selected
            </span>

            <button
              onClick={() => handleDeleteMessage(selectedMessage)}
              className="text-red-500 hover:text-red-700 p-2 -mr-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            {/* User Info */}
            {/* User Info */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink min-w-0" style={{ overflow: 'hidden', flex: '1 1 0', maxWidth: '100%' }}>
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm md:text-base flex-shrink-0 shadow-md">
                {selectedUser?.name?.[0]?.toUpperCase()}
              </div>

              <div className="flex flex-col min-w-0" style={{ overflow: 'hidden', flex: '1 1 0' }}>
                <span className="font-semibold text-gray-800 text-sm md:text-base truncate" style={{ display: 'block', maxWidth: '100%' }}>
                  {selectedUser?.name}
                </span>
                <span className="text-xs text-gray-500 truncate" style={{ display: 'block', maxWidth: '100%' }}>
                  {selectedUser?.isOnline ? (
                    <span className="flex items-center gap-1" style={{ maxWidth: '100%' }}>
                      <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Online</span>
                    </span>
                  ) : selectedUser?.lastSeen ? (
                    `Last seen ${formatLastSeen(selectedUser.lastSeen)}`
                  ) : (
                    "Offline"
                  )}
                </span>
              </div>
            </div>

            {/* Three Dots Menu */}
            <div ref={chatMenuRef} className="relative flex-shrink-0 z-[100]" style={{ marginLeft: '8px', zIndex: 9999 }}>
              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Chat options"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {showChatMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"
                  style={{ zIndex: 9999 }}>
                  <div
                    onClick={() => {
                      clearChat(chatId);
                      setShowChatMenu(false);
                    }}
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear Chat
                  </div>
                  <div className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    Block
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 w-full overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        <div className="w-full space-y-2 md:space-y-3" style={{ maxWidth: '100%' }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-sm md:text-base">No messages yet</p>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                Send a message to start the conversation
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isMe = msg.sender === currentUserId;
            const isLastMessage = index === messages.length - 1;
            const shouldShowAbove = messages.length > 2 && index >= messages.length - 2;

            return (
              <div key={msg._id} className="flex flex-col group relative w-full">
                <div className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                  <div className="flex items-end gap-1 md:gap-2 max-w-[85%] md:max-w-[70%]" style={{ wordBreak: 'break-word' }}>
                    {/* Message Bubble */}
                    <div
                      className={`relative px-2 md:px-3 py-2 md:py-2 rounded-2xl text-sm md:text-base shadow-sm
                        ${isMe
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md"
                        }
                      `}
                      style={{ maxWidth: '100%', overflowWrap: 'break-word' }}
                    >
                      {/* Arrow Button - Top Right Corner */}
                      <button
                        onClick={() =>
                          setShowMessageMenu(
                            showMessageMenu === msg._id ? null : msg._id
                          )
                        }
                        className={`absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all
                          ${isMe
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }
                          md:opacity-0 md:group-hover:opacity-100
                          shadow-sm hover:shadow-md
                        `}
                      >
                        <IoIosArrowDown className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      {/* Message Content with Time */}
                      <div className="pr-1 inline-flex items-end flex-wrap">
                        <span className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </span>
                        <span
                          className={`text-[10px] md:text-xs ml-2 whitespace-nowrap flex items-center gap-0.5 ${isMe ? "text-blue-100" : "text-gray-500"
                            }`}
                          style={{
                            paddingBottom: '1px', // Moves it slightly below baseline
                            lineHeight: '1',
                          }}
                        > 
                           {msg.isEdited && (
                            <span className="italic text-[13px]">(edited)</span>
                          )}
                          {formatTime(msg.createdAt)}
                          {isMe && (
                            <span className="ml-[2px] flex items-center">
                              {msg.status === "read" ? (
                                <IoMdDoneAll className="text-green-300 w-4 h-4 md:w-5 md:h-5" />
                              ) : msg.status === "delivered" ? (
                                <IoMdDoneAll className="text-blue-200 w-4 h-4 md:w-5 md:h-5" />
                              ) : (
                                <IoMdCheckmark className="text-blue-200 w-4 h-4 md:w-5 md:h-5" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                {
                  showMessageMenu === msg._id && (
                    <div
                      className={`absolute ${isMe ? "right-0" : "left-0"} ${shouldShowAbove ? "bottom-full mb-1" : "top-full mt-1"
                        } z-50`}
                    >
                      <div
                        ref={messageMenuRef}
                        className="w-48 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"
                      >
                        <div
                          onClick={() => {
                            deleteMessageForMe(msg._id);
                            setShowMessageMenu(null);
                          }}
                          className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete for me
                        </div>

                        {msg.sender === currentUserId && (
                          <div
                            onClick={() => {
                              deleteMessageForEveryone(msg._id);
                              setShowMessageMenu(null);
                            }}
                            className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-3 transition-colors border-t border-gray-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete for everyone
                          </div>
                        )}

                        {/* ✏️ EDIT OPTION (Only for sender) */}
                        {msg.sender === currentUserId && (
                          <div
                            onClick={() => handleEdit(msg,isLastMessage)}
                            className="px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors border-t border-gray-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white px-3 md:px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ================= INPUT ================= */}
      <div className="bg-white border-t px-3 md:px-6 py-3 md:py-4 w-full shrink-0" style={{ maxWidth: '100vw' }}>
        {/* ✏️ Edit Mode Indicator */}
        {editingMessage && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-t-lg -mt-3 mb-2 border-b border-blue-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-blue-600">Editing Message</span>
              <span className="text-xs text-gray-500 truncate max-w-[200px]">{editingMessage.content}</span>
            </div>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex items-end gap-2 md:gap-4 w-full">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full bg-gray-100 rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none overflow-y-auto"
              style={{
                maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '120px' : '144px',
                minHeight: '44px',
                lineHeight: '1.5'
              }}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 text-white p-2.5 md:px-6 md:py-2.5 rounded-full hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 mb-0.5"
          >
            <span className="hidden md:inline">{editingMessage ? "Update" : "Send"}</span>
            {editingMessage ? (
              <IoMdCheckmark className="w-5 h-5 md:hidden md:w-6 md:h-6" />
            ) : (
              <IoMdSend className="w-5 h-5 md:hidden md:w-6 md:h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
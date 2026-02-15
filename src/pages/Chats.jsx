import { useRef, useState, useEffect } from "react";
import { IoMdMore, IoMdSearch, IoMdCheckmark } from 'react-icons/io'; // ✅ Icons
import api from "../utils/axiosConfig";
import SingleChat from "./SingleChat"; // ✅ import single chat
import { useUser } from "../contexts/UserContext";
import { useChat } from "../contexts/ChatContext";
import NewChatModal, { PlusButton } from "../components/NewChatModal"; // ✅ import modal and button
import { useNavigate } from "react-router-dom";

// ---------- helpers ----------
const normalizePhone = (phone) =>
  phone?.replace(/\D/g, "").slice(-10);

// Use a hook for click outside if needed, or just a simple effect
// reusing the logic from SingleChat or just defining it here
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// ---------- component ----------
export default function Chats() {
  const { user } = useUser();
  const { activeChat } = useChat();
  const currentUserId = user?._id;
  const navigate = useNavigate();

  const { chats, chatsLoading, fetchChats, typingUsers, markAllRead } = useChat(); // ✅ get typingUsers and markAllRead

  const isLoggedIn = !!user;
  // const [selectedChatId, setSelectedChatId] = useState(null); // ✅ NEW
  const selectedChatId = activeChat?.chatId || null; // ✅ derive from context
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ Modal state

  // 🔍 Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useClickOutside(desktopMenuRef, () => setShowDesktopMenu(false));
  useClickOutside(mobileMenuRef, () => setShowMobileMenu(false));

  // 🔹 Filtered Chats Logic
  const filteredChats = chats.filter((chat) => {
    // 1. Unread Filter
    if (showUnreadOnly && (chat.unreadCount || 0) === 0) return false;

    // 2. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = chat.user?.name?.toLowerCase() || "";
      const phone = chat.user?.phone || "";
      return name.includes(query) || phone.includes(query);
    }

    return true;
  });

  // 🔹 MOCK phone contacts (web limitation)
  const phoneContacts = [
    { name: "santosh frnduu", phone: "8688568544" },
    { name: "amma", phone: "9123456789" }
  ];

  // build contact map
  const contactMap = {};
  phoneContacts.forEach(c => {
    contactMap[normalizePhone(c.phone)] = c.name;
  });


  // ---------- UI STATES ----------
  if (!isLoggedIn) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-blue-50">
        <p className="text-blue-700 text-lg font-medium mb-6">
          Login to access your chats 💬
        </p>

        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }
  //console.log("loading debug:", chatsLoading, "chats:", chats);
  if (chatsLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-blue-50 overflow-hidden">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <div className="hidden md:flex md:w-80 bg-white border-r shrink-0">
        <div className="relative flex flex-col w-full h-full">

          {/* Header */}
          <div className="p-4 border-b shrink-0 flex items-center justify-between relative">
            <h2 className="text-xl font-semibold text-blue-600">
              ConnecTu
            </h2>

            {/* Desktop Menu Button */}
            <div ref={desktopMenuRef} className="relative">
              <button
                onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              >
                <IoMdMore className="w-6 h-6" />
              </button>

              {/* Desktop Dropdown Menu */}
              {showDesktopMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowUnreadOnly(!showUnreadOnly);
                      setShowDesktopMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Unread Msgs</span>
                    {showUnreadOnly && <IoMdCheckmark className="text-blue-500 w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      markAllRead();
                      setShowDesktopMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-50"
                  >
                    Read All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar Desktop */}
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="relative">
              <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2">
            <ChatList
              chats={filteredChats}
              activeChatId={selectedChatId}
              //onSelectChat={setSelectedChatId}
              onSelectUser={setSelectedUser}
              typingUsers={typingUsers}
            />
          </div>

          {/* Plus button */}
          <PlusButton
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-4 right-4"
          />
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">

        {/* ---------- MOBILE ---------- */}
        <div className="md:hidden relative flex-1 bg-white h-full flex flex-col">

          {selectedChatId ? (
            <div className="flex-1 h-full min-h-0 flex flex-col">
              <SingleChat
              //chatId={selectedChatId}
              //currentUserId={currentUserId}
              //selectedUser={selectedUser}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full w-full overflow-hidden">

              {/* Mobile header */}
              <div className="p-4 border-b shrink-0 flex items-center justify-between relative bg-white z-10">
                <h2 className="text-lg font-semibold text-blue-600">
                  ConnecTu
                </h2>
                {/* Mobile Menu Button */}
                <div className="relative" ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                  >
                    <IoMdMore className="w-6 h-6" />
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {showMobileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowUnreadOnly(!showUnreadOnly);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span>Unread Msgs</span>
                        {showUnreadOnly && <IoMdCheckmark className="text-blue-500 w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          markAllRead();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-50"
                      >
                        Read All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar Mobile */}
              <div className="px-4 py-2 border-b bg-gray-50 shrink-0">
                <div className="relative">
                  <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Mobile chat list */}
              <div className="flex-1 overflow-y-auto px-4 w-full" style={{ maxWidth: '100vw' }}>
                <ChatList
                  chats={filteredChats}
                  activeChatId={selectedChatId}
                  onSelectUser={setSelectedUser}
                  typingUsers={typingUsers}
                />
              </div>
              <PlusButton
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-4 right-4 md:hidden z-40"
              />
            </div>
          )}

          {/* Mobile plus button */}

        </div>

        {/* ---------- DESKTOP CHAT ---------- */}
        <div className="hidden md:flex flex-1 min-h-0 bg-white h-full flex flex-col">
          <SingleChat
          //chatId={selectedChatId}
          //currentUserId={currentUserId}
          //selectedUser={selectedUser}
          />
        </div>
      </div>

      {/* ================= MODAL ================= */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChatCreated={(chat, user) => {
          //setSelectedChatId(chat._id);
          setSelectedUser(user);
          setIsModalOpen(false);
        }}
      />
    </div>
  );

}

// ---------- CHAT LIST ----------

function ChatList({
  chats = [],
  activeChatId,
  //onSelectChat,
  onSelectUser,
  typingUsers = {}
}) {
  const { selectChat } = useChat();

  // 🟡 Empty state
  if (!chats || chats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-400">
          No chats yet
        </p>
      </div>
    );
  }
  //console.log("Rendering ChatList with chats:", chats[0]);
  return (
    <ul className="h-full overflow-y-auto space-y-1 pr-1">
      {chats.map(chat => {
        const isActive = activeChatId === chat.chatId;
        const isTyping = (typingUsers[chat.chatId]?.length ?? 0) > 0;

        return (
          <li
            key={chat.chatId}
            onClick={() => {
              //onSelectChat(chat.chatId);
              onSelectUser(chat.user);
              selectChat(chat);
            }}
            className={`
              flex items-center gap-3 p-3 rounded-lg cursor-pointer
              transition-colors duration-150
              ${isActive ? "bg-blue-100" : "hover:bg-blue-50"}
            `}
          >
            {/* ---------- Avatar ---------- */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-200
                flex items-center justify-center
                text-blue-700 font-semibold text-lg
              ">
                {chat.user?.name?.[0]?.toUpperCase() || "?"}
              </div>

              {chat.user?.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3
                  bg-green-500 border-2 border-white rounded-full
                " />
              )}
            </div>

            {/* ---------- Chat Content ---------- */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-800 truncate">
                  {chat.user?.name || "Unknown"}
                </p>

                {chat.lastMessageTime && (
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs whitespace-nowrap ${chat.unreadCount > 0 ? "text-green-600 font-medium" : "text-gray-400"}`}>
                      {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ⌨️ Typing indicator / last message */}
              <p
                className={`text-sm truncate ${isTyping
                  ? "text-blue-500 italic font-medium"
                  : "text-gray-500"
                  }`}
              >
                {isTyping
                  ? "typing..."
                  : chat.lastMessage || "No messages yet"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

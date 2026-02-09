import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import SingleChat from "./SingleChat"; // ✅ import single chat
import { useUser } from "../contexts/UserContext";
import { useChat } from "../contexts/ChatContext";
import NewChatModal, { PlusButton } from "../components/NewChatModal"; // ✅ import modal and button
// ---------- helpers ----------
const normalizePhone = (phone) =>
  phone?.replace(/\D/g, "").slice(-10);

// ---------- component ----------
export default function Chats() {
  const { user } = useUser();
  const currentUserId = user?._id;

  const { chats, chatsLoading, fetchChats, typingUsers } = useChat(); // ✅ get typingUsers

  const [isLoggedIn] = useState(true); // replace with auth context
  const [selectedChatId, setSelectedChatId] = useState(null); // ✅ NEW
  const [selectedUser ,setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ Modal state

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
      <div className="h-screen flex items-center justify-center bg-blue-50">
        <p className="text-blue-700 text-lg font-medium">
          Login to access your chats 💬
        </p>
      </div>
    );
  }
  //console.log("loading debug:", chatsLoading, "chats:", chats);
  if (chatsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  // ---------- MAIN UI ----------
return (
  <div className="h-screen flex bg-blue-50 overflow-hidden">

    {/* ================= SIDEBAR (DESKTOP) ================= */}
    <div className="hidden md:flex md:w-80 bg-white border-r">
      <div className="relative flex flex-col w-full h-full">

        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-blue-600">
            Chats
          </h2>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2">
          <ChatList
            chats={chats}
            activeChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
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
    <div className="flex-1 flex flex-col min-h-0">

      {/* ---------- MOBILE ---------- */}
      <div className="md:hidden relative flex-1 bg-white">

        {selectedChatId ? (
          <SingleChat
            chatId={selectedChatId}
            currentUserId={currentUserId}
            selectedUser={selectedUser}
          />
        ) : (
          <div className="flex flex-col h-full">

            {/* Mobile header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-blue-600">
                Chats
              </h2>
            </div>

            {/* Mobile chat list */}
            <div className="flex-1 overflow-y-auto px-2">
              <ChatList
                chats={chats}
                activeChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
                onSelectUser={setSelectedUser}
                typingUsers={typingUsers}
              />
            </div>
          </div>
        )}

        {/* Mobile plus button */}
        <PlusButton
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-4 right-4 md:hidden z-40"
        />
      </div>

      {/* ---------- DESKTOP CHAT ---------- */}
      <div className="hidden md:flex flex-1 min-h-0 bg-white">
        <SingleChat
          chatId={selectedChatId}
          currentUserId={currentUserId}
          selectedUser={selectedUser}
        />
      </div>
    </div>

    {/* ================= MODAL ================= */}
    <NewChatModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onChatCreated={(chat, user) => {
        setSelectedChatId(chat._id);
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
  onSelectChat,
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

  return (
    <ul className="h-full overflow-y-auto space-y-1 pr-1">
      {chats.map(chat => {
        const isActive = activeChatId === chat.chatId;
        const isTyping = (typingUsers[chat.chatId]?.length ?? 0) > 0;

        return (
          <li
            key={chat.chatId}
            onClick={() => {
              onSelectChat(chat.chatId);
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
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                )}
              </div>

              {/* ⌨️ Typing indicator / last message */}
              <p
                className={`text-sm truncate ${
                  isTyping
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



import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import SingleChat from "./SingleChat"; // ✅ import single chat
import { useUser } from "../contexts/UserContext";
import { useChat } from "../contexts/ChatContext";
// ---------- helpers ----------
const normalizePhone = (phone) =>
  phone?.replace(/\D/g, "").slice(-10);

// ---------- component ----------
export default function Chats() {
  const { user } = useUser();
  const currentUserId = user?._id;

  const { chats, chatsLoading} = useChat(); // ✅ get chats from context

  //const [chats, setChats] = useState([]);
  //const [loading, setLoading] = useState(true);
  const [isLoggedIn] = useState(true); // replace with auth context
  const [selectedChatId, setSelectedChatId] = useState(null); // ✅ NEW
  const [selectedUser ,setSelectedUser] = useState(null);

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

  //---------- fetch chats ----------
  // useEffect(() => {
  //   if (!isLoggedIn) return;

  //   const fetchChats = async () => {
  //     try {
  //       const res = await api.get("/chats/");
  //       const backendChats = res.data.chats || [];

  //       const merged = backendChats.map(chat => {
  //         const phone = normalizePhone(chat.user.phone);
  //         return {
  //           ...chat,
  //           displayName: contactMap[phone] || chat.user.name
  //         };
  //       });

  //       setChats(merged);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchChats();
  // }, [isLoggedIn]);

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
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div className="h-screen flex bg-blue-50">
      {/* ---------- SIDEBAR (DESKTOP) ---------- */}
      <div className="hidden md:flex md:w-80 bg-white border-r">
        <div className="p-4 w-full">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">
            Chats
          </h2>

          <ChatList
            chats={chats}
            activeChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onSelectUser={setSelectedUser}
          />
        </div>
      </div>

      {/* ---------- MAIN AREA ---------- */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        {/* <div className="h-14 bg-blue-600 text-white flex items-center px-4">
          <h1 className="text-lg font-semibold">
            {selectedChatId ? "Chat" : "Chats"}
          </h1>
        </div> */}

        {/* ---------- MOBILE ---------- */}
        <div className="flex-1 md:hidden bg-white flex flex-col min-h-0">
          {selectedChatId ? (
            <SingleChat
              chatId={selectedChatId}
              currentUserId={currentUserId}
              selectedUser={selectedUser}
            />
          ) : (
            <ChatList
              chats={chats}
              activeChatId={selectedChatId}
              onSelectChat={setSelectedChatId}
              onSelectUser={setSelectedUser}
            />
          )}
        </div>

        {/* ---------- DESKTOP ---------- */}
        <div className="hidden md:flex flex-1 min-h-0">
          <SingleChat
            chatId={selectedChatId}
            currentUserId={currentUserId}
            selectedUser={selectedUser}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- CHAT LIST ----------
function ChatList({ chats, activeChatId, onSelectChat, onSelectUser }) {
  const {selectChat} = useChat();
  if (chats.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-10">
        No chats yet
      </p>
    );
  }
  //console.log("Rendering ChatList with chats:", chats);
  return (
    <ul className="space-y-1">
      {chats.map(chat => (
        <li
          key={chat.chatId}
          onClick={() => {
            onSelectChat(chat.chatId);
            onSelectUser(chat.user);
            selectChat(chat);
          }}
          className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition
            ${
              activeChatId === chat.chatId
                ? "bg-blue-100"
                : "hover:bg-blue-50"
            }
          `}
        >
          {/* Avatar */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
              {chat.user.name[0]?.toUpperCase()}
            </div>

            {chat.user.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-800 truncate">
                {chat.user.name}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>

            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

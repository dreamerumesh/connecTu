import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; // socket.io client
import { chatService } from '../services/chatService';
import { useUser } from './UserContext'; // Assuming you have an AuthContext
import { io } from "socket.io-client"; // socket.io client
import { useMemo } from 'react';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
export const ChatProvider = ({ children }) => {
  const { user } = useUser(); // Get current user from auth context
  const socketRef = useRef(null); // socket.io client
  const activeChatRef = useRef(null); // socket.io client
  const typingTimeoutRef = useRef(null); // ⌨️ typing timeout
  const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, ""); // socket.io client

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // ⌨️ { chatId: [userId1, userId2] }



  const joinChat = useCallback((chatId) => { // socket.io client
    if (socketRef.current && chatId) { // socket.io client
      //console.log("Socket", socketRef.current.id, "joining chat", chatId); // socket.io client
      socketRef.current.emit("join-chat", chatId); // socket.io client
    } // socket.io client
  }, []); // socket.io client

  useEffect(() => {
    if (activeChat?.chatId) {
      joinChat(activeChat.chatId);
    }
  }, [activeChat?.chatId, joinChat]);

  useEffect(() => { // socket.io client
    activeChatRef.current = activeChat; // socket.io client
    //console.log("✅ Active chat updated:", activeChat);
  }, [activeChat]); // socket.io client

  useEffect(() => {
    //console.log("🟡 ChatContext socket effect running");

    if (!socketRef.current) {
      //console.log("🟢 creating socket connection");

      socketRef.current = io(SOCKET_URL, {
        auth: { token: localStorage.getItem("authToken") },
      });
    }

    socketRef.current.on("receive-message", (message) => {
      // 🟢 1. Emit Delivered Status (always, if socket connected)
      socketRef.current?.emit("message_delivered", {
        messageId: message._id,
        chatId: message.chatId
      });

      // 🟢 2. If Active Chat, Emit Read Status immediately
      if (message.chatId === activeChatRef.current?.chatId) {
        socketRef.current?.emit("mark_messages_read", {
          chatId: message.chatId
        });
      }

      if (message.chatId === activeChatRef.current?.chatId) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      // ✅ update chat preview (NO API CALL)
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.chatId === message.chatId
            ? {
              ...chat,
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
            }
            : chat
        )
      );

      // ⌨️ Clear typing indicator when message is received
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (updated[message.chatId]) {
          updated[message.chatId] = updated[message.chatId].filter(
            (id) => id !== message.sender
          );
          if (updated[message.chatId].length === 0) {
            delete updated[message.chatId];
          }
        }
        return updated;
      });
    });


    socketRef.current.on("user-status", (payload) => {
      //console.log("👤 user-status RECEIVED:", payload);

      const { userId, isOnline, lastSeen } = payload;

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.user._id === userId
            ? {
              ...chat,
              user: {
                ...chat.user,
                isOnline,
                lastSeen,
              },
            }
            : chat
        )
      );

      setActiveChat((prev) => {
        if (!prev || prev.user._id !== userId) return prev;

        const updatedChat = {
          ...prev,
          user: {
            ...prev.user,
            isOnline,
            lastSeen,
          },
        };

        //console.log("Updated activeChat:", updatedChat);

        return updatedChat;
      });
    });

    //console.log("📦 Typing listener mounted (GLOBAL)");
    // ⌨️ TYPING START LISTENER
    socketRef.current.on("user-typing", (payload) => {
      //console.log("⌨️ user-typing RECEIVED:", payload);
      const { userId, chatId } = payload;
      setTypingUsers((prev) => {
        const typingInChat = prev[chatId] || [];
        if (!typingInChat.includes(userId)) {
          return {
            ...prev,
            [chatId]: [...typingInChat, userId],
          };
        }
        return prev;
      });
    });

    // ⌨️ TYPING STOP LISTENER
    socketRef.current.on("user-typing-stop", (payload) => {
      const { userId, chatId } = payload;
      setTypingUsers((prev) => {
        const typingInChat = prev[chatId] || [];
        const updated = typingInChat.filter((id) => id !== userId);
        if (updated.length === 0) {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[chatId];
          return newTypingUsers;
        }
        return {
          ...prev,
          [chatId]: updated,
        };
      });
    });

    // delete message for everyone listener
    socketRef.current.on("message-deleted-for-everyone", (payload) => {
      console.log("🗑️ message-deleted-for-everyone RECEIVED:", payload);
      const { messageId, chatId } = payload;
      if (chatId === activeChatRef.current?.chatId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? { ...msg, content: 'This message was deleted for everyone.', isDeletedForEveryone: true }
              : msg
          )
        );
      }
    });

    // 📨 MESSAGE DELIVERED LISTENER
    socketRef.current.on("message_delivered", (payload) => {
      // console.log("📨 message_delivered RECEIVED:", payload);
      const { messageId, chatId, status } = payload;

      // Update in messages list (if active chat)
      if (chatId === activeChatRef.current?.chatId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, status } : msg
          )
        );
      }

      // Update in chat list (last message status) - optional, but good for UI
      setChats(prev =>
        prev.map(chat =>
          chat.chatId === chatId && chat.lastMessage === messageId // strict check might be hard if we don't store lastMessageId
            ? { ...chat } // complex to update last message status in chat list without message ID in chat obj
            : chat
        )
      );
    });

    // 📖 MESSAGES READ LISTENER
    socketRef.current.on("messages_read", (payload) => {
      // console.log("📖 messages_read RECEIVED:", payload);
      const { chatId, readBy } = payload;

      // Update all messages in active chat to 'read'
      if (chatId === activeChatRef.current?.chatId) {
        setMessages(prev =>
          prev.map(msg =>
            // only update if receiver is the one who read it (or just update all 'sent'/'delivered' to 'read' if I am the sender)
            // For 1-on-1, if the other person read it, ALL my messages to them are read.
            msg.sender !== readBy && msg.status !== 'read'
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      }
    });

    return () => {
      console.log("🧹 cleaning up socket listeners");

      socketRef.current?.off("receive-message");
      socketRef.current?.off("user-status");
      socketRef.current?.off("user-typing");
      socketRef.current?.off("user-typing-stop");
      socketRef.current?.off("message-deleted-for-everyone");
    };
  }, [SOCKET_URL]);


  // Fetch all chats for the logged-in user
  const fetchChats = useCallback(async () => {
    //console.log("debug fetchChats function is calling");
    try {
      setChatsLoading(true);
      setError(null);
      const data = await chatService.getMyChats();
      setChats(data.chats || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch chats');
      console.error('Error fetching chats:', err);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setActiveChat(null);
      setMessages([]);
    }
  }, [user, fetchChats]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId) => {
    //console.log("debug fetchMessages function is calling:", chatId);
    if (!chatId) return;

    try {
      setMessagesLoading(true);
      setError(null);
      const data = await chatService.getChatMessages(chatId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (receiverPhone, content, type = 'text') => {
    try {
      setSending(true);
      setError(null);
      const data = await chatService.sendMessage(receiverPhone, content, type);

      // ⌨️ Stop typing indicator
      if (activeChat?.chatId) {
        socketRef.current?.emit("typing-stop", activeChat.chatId);
      }

      return data.message;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeChat]);

  // Edit an existing message
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      setError(null);
      const data = await chatService.editMessage(messageId, newContent);

      // Update the message in the messages array
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? data.message : msg
        )
      );

      // Refresh chat list to update last message if needed
      await fetchChats();

      return data.message;
    } catch (err) {
      setError(err.message || 'Failed to edit message');
      console.error('Error editing message:', err);
      throw err;
    }
  }, [fetchChats]);

  const createChat = useCallback(async (name, receiverPhone, isNewContact = false) => {
    //console.log("debug createChat function is calling with:", name, receiverPhone, isNewContact);
    try {
      setError(null);
      const data = await chatService.createChat(name, receiverPhone, isNewContact);
      // Refresh chat list to include the new chat
      if (isNewContact) {
        await fetchChats();
      }
      return data.chat;
    } catch (err) {
      setError(err.message || 'Failed to create chat');
      console.error('Error creating chat:', err);
      throw err;
    }
  }, [fetchChats]);

  // Set active chat and fetch its messages
  const selectChat = useCallback(async (chat) => {
    setActiveChat(chat);
    //console.log("Selected chat:", activeChat);
    //console.log("Selected chat:", chat);
    //console.log("Chat ID:", chat?.chatId);
    if (chat && chat.chatId) {
      // 🟢 Emit Read Status when opening chat
      socketRef.current?.emit("mark_messages_read", { chatId: chat.chatId });

      await fetchMessages(chat.chatId);
      // ⌨️ Clear typing users for this chat
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[chat.chatId];
        return updated;
      });
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);


  // Fetch contacts for the logged-in user
  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const data = await chatService.getContacts();
      return data.contacts || [];
    }
    catch (err) {
      setError(err.message || 'Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
      throw err;
    }
  }, []);

  // Clear active chat
  const clearActiveChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
  }, []);

  // Add a message to the current chat (useful for real-time updates)
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Update a message in the current chat (useful for real-time updates)
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  // ⌨️ Handle typing indicator
  const handleTyping = useCallback(() => {
    //console.log("debug 1⌨️ handleTyping called");
    if (!activeChat?.chatId) return;
    // console.log("debug 2⌨️ handleTyping called");
    // Emit typing-start
    socketRef.current?.emit("typing-start", activeChat.chatId);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing-stop after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-stop", activeChat.chatId);
    }, 1000);
  }, [activeChat]);

  const deleteMessageForMe = useCallback(async (messageId) => {
    try {
      setError(null);
      const data = await chatService.deleteMessageForMe(messageId);
      // Remove the message from the messages array
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      return data;
    } catch (err) {
      setError(err.message || 'Failed to delete message for me');
      console.error('Error deleting message for me:', err);
      throw err;
    }
  }, []);

  const deleteMessageForEveryone = useCallback(async (messageId) => {
    try {
      setError(null);
      const data = await chatService.deleteMessageForEveryone(messageId);
      // Update the message in the messages array to indicate it's deleted for everyone
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, content: 'This message was deleted for everyone.', isDeletedForEveryone: true }
            : msg
        )
      );
      return data;
    } catch (err) {
      setError(err.message || 'Failed to delete message for everyone');
      console.error('Error deleting message for everyone:', err);
      throw err;
    }
  }, []);

  const clearChat = useCallback(async (chatId) => {
    try {
      setError(null);
      const data = await chatService.clearChat(chatId);
      // Remove all messages from the messages array that belong to this chat
      setMessages(prev => prev.filter(msg => msg.chatId !== chatId));
      return data;
    } catch (err) {
      setError(err.message || 'Failed to clear chat');
      console.error('Error clearing chat:', err);
      throw err;
    }
  }, []);

  const contextValue = useMemo(() => ({
    chats,
    activeChat,
    messages,
    chatsLoading,
    messagesLoading,
    error,
    sending,
    typingUsers, // ⌨️
    fetchChats,
    fetchMessages,
    sendMessage,
    editMessage,
    createChat,
    selectChat,
    fetchContacts,
    clearActiveChat,
    joinChat,
    addMessage,
    updateMessage,
    handleTyping, // ⌨️
    deleteMessageForMe,
    deleteMessageForEveryone,
    clearChat,
    setError
  }), [
    chats,
    activeChat,
    messages,
    chatsLoading,
    messagesLoading,
    error,
    sending,
    typingUsers, // ⌨️
    fetchChats,
    fetchMessages,
    sendMessage,
    editMessage,
    createChat,
    selectChat,
    fetchContacts,
    clearActiveChat,
    joinChat,
    addMessage,
    updateMessage,
    handleTyping, // ⌨️
    deleteMessageForMe,
    deleteMessageForEveryone,
    clearChat,
    setError
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

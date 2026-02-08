import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; // socket.io client
import { chatService } from '../services/chatService';
import { useUser } from './UserContext'; // Assuming you have an AuthContext
import { io } from "socket.io-client"; // socket.io client

const ChatContext = createContext();

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
  const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, ""); // socket.io client
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

    const joinChat = useCallback((chatId) => { // socket.io client
        if (socketRef.current && chatId) { // socket.io client
          console.log("Socket", socketRef.current.id, "joining chat", chatId); // socket.io client
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
    }, [activeChat]); // socket.io client

    useEffect(() => {
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          auth: { token: localStorage.getItem("authToken") },
        });

        socketRef.current.on("receive-message", (message) => {
          console.log("✅ SOCKET MESSAGE:", message);

          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
        });
      }
    }, [SOCKET_URL]);



  // Fetch all chats for the logged-in user
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getMyChats();
      setChats(data.chats || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch chats');
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getChatMessages(chatId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (receiverPhone, content, type = 'text') => {
    try {
      setSending(true);
      setError(null);
      const data = await chatService.sendMessage(receiverPhone, content, type);
      
      // Add new message to the messages array
      //setMessages(prev => [...prev, data.message]);
      // ❌ DO NOT update messages here
     // socket will deliver message to both sender & receiver
      
      // Refresh chat list to update last message
      await fetchChats();
      
      return data.message;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [fetchChats]);

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

  // Set active chat and fetch its messages
  const selectChat = useCallback(async (chat) => {
    setActiveChat(chat);
    if (chat && chat.chatId) {
      await fetchMessages(chat.chatId);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

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

  // Initial fetch of chats when user logs in
  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setActiveChat(null);
      setMessages([]);
    }
  }, [user, fetchChats]);

  const value = {
    // State
    chats,
    activeChat,
    messages,
    loading,
    error,
    sending,
    
    // Actions
    fetchChats,
    fetchMessages,
    sendMessage,
    editMessage,
    selectChat,
    clearActiveChat,
    joinChat, // socket.io client
    addMessage,
    updateMessage,
    setError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

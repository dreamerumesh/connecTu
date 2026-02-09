import api from "../utils/axiosConfig";

export const chatService = {
  /**
   * Get all chats for the logged-in user
   * @returns {Promise<{success: boolean, chats: Array}>}
   */
  getMyChats: async () => {
    try {
      const response = await api.get('/chats');
      return response.data;
    } catch (error) {
      console.error('Error in getMyChats:', error);
      throw error;
    }
  },

  /**
   * Get messages for a specific chat
   * @param {string} chatId - The chat ID
   * @returns {Promise<{success: boolean, messages: Array}>}
   */
  getChatMessages: async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      throw error;
    }
  },

  /**
   * Send a message to a user
   * @param {string} receiverPhone - Receiver's phone number
   * @param {string} content - Message content
   * @param {string} type - Message type (default: 'text')
   * @returns {Promise<{success: boolean, message: Object}>}
   */
  sendMessage: async (receiverPhone, content, type = 'text') => {
    try {
      const response = await api.post('/chats/send', {
        receiverPhone,
        content,
        type,
      });
      return response.data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  /**
   * Edit an existing message
   * @param {string} messageId - The message ID to edit
   * @param {string} newContent - New message content
   * @returns {Promise<{success: boolean, message: Object}>}
   */
  editMessage: async (messageId, newContent) => {
    try {
      const response = await api.put('/chats/edit-message', {
        messageId,
        newContent,
      });
      return response.data;
    } catch (error) {
      console.error('Error in editMessage:', error);
      throw error;
    }
  },

  /**
   * Create a new chat with a user (optional, can be done implicitly when sending first message)
   * @param {string} participantPhone - Participant's phone number
   * @returns {Promise<{success: boolean, chat: Object}>}
   */
  createChat: async (name,participantPhone) => {
    try {
      const response = await api.post('/chats/create', {
        name,
        phone: participantPhone
      });
      return response.data;
    } catch (error) {
      console.error('Error in createChat:', error);
      throw error;
    }
  },

  /** 
   * Get contacts of the logged-in user
   * @returns {Promise<{success: boolean, contacts: Array}>}
   */
  getContacts: async () => {
    try {
      const response = await api.get('/chats/contacts');
      return response.data;
    } catch (error) {
      console.error('Error in getContacts:', error);
      throw error;
    }
  }
  
};

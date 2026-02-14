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
  createChat: async (name,participantPhone,isNewContact=false) => {
    try {
      const response = await api.post('/chats/create', {
        name,
        phone: participantPhone,
        isNewContact
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
  },

  /**
   * Delete a message for the logged-in user
   * @param {string} messageId - The message ID to delete
   * @return {Promise<{success: boolean}>}
   * Note: This will only mark the message as deleted for the user, not for everyone.
   */
  deleteMessageForMe: async (messageId) => {  
    try {
      const response = await api.delete('/chats/delete-message', {
        data: { messageId }
      });
      return response.data;
    }
    catch (error) {
      console.error('Error in deleteMessageForMe:', error);
      throw error;
    }
  },

  /**
   * Delete a message for everyone (only if the logged-in user is the sender)
   * @param {string} messageId - The message ID to delete for everyone
   * @return {Promise<{success: boolean}>}
   * Note: This will mark the message as deleted for everyone, but only if the logged-in user is the sender of the message.
   */ 
  deleteMessageForEveryone: async (messageId) => {
    try {
      const response = await api.delete('/chats/delete-message-for-everyone', {
        data: { messageId }
      });
      return response.data;
    }
    catch (error) {
      console.error('Error in deleteMessageForEveryone:', error);
      throw error;
    }
  },

  /**
   * Clear chat history for the logged-in user (only marks messages as deleted for the user, does not delete for everyone)
   * @param {string} chatId - The chat ID to clear
   * @return {Promise<{success: boolean}>}
   * Note: This will mark all messages in the chat as deleted for the logged-in user, but will not delete them for everyone else.
   */
  clearChat: async (chatId) => {
    try {
      const response = await api.delete('/chats/clear-chat', {
        data: { chatId }
      });
      return response.data;
    }
    catch (error) {
      console.error('Error in clearChat:', error);
      throw error;
    } 
  }
  
};

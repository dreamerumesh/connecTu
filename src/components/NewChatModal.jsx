import { useState, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { Plus } from "lucide-react";

// ============ PLUS BUTTON ============
export function PlusButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-14 h-14
        bg-blue-600 hover:bg-blue-700
        rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        text-white
        transition
        ${className}
      `}
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}



// ============ MODAL COMPONENT ============
export default function NewChatModal({ isOpen, onClose, onChatCreated }) {
  const { fetchContacts, createChat, selectChat } = useChat();

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);

  // Normalize phone number
  const normalizePhone = (phone) =>
    phone?.replace(/\D/g, "").slice(-10);

  // Fetch contacts on modal open
  useEffect(() => {
    if (isOpen && contacts.length === 0) {
      const loadContacts = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchContacts();
          setContacts(data || []);
          setFilteredContacts(data || []);
        } catch (err) {
          setError(err.message || "Failed to load contacts");
          console.error("Error loading contacts:", err);
        } finally {
          setLoading(false);
        }
      };

      loadContacts();
    }
  }, [isOpen, fetchContacts]);

  // Filter contacts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(query) ||
          normalizePhone(contact.phone)?.includes(
            normalizePhone(searchQuery)
          )
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Handle contact selection
  const handleSelectContact = async (contact) => {
    try {
      setCreatingContact(true);
      const chat = await createChat(contact.name,contact.phone,false);
      //console.log("Chat created/selected:", chat);
      await selectChat(chat);

       onChatCreated(chat, {
        name: contact.name,
        phone: contact.phone
        });
    
      setError(null);
      // Reset and close
      setSearchQuery("");
      setNewContactName("");
      setNewContactPhone("");
      setIsCreatingNew(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create chat");
      console.error("Error creating chat:", err);
    } finally {
      setCreatingContact(false);
    }
  };

  // Handle create new contact
  const handleCreateNewContact = async (e) => {
    e.preventDefault();

    if (!newContactName.trim() || !newContactPhone.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (normalizePhone(newContactPhone)?.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setCreatingContact(true);
      setError(null);
      await createChat(newContactName,newContactPhone,true);
      // Reset and close
      setSearchQuery("");
      setNewContactName("");
      setNewContactPhone("");
      setIsCreatingNew(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create chat");
      console.error("Error creating chat:", err);
    } finally {
      setCreatingContact(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">
              {isCreatingNew ? "New Contact" : "Start Chat"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isCreatingNew ? (
              // New Contact Form
              <div className="p-4">
                <form onSubmit={handleCreateNewContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="Enter contact name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setError(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={creatingContact}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {creatingContact ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Search and Contact List
              <div className="flex flex-col h-full">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 shrink-0">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 mx-4 mt-2 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                )}

                {/* Contact List */}
                {!loading && (
                  <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        {contacts.length === 0
                          ? "No contacts available"
                          : "No contacts match your search"}
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {filteredContacts.map((contact) => (
                          <li
                            key={contact._id || contact.phone}
                            onClick={() => handleSelectContact(contact)}
                            disabled={creatingContact}
                            className="p-3 hover:bg-blue-50 cursor-pointer transition flex items-center gap-3 disabled:opacity-50"
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                              {contact.name?.[0]?.toUpperCase()}
                            </div>

                            {/* Contact Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">
                                {contact.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contact.phone}
                              </p>
                            </div>

                            {/* Chevron */}
                            <svg
                              className="w-5 h-5 text-gray-400 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* New Contact Button */}
                {!loading && !isCreatingNew && (
                  <div className="p-4 border-t border-gray-200 shrink-0">
                    <button
                      onClick={() => {
                        setIsCreatingNew(true);
                        setError(null);
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      + Add New Contact
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

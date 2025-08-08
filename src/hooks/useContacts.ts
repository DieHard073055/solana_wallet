import { useState, useEffect, useCallback } from 'react';

export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: number;
  lastUsed?: number;
}

const CONTACTS_STORAGE_KEY = 'thijoori_contacts';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Load contacts from localStorage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsedContacts = JSON.parse(stored);
        // Sort by lastUsed (most recent first), then by name
        const sortedContacts = parsedContacts.sort((a: Contact, b: Contact) => {
          if (a.lastUsed && b.lastUsed) {
            return b.lastUsed - a.lastUsed;
          }
          if (a.lastUsed && !b.lastUsed) return -1;
          if (!a.lastUsed && b.lastUsed) return 1;
          return a.name.localeCompare(b.name);
        });
        setContacts(sortedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = useCallback((contactsToSave: Contact[]) => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contactsToSave));
      setContacts(contactsToSave);
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  }, []);

  // Add a new contact
  const addContact = useCallback((name: string, address: string): boolean => {
    try {
      // Validate inputs
      if (!name.trim() || !address.trim()) {
        return false;
      }

      // Check if address already exists
      const existingContact = contacts.find(c => c.address === address.trim());
      if (existingContact) {
        // Update existing contact name if different
        if (existingContact.name !== name.trim()) {
          updateContact(existingContact.id, { name: name.trim() });
        }
        return true;
      }

      const newContact: Contact = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        address: address.trim(),
        createdAt: Date.now(),
      };

      const updatedContacts = [...contacts, newContact].sort((a, b) => {
        if (a.lastUsed && b.lastUsed) {
          return b.lastUsed - a.lastUsed;
        }
        if (a.lastUsed && !b.lastUsed) return -1;
        if (!a.lastUsed && b.lastUsed) return 1;
        return a.name.localeCompare(b.name);
      });

      saveContacts(updatedContacts);
      return true;
    } catch (error) {
      console.error('Error adding contact:', error);
      return false;
    }
  }, [contacts, saveContacts]);

  // Update a contact
  const updateContact = useCallback((id: string, updates: Partial<Contact>): boolean => {
    try {
      const updatedContacts = contacts.map(contact => 
        contact.id === id 
          ? { ...contact, ...updates }
          : contact
      );
      saveContacts(updatedContacts);
      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      return false;
    }
  }, [contacts, saveContacts]);

  // Delete a contact
  const deleteContact = useCallback((id: string): boolean => {
    try {
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      saveContacts(updatedContacts);
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  }, [contacts, saveContacts]);

  // Mark a contact as recently used (for sorting)
  const markContactUsed = useCallback((address: string) => {
    const contact = contacts.find(c => c.address === address);
    if (contact) {
      updateContact(contact.id, { lastUsed: Date.now() });
    }
  }, [contacts, updateContact]);

  // Find contact by address
  const getContactByAddress = useCallback((address: string): Contact | undefined => {
    return contacts.find(contact => contact.address === address);
  }, [contacts]);

  // Search contacts by name or address
  const searchContacts = useCallback((query: string): Contact[] => {
    if (!query.trim()) return contacts;
    
    const lowerQuery = query.toLowerCase().trim();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.address.toLowerCase().includes(lowerQuery)
    );
  }, [contacts]);

  // Get recently used contacts
  const getRecentContacts = useCallback((limit = 5): Contact[] => {
    return contacts
      .filter(contact => contact.lastUsed)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, limit);
  }, [contacts]);

  // Clear all contacts
  const clearAllContacts = useCallback(() => {
    try {
      localStorage.removeItem(CONTACTS_STORAGE_KEY);
      setContacts([]);
      return true;
    } catch (error) {
      console.error('Error clearing contacts:', error);
      return false;
    }
  }, []);

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    markContactUsed,
    getContactByAddress,
    searchContacts,
    getRecentContacts,
    clearAllContacts,
  };
};
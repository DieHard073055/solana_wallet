import React, { useState, useRef, useEffect } from 'react';
import { useContacts, Contact } from '../hooks/useContacts';
import { shortenAddress, isValidSolanaAddress } from '../utils/validation';

interface ContactSelectorProps {
  onSelectContact: (address: string, name?: string) => void;
  onAddContact?: (name: string, address: string) => void;
  currentAddress?: string;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({ 
  onSelectContact, 
  onAddContact,
  currentAddress 
}) => {
  const { contacts, searchContacts, getRecentContacts, addContact } = useContacts();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recentContacts = getRecentContacts(3);
  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setNewContactName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectContact = (contact: Contact) => {
    onSelectContact(contact.address, contact.name);
    setIsOpen(false);
  };

  const handleAddNewContact = () => {
    if (!newContactName.trim() || !currentAddress?.trim()) return;

    if (!isValidSolanaAddress(currentAddress)) {
      alert('Please enter a valid Solana address first');
      return;
    }

    const success = addContact(newContactName.trim(), currentAddress);
    if (success) {
      setNewContactName('');
      setShowAddForm(false);
      setIsOpen(false);
      onAddContact?.(newContactName.trim(), currentAddress);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowAddForm(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          height: '48px', // Match input height
          minWidth: '120px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        👥 Contacts
      </button>

      {isOpen && (
        <div
          className="card absolute top-full left-0 mt-2 w-80 z-50"
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-divider)'
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search Header */}
          <div style={{ 
            padding: '12px', 
            borderBottom: '1px solid var(--color-divider)' 
          }}>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ fontSize: '14px' }}
              autoFocus
            />
          </div>

          {/* Recent Contacts */}
          {!searchQuery && recentContacts.length > 0 && (
            <div style={{ padding: '8px' }}>
              <div style={{ 
                padding: '8px', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase' 
              }}>
                Recent
              </div>
              {recentContacts.map((contact) => (
                <button
                  key={contact.id}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleSelectContact(contact)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {contact.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        {shortenAddress(contact.address)}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {new Date(contact.lastUsed || contact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
              {contacts.length > recentContacts.length && (
                <div style={{ borderTop: '1px solid var(--color-divider)', margin: '8px 0' }}></div>
              )}
            </div>
          )}

          {/* All Contacts */}
          <div style={{ padding: '8px' }}>
            {!searchQuery && contacts.length > recentContacts.length && (
              <div style={{ 
                padding: '8px', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase' 
              }}>
                All Contacts
              </div>
            )}
            
            {filteredContacts.length === 0 ? (
              <div style={{ 
                padding: '24px 12px', 
                textAlign: 'center', 
                color: 'var(--color-text-secondary)' 
              }}>
                {searchQuery ? (
                  <div>
                    <p style={{ marginBottom: '8px' }}>No contacts match your search</p>
                    <p style={{ fontSize: '12px' }}>Try a different search term</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: '8px' }}>No contacts saved yet</p>
                    <p style={{ fontSize: '12px' }}>Add contacts for quick sending</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredContacts
                  .filter(contact => !recentContacts.find(rc => rc.id === contact.id))
                  .map((contact) => (
                    <button
                      key={contact.id}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        marginBottom: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {contact.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        {shortenAddress(contact.address)}
                      </div>
                    </button>
                  ))}
              </>
            )}
          </div>

          {/* Add Contact Form */}
          {currentAddress && isValidSolanaAddress(currentAddress) && (
            <div style={{ borderTop: '1px solid var(--color-divider)' }}>
              {!showAddForm ? (
                <button
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: 'var(--color-primary-gold)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setShowAddForm(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  Save current address as contact
                </button>
              ) : (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    Save as contact:
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginBottom: '12px' }}>
                    {shortenAddress(currentAddress)}
                  </div>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="input"
                    style={{ fontSize: '14px', marginBottom: '12px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewContact();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAddNewContact}
                      disabled={!newContactName.trim()}
                      style={{ flex: 1 }}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewContactName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactSelector;
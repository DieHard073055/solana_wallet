import React, { useState } from 'react';
import { useContacts, Contact } from '../hooks/useContacts';
import { isValidSolanaAddress, shortenAddress } from '../utils/validation';
import QRCodeScanner from './QRCodeScanner';

const ContactsManager: React.FC = () => {
  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    searchContacts,
    clearAllContacts
  } = useContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts;

  const handleAddContact = () => {
    setError('');

    if (!newContactName.trim()) {
      setError('Contact name is required');
      return;
    }

    if (!newContactAddress.trim()) {
      setError('Contact address is required');
      return;
    }

    if (!isValidSolanaAddress(newContactAddress.trim())) {
      setError('Invalid Solana address');
      return;
    }

    const success = addContact(newContactName.trim(), newContactAddress.trim());
    if (success) {
      setNewContactName('');
      setNewContactAddress('');
      setShowAddForm(false);
      setError('');
    } else {
      setError('Failed to add contact');
    }
  };

  const handleUpdateContact = () => {
    if (!editingContact) return;

    setError('');

    if (!newContactName.trim()) {
      setError('Contact name is required');
      return;
    }

    if (!newContactAddress.trim()) {
      setError('Contact address is required');
      return;
    }

    if (!isValidSolanaAddress(newContactAddress.trim())) {
      setError('Invalid Solana address');
      return;
    }

    const success = updateContact(editingContact.id, {
      name: newContactName.trim(),
      address: newContactAddress.trim()
    });

    if (success) {
      setEditingContact(null);
      setNewContactName('');
      setNewContactAddress('');
      setError('');
    } else {
      setError('Failed to update contact');
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingContact(contact);
    setNewContactName(contact.name);
    setNewContactAddress(contact.address);
    setShowAddForm(false);
    setError('');
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setNewContactName('');
    setNewContactAddress('');
    setError('');
  };

  const handleDelete = (contact: Contact) => {
    if (confirm(`Are you sure you want to delete "${contact.name}"?`)) {
      deleteContact(contact.id);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all contacts? This cannot be undone.')) {
      clearAllContacts();
    }
  };

  const handleQRScan = (scannedAddress: string) => {
    setNewContactAddress(scannedAddress);
    setShowScanner(false);
    setError('');
  };

  const handleScanError = (error: string) => {
    setError(`QR Scan Error: ${error}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gold">Contacts</h2>
        <div className="flex gap-4">
          {contacts.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingContact(null);
              setNewContactName('');
              setNewContactAddress('');
              setError('');
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Contact'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {contacts.length > 0 && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search contacts by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
        </div>
      )}

      {/* Add/Edit Contact Form */}
      {(showAddForm || editingContact) && (
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-medium mb-6">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            
            {error && (
              <div className="alert alert-error mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Contact Name:
                </label>
                <input
                  type="text"
                  placeholder="Enter contact name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Thijoori Address:
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter Thijoori address"
                    value={newContactAddress}
                    onChange={(e) => setNewContactAddress(e.target.value)}
                    className="input font-mono"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={`btn ${showScanner ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setShowScanner(!showScanner)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {showScanner ? '✕ Close' : '📷 Scan QR'}
                  </button>
                </div>
                
                {showScanner && (
                  <div className="mt-4">
                    <QRCodeScanner
                      isActive={showScanner}
                      onScan={handleQRScan}
                      onError={handleScanError}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4" style={{ marginTop: '24px' }}>
                <button
                  className="btn btn-primary"
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={editingContact ? cancelEditing : () => {
                    setShowAddForm(false);
                    setNewContactName('');
                    setNewContactAddress('');
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="card card-alt text-center">
          <div className="card-body">
            <p className="text-secondary text-lg mb-4">
              {searchQuery ? 'No contacts match your search' : 'No contacts saved yet'}
            </p>
            {!searchQuery && (
              <p className="text-muted">
                Add contacts to quickly send funds to frequent recipients.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-primary mb-2">
                      {contact.name}
                    </h3>
                    <p className="text-secondary font-mono text-sm">
                      {shortenAddress(contact.address)}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '24px', 
                      marginTop: '12px', 
                      fontSize: '12px', 
                      color: 'var(--color-text-muted)' 
                    }}>
                      <span>
                        Added: {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                      {contact.lastUsed && (
                        <span>
                          Last used: {new Date(contact.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEditing(contact)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(contact)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted text-sm">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
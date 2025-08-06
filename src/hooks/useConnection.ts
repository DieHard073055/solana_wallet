import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { ConnectionState } from '../types/wallet';
import { saveConnectionEndpoint, loadConnectionEndpoint } from '../utils/storage';

export const useConnection = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    endpoint: loadConnectionEndpoint(),
    isConnected: false,
    slot: null,
  });
  
  const [connection, setConnection] = useState<Connection | null>(null);

  const connectToEndpoint = async (endpoint: string) => {
    try {
      const newConnection = new Connection(endpoint, 'confirmed');
      
      const slot = await newConnection.getSlot();
      
      setConnection(newConnection);
      setConnectionState({
        endpoint,
        isConnected: true,
        slot,
      });
      
      saveConnectionEndpoint(endpoint);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        slot: null,
      }));
      return false;
    }
  };

  const updateSlot = async () => {
    if (!connection) return;
    
    try {
      const slot = await connection.getSlot();
      setConnectionState(prev => ({
        ...prev,
        slot,
      }));
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };

  useEffect(() => {
    connectToEndpoint(connectionState.endpoint);
  }, []);

  useEffect(() => {
    if (!connectionState.isConnected) return;

    const interval = setInterval(updateSlot, 10000);
    return () => clearInterval(interval);
  }, [connectionState.isConnected, connection]);

  return {
    connection,
    connectionState,
    connectToEndpoint,
    updateSlot,
  };
};
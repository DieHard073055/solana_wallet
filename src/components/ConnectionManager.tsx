import React, { useState } from 'react';
import { useConnection } from '../hooks/useConnection';

const ConnectionManager: React.FC = () => {
  const { connection, connectionState, connectToEndpoint, updateSlot } = useConnection();
  const [customEndpoint, setCustomEndpoint] = useState(connectionState.endpoint);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectToEndpoint(customEndpoint);
    setIsConnecting(false);
  };

  const handleRefreshSlot = async () => {
    await updateSlot();
  };

  const getStatusColor = () => {
    return connectionState.isConnected ? '#28a745' : '#dc3545';
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h3>Network Connection</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            RPC Endpoint:
          </label>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="https://alina.tail6aed97.ts.net"
            style={{ 
              width: '300px', 
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          />
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isConnecting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnecting ? 'not-allowed' : 'pointer'
            }}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '10px' 
        }}>
          <span style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: getStatusColor(),
            marginRight: '8px'
          }}></span>
          <span>
            <strong>Status:</strong> {connectionState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <p><strong>Endpoint:</strong> {connectionState.endpoint}</p>
        
        {connectionState.isConnected && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span><strong>Current Slot:</strong> {connectionState.slot || 'Loading...'}</span>
              <button 
                onClick={handleRefreshSlot}
                style={{ 
                  marginLeft: '10px',
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {!connectionState.isConnected && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <strong>Connection Failed:</strong> Please check your RPC endpoint and try again.
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
        <p><strong>Common Endpoints:</strong></p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Mainnet: https://alina.tail6aed97.ts.net</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionManager;

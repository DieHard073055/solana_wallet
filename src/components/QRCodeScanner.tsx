import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onError, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (isActive) {
      QrScanner.hasCamera().then(result => {
        setHasCamera(result);
        if (!result) {
          onError?.('No camera found');
          return;
        }

        scannerRef.current = new QrScanner(
          video,
          result => {
            onScan(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current.start().catch(err => {
          console.error('Failed to start QR scanner:', err);
          onError?.('Failed to access camera');
        });
      });
    } else {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isActive, onScan, onError]);

  if (!hasCamera) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#3a3a3a',
        border: '1px solid #555',
        borderRadius: '8px',
        color: '#fff'
      }}>
        <p>Camera not available</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Please ensure your device has a camera and you've granted permission to access it.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
      />
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          Point your camera at a QR code
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
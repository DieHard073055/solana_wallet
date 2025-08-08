import React, { useEffect, useRef, useState, useCallback } from 'react';
import QrScanner from 'qr-scanner';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onError, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const initializingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  // Keep refs up to date
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch (error) {
        console.warn('Error during scanner cleanup:', error);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  const resetScanner = useCallback(async () => {
    setScanCount(0);
    cleanupScanner();
    setHasCamera(null);
    initializingRef.current = false;
  }, [cleanupScanner]);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!mounted || !isActive) {
        cleanupScanner();
        return;
      }

      if (!videoRef.current || scannerRef.current || initializingRef.current) return;

      initializingRef.current = true;
      setIsInitializing(true);
      const video = videoRef.current;

      try {
        console.log('Checking camera availability...');
        const cameraAvailable = await QrScanner.hasCamera();
        console.log('Camera available:', cameraAvailable);
        
        if (!mounted) return;
        
        setHasCamera(cameraAvailable);
        
        if (!cameraAvailable) {
          console.log('No camera found');
          onErrorRef.current?.('No camera found');
          return;
        }

        console.log('Creating QR scanner...');

        const canvas = document.createElement('canvas');
        canvas.getContext('2d', { willReadFrequently: true });

        scannerRef.current = new QrScanner(
          video,
          result => {
            console.log('QR code detected:', result.data);
            setScanCount(prev => prev + 1);
            onScanRef.current(result.data);
          },
          {
            onDecodeError: error => {
              // Only log errors, not normal "No QR code found"
              if (error !== QrScanner.NO_QR_CODE_FOUND) {
                console.log('QR scan error:', error);
              }
            },
            calculateScanRegion: (video) => {
              // Use larger scan region for better detection
              const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanSize = Math.round(0.8 * smallestDimension);
              return {
                x: Math.round((video.videoWidth - scanSize) / 2),
                y: Math.round((video.videoHeight - scanSize) / 2),
                width: scanSize,
                height: scanSize,
              };
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 15,
            returnDetailedScanResult: true,
          }
        );

        // Set inversion mode to handle different QR code styles
        scannerRef.current.setInversionMode('both');

        console.log('Starting QR scanner...');
        await scannerRef.current.start();
        console.log('QR scanner started successfully');
      } catch (err) {
        console.error('Failed to start QR scanner:', err);
        if (mounted) {
          onErrorRef.current?.('Failed to access camera');
          setHasCamera(false);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
          initializingRef.current = false;
        }
      }
    };

    // Add small delay to ensure video element is ready
    const timeoutId = setTimeout(setup, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      cleanupScanner();
    };
  }, [isActive]);

  if (hasCamera === false) {
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
      margin: '0 auto',
      aspectRatio: '1',
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
        playsInline
        muted
        autoPlay
        controls={false}
      />
      {isInitializing && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          Initializing camera...
        </div>
      )}
      {isActive && !isInitializing && hasCamera && (
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
          {scanCount > 0 && (
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
              Scans: {scanCount}
            </div>
          )}
        </div>
      )}
      {isActive && !isInitializing && hasCamera && (
        <button
          onClick={resetScanner}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Reset Camera
        </button>
      )}
    </div>
  );
};

export default QRCodeScanner;
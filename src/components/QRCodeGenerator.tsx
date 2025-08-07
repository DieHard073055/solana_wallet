import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#2a2a2a'
        }
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [value, size]);

  if (!value) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3a3a3a',
        border: '1px solid #555',
        borderRadius: '8px'
      }}>
        <span style={{ color: '#b0b0b0' }}>No address</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      display: 'inline-block'
    }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default QRCodeGenerator;
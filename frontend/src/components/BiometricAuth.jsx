import { useState, useRef, useEffect } from 'react';
import { loadModels, getFaceDescriptor, compareFaces } from '../services/FaceService';

export default function BiometricAuth({ mode, onComplete, onCancel, registeredDescriptor }) {
  const [status, setStatus] = useState('initializing'); // initializing, ready, scanning, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      setStatus('initializing');
      const loaded = await loadModels();
      if (!loaded) {
        setStatus('error');
        setErrorMsg('Failed to load Face ID models.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setErrorMsg('Camera access denied. Face ID requires a webcam.');
      }
    };

    init();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleAction = async () => {
    if (status !== 'ready') return;
    setStatus('scanning');

    // Wait a moment for the camera to stabilize
    await new Promise(r => setTimeout(r, 800));

    const descriptor = await getFaceDescriptor(videoRef.current);

    if (!descriptor) {
      setStatus('ready');
      alert('Face not detected. Please ensure your face is clearly visible.');
      return;
    }

    if (mode === 'REGISTER') {
      setStatus('success');
      setTimeout(() => onComplete(descriptor), 1000);
    } else {
      const match = compareFaces(descriptor, registeredDescriptor);
      if (match) {
        setStatus('success');
        setTimeout(() => onComplete(), 1000);
      } else {
        setStatus('ready');
        alert('Face does not match the registered Caregiver ID.');
      }
    }
  };

  return (
    <div className="biometric-modal">
      <div className="biometric-content">
        <div className="biometric-header">
          <h2>{mode === 'REGISTER' ? 'Register Face ID' : 'Face ID Verification'}</h2>
          <p>{status === 'initializing' ? 'Loading AI Brain...' : 'Position your face in the center'}</p>
        </div>

        <div className={`camera-container ${status}`}>
          <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
          <div className="scan-ring">
            <div className="scan-beam"></div>
          </div>
          {status === 'success' && <div className="success-overlay">✅ Verified</div>}
        </div>

        <div className="biometric-footer">
          {status === 'ready' && (
            <button className="btn btn-primary" onClick={handleAction}>
              {mode === 'REGISTER' ? 'Capture Face Data' : 'Verify Identity'}
            </button>
          )}
          {status === 'scanning' && <p>Scanning Identity...</p>}
          {status === 'error' && <p className="text-danger">{errorMsg}</p>}
          
          <button className="btn btn-outline" onClick={onCancel} style={{ marginTop: 10 }}>
            Use PIN Instead
          </button>
        </div>
      </div>
    </div>
  );
}

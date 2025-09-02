import type { Component } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

interface CameraProps {
  onCapture: (blob: Blob) => void;
}

const Camera: Component<CameraProps> = (props) => {
  let videoRef!: HTMLVideoElement;
  let canvasRef!: HTMLCanvasElement;
  let fileInputRef!: HTMLInputElement;
  
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [hasCamera, setHasCamera] = createSignal(true);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('Requesting camera access...');
      
      // Wait for DOM elements to be available
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkRefs = () => {
          attempts++;
          console.log(`Checking refs attempt ${attempts}, videoRef exists:`, !!videoRef);
          
          if (videoRef && videoRef instanceof HTMLVideoElement) {
            console.log('Video element found and is HTMLVideoElement');
            resolve(null);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Video element not available after waiting'));
          } else {
            setTimeout(checkRefs, 100);
          }
        };
        
        checkRefs();
      });
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks().length);
      console.log('Video ref exists:', !!videoRef);
      
      if (!videoRef) {
        throw new Error('Video element not available');
      }
      
      setStream(mediaStream);
      videoRef.srcObject = mediaStream;
      
      // Wait for video to be ready before setting streaming state
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000); // 10 second timeout
        
        const onLoadedMetadata = () => {
          console.log('Video metadata loaded');
          clearTimeout(timeout);
          videoRef.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (e: Event) => {
          console.error('Video element error:', e);
          clearTimeout(timeout);
          videoRef.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoRef.removeEventListener('error', onError);
          reject(new Error('Video element failed to load'));
        };
        
        videoRef.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.addEventListener('error', onError);
        
        // If video is already ready
        if (videoRef.readyState >= 1) {
          onLoadedMetadata();
        }
      });
      
      console.log('Video ready, setting streaming to true');
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      console.error('Error details:', {
        name: (err as any).name,
        message: (err as any).message,
        stack: (err as any).stack
      });
      
      setHasCamera(false);
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('Camera access denied. Please allow camera permission and try again.');
            break;
          case 'NotFoundError':
            setError('No camera found on this device.');
            break;
          case 'NotReadableError':
            setError('Camera is already in use by another application.');
            break;
          default:
            setError(`Camera error: ${err.message}. Please try using file upload instead.`);
        }
      } else {
        setError(`Failed to access camera: ${(err as Error).message}. Please try using file upload instead.`);
      }
    }
  };

  const stopCamera = () => {
    const currentStream = stream();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  const captureImage = () => {
    console.log('Capturing image...');
    console.log('Video ref exists:', !!videoRef);
    console.log('Canvas ref exists:', !!canvasRef);
    console.log('Is streaming:', isStreaming());
    
    if (!videoRef || !canvasRef || !isStreaming()) {
      console.error('Cannot capture: missing refs or not streaming');
      return;
    }

    const canvas = canvasRef;
    const video = videoRef;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        props.onCapture(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      props.onCapture(file);
      // Clear the input for next use
      target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.click();
  };

  onMount(() => {
    // Check if camera is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      // Don't start camera automatically - let user decide
    } else {
      setHasCamera(false);
      setError('Camera not supported on this device. Please use file upload.');
    }
  });

  onCleanup(() => {
    stopCamera();
  });

  return (
    <div class="camera-container">
      {/* Always render video element but hide when not streaming */}
      <video 
        ref={videoRef!}
        autoplay 
        playsinline 
        muted
        webkit-playsinline
        controls={false}
        class="camera-video"
        style={{
          display: isStreaming() ? 'block' : 'none'
        }}
      />

      <Show 
        when={!error()}
        fallback={
          <div class="camera-error">
            <div class="error-icon">📷</div>
            <p>{error()}</p>
            <div class="camera-fallback">
              <button onClick={triggerFileInput} class="button primary">
                📂 Upload Image Instead
              </button>
            </div>
          </div>
        }
      >
        <Show
          when={isStreaming()}
          fallback={
            <div class="camera-placeholder">
              <div class="placeholder-content">
                <div class="camera-icon">📷</div>
                <h3>Take a photo of the license plate</h3>
                <p>Position the license plate clearly in the frame for best results</p>
                <Show when={hasCamera()}>
                  <button onClick={startCamera} class="button primary large">
                    Start Camera
                  </button>
                </Show>
                <div class="camera-alternatives">
                  <button onClick={triggerFileInput} class="button secondary">
                    📂 Upload Image
                  </button>
                </div>
              </div>
            </div>
          }
        >
          <div class="video-container">
            <div class="camera-overlay">
              <div class="viewfinder">
                <div class="viewfinder-corner top-left"></div>
                <div class="viewfinder-corner top-right"></div>
                <div class="viewfinder-corner bottom-left"></div>
                <div class="viewfinder-corner bottom-right"></div>
              </div>
            </div>
            <div class="camera-controls">
              <button onClick={stopCamera} class="button secondary">
                ❌ Stop
              </button>
              <button onClick={captureImage} class="button capture-btn" title="Capture">
                <div class="capture-inner"></div>
              </button>
              <button onClick={triggerFileInput} class="button secondary">
                📂 Upload
              </button>
            </div>
          </div>
        </Show>
      </Show>

      {/* Hidden file input */}
      <input
        ref={fileInputRef!}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef!} style={{ display: 'none' }} />

      <div class="camera-tips">
        <h4>📋 Tips for best results:</h4>
        <ul>
          <li>Ensure good lighting</li>
          <li>Hold the camera steady</li>
          <li>Keep the plate parallel to the camera</li>
          <li>Fill most of the frame with the license plate</li>
          <li>Avoid reflections and shadows</li>
        </ul>
      </div>
    </div>
  );
};

export default Camera;
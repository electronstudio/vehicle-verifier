import type { Component } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

interface CameraProps {
  onCapture: (blob: Blob) => void;
}

const Camera: Component<CameraProps> = (props) => {
  let videoRef!: HTMLVideoElement;
  let canvasRef!: HTMLCanvasElement;
  let cameraInputRef!: HTMLInputElement;
  let photoInputRef!: HTMLInputElement;
  
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [_hasCamera, setHasCamera] = createSignal(true);

  const startCamera = () => {
    console.log('Triggering native camera...');
    cameraInputRef.click();
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

  const triggerPhotoLibrary = () => {
    console.log('Opening photo library...');
    photoInputRef.click();
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
              <button onClick={triggerPhotoLibrary} class="button primary">
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
                <div class="camera-buttons">
                  <button onClick={startCamera} class="button primary large">
                    📷 Take Photo
                  </button>
                  <button onClick={triggerPhotoLibrary} class="button secondary">
                    📂 Choose from Photos
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
              <button onClick={triggerPhotoLibrary} class="button secondary">
                📂 Upload
              </button>
            </div>
          </div>
        </Show>
      </Show>

      {/* Hidden camera input - launches camera */}
      <input
        ref={cameraInputRef!}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Hidden photo library input - opens photo library */}
      <input
        ref={photoInputRef!}
        type="file"
        accept="image/*"
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
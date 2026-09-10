import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Camera, Loader2 } from 'lucide-react';
import { Card } from './common';

const MODEL_URL = import.meta.env.VITE_FACE_API_MODELS_URL ||
  'https://justadudewhohacks.github.io/face-api.js/models';

const videoConstraints = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

let modelsLoadPromise;

const loadFaceModels = () => {
  if (!modelsLoadPromise) {
    modelsLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((loadError) => {
      modelsLoadPromise = undefined;
      throw loadError;
    });
  }
  return modelsLoadPromise;
};

const FaceCapture = ({ onCapture, onReset, disabled = false, resetKey = 0, showRefresh = false, continuous = false }) => {
  const webcamRef = useRef(null);
  const onCaptureRef = useRef(onCapture);
  const scanInProgressRef = useRef(false);
  const previousResetKeyRef = useRef(resetKey);
  const [cameraKey, setCameraKey] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const stopCamera = () => {
    const stream = webcamRef.current?.video?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
  };

  const restartCamera = () => {
    if (restarting || disabled) return;
    stopCamera();
    scanInProgressRef.current = false;
    setRestarting(true);
    setError('');
    setCapturedImage(null);
    setVideoReady(false);
    onReset?.();
    setCameraKey((current) => current + 1);
  };

  useEffect(() => {
    if (disabled) return undefined;
    let cancelled = false;
    setLoadingModels(true);
    loadFaceModels().then(() => {
      if (!cancelled) setModelsReady(true);
    }).catch(() => {
      if (!cancelled) setError('Face recognition models could not be loaded. Check your connection and try again.');
    }).finally(() => {
      if (!cancelled) setLoadingModels(false);
    });
    return () => { cancelled = true; };
  }, [disabled]);

  useEffect(() => {
    if (videoReady) setRestarting(false);
  }, [videoReady]);

  useEffect(() => {
    if (disabled || !modelsReady || !videoReady || (!continuous && capturedImage)) return undefined;
    let cancelled = false;
    const scan = async () => {
      const video = webcamRef.current?.video;
      if (!video || cancelled || scanInProgressRef.current
        || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        || !Number.isFinite(video.videoWidth) || !Number.isFinite(video.videoHeight)
        || video.videoWidth < 1 || video.videoHeight < 1) return;
      scanInProgressRef.current = true;
      try {
        const detectorOptions = new faceapi.TinyFaceDetectorOptions();
        const faceDetections = await faceapi.detectAllFaces(video, detectorOptions);
        const hasInvalidBox = faceDetections.some(({ box }) => (
          !box
          || ![box.x, box.y, box.width, box.height].every(Number.isFinite)
          || box.width <= 0
          || box.height <= 0
        ));
        if (hasInvalidBox) return;

        const detections = await faceapi.detectAllFaces(video, detectorOptions).withFaceLandmarks().withFaceDescriptors();
        if (cancelled) return;
        if (detections.length !== 1) {
          setError(detections.length === 0 ? 'No face detected. Keep one face clearly visible inside the frame.' : 'Multiple faces detected. Only one face may be captured.');
          return;
        }
        const detection = detections[0];
        const { box } = detection.detection;
        const faceIsInFrame = box && box.x >= 0 && box.y >= 0
          && box.x + box.width <= video.videoWidth
          && box.y + box.height <= video.videoHeight;
        const faceIsLargeEnough = box && box.width / video.videoWidth >= 0.15;
        if (detection.detection.score < 0.5 || !faceIsInFrame || !faceIsLargeEnough) {
          setError('Face is too far away or unclear. Move closer and keep your full face inside the frame.');
          return;
        }
        const image = webcamRef.current?.getScreenshot();
        setError('');
        if (!continuous) setCapturedImage(image);
        onCaptureRef.current?.({ descriptor: Array.from(detection.descriptor), image, samples: [{ descriptor: Array.from(detection.descriptor), image, detectionScore: detection.detection.score }], detectionConfidence: detection.detection.score, detectedFaceCount: 1 });
      } catch (detectionError) {
        if (!cancelled) console.debug('[FaceCapture] skipped invalid camera frame', { message: detectionError.message });
      } finally {
        scanInProgressRef.current = false;
      }
    };
    const timer = window.setInterval(() => { void scan().catch(() => undefined); }, 250);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [disabled, modelsReady, videoReady, capturedImage, continuous]);

  useEffect(() => {
    setCapturedImage(null);
    setVideoReady(false);
    if (previousResetKeyRef.current !== resetKey) {
      previousResetKeyRef.current = resetKey;
      stopCamera();
      scanInProgressRef.current = false;
      setRestarting(true);
      setError('');
      setCameraKey((current) => current + 1);
    }
  }, [disabled, resetKey]);

  return (
    <Card className="overflow-hidden border border-gray-200 p-0 dark:border-slate-800">
      <div className="relative aspect-video bg-slate-950">
        {!disabled && <Webcam key={cameraKey} ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} onUserMedia={() => setVideoReady(true)} onLoadedMetadata={() => setVideoReady(true)} onUserMediaError={() => { setRestarting(false); setError('Camera could not be restarted. Allow camera access, then click Refresh Camera to try again.'); }} className="h-full w-full object-cover" />}
        {!disabled && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-3/5 w-2/5 rounded-[45%] border-2 border-emerald-300 shadow-[0_0_0_999px_rgba(15,23,42,0.3)]" /></div>}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">{loadingModels || restarting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}<span>{loadingModels ? 'Loading face recognition...' : restarting ? 'Restarting camera...' : capturedImage ? 'Face detected. Verifying identity...' : 'Position your face inside the frame'}</span></div>{showRefresh && <button type="button" onClick={restartCamera} disabled={disabled || restarting} className="shrink-0 rounded-lg border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50">{restarting ? 'Restarting...' : '↻ Refresh Camera'}</button>}</div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      </div>
    </Card>
  );
};

export default FaceCapture;
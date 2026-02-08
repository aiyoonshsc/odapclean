import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-modal';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropModal.css';
import { autoCropImage } from '../services/api';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: File) => void;
  aspect?: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete, aspect }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const [isAutoCropping, setIsAutoCropping] = useState(false);
  
  // Trigger auto-crop when image loads (only once per imageSrc change)
  const autoCropTriggered = useRef(false);
  useEffect(() => {
    autoCropTriggered.current = false;
  }, [imageSrc]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    imgRef.current = e.currentTarget;
    
    // Default center crop if auto-crop hasn't run yet
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect || 16 / 9,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
    
    // Run auto-crop
    if (!autoCropTriggered.current && imageSrc) {
        autoCropTriggered.current = true;
        handleAutoCrop(naturalWidth, naturalHeight, width, height);
    }
  }

  async function handleCrop() {
    if (completedCrop && imgRef.current) {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop, 'cropped.jpeg');
      onCropComplete(croppedImage);
      onClose();
    }
  }

  async function handleAutoCrop(naturalWidth: number, naturalHeight: number, displayWidth: number, displayHeight: number) {
    if (!imageSrc) return;
    
    try {
      setIsAutoCropping(true);
      const blob = dataURItoBlob(imageSrc);
      const file = new File([blob], "original.jpg", { type: "image/jpeg" });
      const bounds = await autoCropImage(file);
      
      // Convert natural bounds to display bounds (pixels)
      // bounds are based on original image size (naturalWidth/Height)
      // displayWidth/Height is the rendered size
      
      const scaleX = displayWidth / naturalWidth;
      const scaleY = displayHeight / naturalHeight;
      
      const newCrop: PixelCrop = {
          unit: 'px',
          x: bounds.x * scaleX,
          y: bounds.y * scaleY,
          width: bounds.width * scaleX,
          height: bounds.height * scaleY
      };
      
      // Ensure aspect ratio is maintained if required
      if (aspect) {
          // If aspect is enforced, we might need to adjust the box to fit aspect
          // This logic can be complex, for now let's just use makeAspectCrop centered on the detected center
          const center = centerCrop(
              makeAspectCrop(
                { unit: 'px', width: newCrop.width },
                aspect,
                displayWidth,
                displayHeight
              ),
              displayWidth,
              displayHeight
          );
          setCrop(center);
      } else {
          setCrop(newCrop);
      }

    } catch (error) {
      console.error("Auto crop failed:", error);
      // Fail silently or show toast, but don't block user
    } finally {
      setIsAutoCropping(false);
    }
  }

  function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return Promise.reject(new Error('Canvas context is not available'));
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        },
        'image/jpeg',
        0.95
      );
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Crop Image"
      className="modal-content image-crop-modal"
      overlayClassName="modal-overlay"
    >
      <h2>이미지 자르기</h2>
      {imageSrc && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
        >
          <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Crop me" style={{ maxHeight: '70vh' }}/>
        </ReactCrop>
      )}
      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={isAutoCropping}>취소</button>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={handleAutoCrop}
          disabled={isAutoCropping}
        >
          {isAutoCropping ? '인식 중...' : '자동 영역 인식'}
        </button>
        <button type="button" className="btn-primary" onClick={handleCrop} disabled={isAutoCropping}>자르기</button>
      </div>
    </Modal>
  );
};

function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export default ImageCropModal;

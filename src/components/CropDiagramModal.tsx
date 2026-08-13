import React, { useState, useRef } from 'react';
import { X, Crop, Upload, Loader2, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

interface CropDiagramModalProps {
  file: File | null;
  token: string | null;
  onCropComplete: (imageUrl: string) => void;
  onClose: () => void;
}

export const CropDiagramModal: React.FC<CropDiagramModalProps> = ({
  token,
  onCropComplete,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selection rectangle coordinates
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setCropBox(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCropBox({ x, y, w: 0, h: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !startPos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const w = Math.abs(currentX - startPos.x);
    const h = Math.abs(currentY - startPos.y);

    setCropBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropAndSave = async () => {
    if (!cropBox || !imageRef.current || cropBox.w < 10 || cropBox.h < 10) {
      setErrorMsg('Please drag a valid rectangular crop selection over the diagram.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const img = imageRef.current;
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;

      const canvas = document.createElement('canvas');
      canvas.width = cropBox.w * scaleX;
      canvas.height = cropBox.h * scaleY;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(
        img,
        cropBox.x * scaleX,
        cropBox.y * scaleY,
        cropBox.w * scaleX,
        cropBox.h * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedBase64 = canvas.toDataURL('image/png');

      const response = await fetch(`${API_BASE}/api/admin/pyq/crop-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ base64Image: croppedBase64 }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload crop');

      onCropComplete(data.imageUrl);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Crop upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Crop className="text-amber-400" size={20} />
            <h3 className="text-base font-bold text-white">✂️ Interactive Diagram Bounding-Box Cropper</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {!imageSrc ? (
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center space-y-4 bg-neutral-950/50 hover:border-amber-400/50 transition">
              <Upload size={40} className="mx-auto text-amber-400 opacity-80" />
              <div>
                <p className="text-sm font-bold text-white">Select PDF Page / Screenshot Image</p>
                <p className="text-xs text-neutral-400 mt-1">Upload the page screenshot or PDF image to crop diagrams</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageFileChange}
                className="block w-full max-w-xs mx-auto text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-neutral-950 hover:file:bg-amber-300 cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Click & drag your mouse over the diagram or chemical structure to select crop region:</span>
                <label className="text-amber-400 hover:underline cursor-pointer">
                  Change Image
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                </label>
              </div>

              {/* Crop Canvas Container */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative cursor-crosshair select-none border border-white/20 rounded-xl overflow-hidden bg-neutral-950 flex justify-center items-center max-h-[60vh]"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Page to Crop"
                  className="max-h-[60vh] object-contain pointer-events-none"
                />

                {/* Selection Bounding Box Overlay */}
                {cropBox && cropBox.w > 0 && cropBox.h > 0 && (
                  <div
                    className="absolute border-2 border-amber-400 bg-amber-400/20 shadow-lg pointer-events-none"
                    style={{
                      left: `${cropBox.x}px`,
                      top: `${cropBox.y}px`,
                      width: `${cropBox.w}px`,
                      height: `${cropBox.h}px`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-amber-400 text-neutral-950 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      {Math.round(cropBox.w)} x {Math.round(cropBox.h)} px
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {imageSrc && (
          <div className="p-4 border-t border-white/10 bg-neutral-950 flex justify-between items-center">
            <button onClick={() => setCropBox(null)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition">
              Reset Selection
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition">
                Cancel
              </button>
              <button
                onClick={handleCropAndSave}
                disabled={isUploading || !cropBox}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                {isUploading ? 'Compressing & Saving...' : 'Crop & Save WebP Diagram'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

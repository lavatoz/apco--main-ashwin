import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadImages } from '../../../services/gallery';

interface GalleryImageUploaderProps {
  collectionId: string;
  onUploadSuccess: () => void;
}

export const GalleryImageUploader: React.FC<GalleryImageUploaderProps> = ({
  collectionId,
  onUploadSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArr);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0 || !collectionId) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      await uploadImages(collectionId, selectedFiles);
      setUploadStatus('success');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess();
    } catch (err: any) {
      console.error('Gallery image upload failed:', err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to upload images to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-white">Upload Images</h3>
          <p className="text-zinc-400 text-xs font-medium mt-1">
            Upload high-resolution gallery images directly to Google Drive storage.
          </p>
        </div>
        {selectedFiles.length > 0 && (
          <button
            onClick={() => setSelectedFiles([])}
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Drag & Drop Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
          isUploading
            ? 'border-blue-500/50 bg-blue-500/5'
            : selectedFiles.length > 0
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload className={`w-10 h-10 mb-4 transition-transform duration-300 ${isUploading ? 'animate-bounce text-blue-400' : 'text-zinc-400'}`} />
        
        {selectedFiles.length === 0 ? (
          <>
            <p className="text-sm font-bold text-white uppercase tracking-wider">
              Drag & Drop images here or <span className="text-blue-400 underline">Browse</span>
            </p>
            <p className="text-xs text-zinc-500 mt-2">Supports JPG, PNG, WEBP (Max 15MB per file)</p>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              {selectedFiles.length} file(s) selected
            </p>
            <p className="text-xs text-zinc-400 max-w-md truncate">
              {selectedFiles.map((f) => f.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Upload Status Alerts */}
      {isUploading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Uploading images to Google Drive... Please wait.</span>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <CheckCircle className="w-4 h-4" />
          <span>Images uploaded successfully!</span>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage || 'Failed to upload images.'}</span>
          </div>
          <button
            onClick={startUpload}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Action Button */}
      {selectedFiles.length > 0 && !isUploading && (
        <div className="flex justify-end">
          <button
            onClick={startUpload}
            className="px-8 py-3.5 bg-white text-black font-black uppercase text-xs rounded-xl tracking-widest hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            Upload {selectedFiles.length} Image(s)
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryImageUploader;

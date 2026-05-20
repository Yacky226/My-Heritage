import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, File, Trash2, ShieldCheck } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: Array<{ name: string; size: string; type: string }>) => void;
  selectedFiles: Array<{ name: string; size: string; type: string }>;
}

export function UploadZone({ onFilesSelected, selectedFiles }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (filesList: FileList | null) => {
    if (!filesList) return;
    
    const newFilesArray: Array<{ name: string; size: string; type: string }> = [];
    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      const isMB = f.size > 1024 * 1024;
      const sizeStr = isMB 
        ? (f.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (f.size / 1024).toFixed(1) + ' KB';
        
      newFilesArray.push({
        name: f.name,
        size: sizeStr,
        type: f.type || 'application/octet-stream',
      });
    }

    onFilesSelected([...selectedFiles, ...newFilesArray]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, idx) => idx !== index);
    onFilesSelected(updated);
  };

  return (
    <div className="w-full text-left">
      {/* Upload boundary */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`
          border-2 border-dashed rounded-2xl p-8 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-200 min-h-[220px]
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/5 scale-[0.99] shadow-inner'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
        />

        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-4 shrink-0 shadow-2xs">
          <UploadCloud className="w-6 h-6 animate-pulse" />
        </div>

        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          Drag and drop sensitive data here
        </h4>
        <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mb-4 leading-relaxed">
          Supports keys, files, backups, documents up to 50MB. Files are encrypted client-side locally using AES-256 before upload.
        </p>

        <span className="text-2xs font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/35 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          AES-255-GCM Client Sandbox
        </span>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Queued Encryption Payload ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''})
          </span>
          <div className="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <File className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-750 dark:text-slate-250 truncate block">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5">
                      {file.size} • {file.type.split('/')[1]?.toUpperCase() || 'OCTET'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

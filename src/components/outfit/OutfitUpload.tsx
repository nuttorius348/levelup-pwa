'use client';

// =============================================================
// OutfitUpload — Image upload + AI provider selection
// =============================================================
//
// Features:
//  • Drag & drop or click to upload image
//  • Image preview with crop/remove
//  • AI provider dropdown (GPT-4o / Claude / Gemini)
//  • Optional occasion/style context
//  • Loading animation during API call
//  • Error handling
// =============================================================

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIProviderName } from '@/types/ai';

// ── Props ─────────────────────────────────────────────────────

interface OutfitUploadProps {
  onSubmit: (file: File, provider: AIProviderName, context?: {
    occasion?: string;
    style?: string;
  }) => void;
  isLoading?: boolean;
}

// ── Provider Config ───────────────────────────────────────────

const PROVIDERS: Array<{
  id: AIProviderName;
  label: string;
  model: string;
  icon: string;
  speed: string;
}> = [
  { id: 'openai', label: 'GPT-4o', model: 'Vision', icon: '🤖', speed: 'Fast' },
  { id: 'anthropic', label: 'Claude', model: 'Sonnet 4', icon: '🧠', speed: 'Smart' },
  { id: 'google', label: 'Gemini', model: '1.5 Pro', icon: '✨', speed: 'Balanced' },
];

// ── Component ─────────────────────────────────────────────────

export default function OutfitUpload({ onSubmit, isLoading = false }: OutfitUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProviderName>('openai');
  const [occasion, setOccasion] = useState('');
  const [style, setStyle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File Selection with auto-compression ──────────────

  const compressImage = useCallback(async (file: File, maxSizeKB = 900): Promise<File> => {
    // If already small enough, return as-is
    if (file.size <= maxSizeKB * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale down to max 1200px on longest side
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7,
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }

    // Compress before setting — avoids Vercel 413 errors
    const compressed = await compressImage(file);
    setSelectedFile(compressed);
    const url = URL.createObjectURL(compressed);
    setPreviewUrl(url);
  }, [compressImage]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const handleSubmit = useCallback(() => {
    if (!selectedFile) return;

    onSubmit(selectedFile, provider, {
      occasion: occasion.trim() || undefined,
      style: style.trim() || undefined,
    });
  }, [selectedFile, provider, occasion, style, onSubmit]);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Image Upload Zone */}
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
              transition-colors min-h-[240px] flex flex-col items-center justify-center
              ${dragActive
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <motion.div
              animate={{ scale: dragActive ? 1.1 : 1 }}
              className="text-5xl mb-3"
            >
              👔
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">Upload Your Outfit</h3>
            <p className="text-sm text-white/40 mb-4">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-white/20">
              JPEG, PNG, or WebP • Max 5 MB
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-black border border-white/10"
          >
            <img
              src={previewUrl}
              alt="Outfit preview"
              className="w-full h-auto max-h-[400px] object-contain"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/80 text-white/80 hover:bg-black hover:text-white flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Provider Selector */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setProvider(p.id)}
                className={`
                  p-3 rounded-xl text-left transition-all
                  ${provider === p.id
                    ? 'bg-violet-600 text-white border-2 border-violet-500'
                    : 'bg-white/5 text-white/60 border-2 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <div className="text-xl mb-1">{p.icon}</div>
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="text-[10px] text-white/30">{p.speed}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Context Inputs (Optional) */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wide block mb-1">
              Occasion (Optional)
            </label>
            <input
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g., work, date night, gym"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wide block mb-1">
              Style Preference (Optional)
            </label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g., casual, streetwear, formal"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            />
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      {selectedFile && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: isLoading ? 1 : 0.97 }}
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg transition-all min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <span>Analyzing outfit...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Get AI Rating</span>
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

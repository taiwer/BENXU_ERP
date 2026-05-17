import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      if (file instanceof File) {
        formData.append('files', file);
      }
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newImages = [...images, ...data.urls];
        setImages(newImages);
        onImagesChange(newImages);
      } else {
        alert('上传失败');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('上传发生错误');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
            <img src={url} alt={`Upload ${i}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-400 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-[10px]">上传图片</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        aria-hidden="true"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-[10px] text-gray-400">支持 JPG, PNG，每张最大 5MB ({images.length}/{maxImages})</p>
    </div>
  );
}

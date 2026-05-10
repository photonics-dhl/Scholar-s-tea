'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Smile, Image, Paperclip, X, Sticker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface MessageInputProps {
  onSend: (content: string, type?: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

// Common emojis for quick picker
const QUICK_EMOJIS = [
  '😀','😂','🥰','😍','🤔','😢','😡','👍','👎','👏',
  '🙏','🔥','❤️','💔','🎉','✨','💡','🤝','🌟','💯',
  '😊','😅','😭','😤','🥳','🤯','😴','🤓','😎','🤗',
];

// Sticker assets — 学者熊猫表情包
const STICKERS = [
  { name: 'gewu-zhixin', src: '/stickers/gewu-zhixin.png', label: '格物知新' },
  { name: 'thinking', src: '/stickers/thinking.png', label: '思考中' },
  { name: 'tired', src: '/stickers/tired.png', label: '学不动了' },
  { name: 'insight', src: '/stickers/insight.png', label: '洞察先机' },
  { name: 'confused', src: '/stickers/confused.png', label: 'AI也不懂' },
  { name: 'tea-welcome', src: '/stickers/tea-welcome.png', label: '茶会恭候' },
  { name: 'inspired', src: '/stickers/inspired.png', label: '灵感爆棚' },
  { name: 'debate', src: '/stickers/debate.png', label: '学术辩论' },
  { name: 'keep-going', src: '/stickers/keep-going.png', label: '洞察先机' },
  { name: 'continue-study', src: '/stickers/continue-study.png', label: '继续格物' },
  { name: 'eureka', src: '/stickers/eureka.png', label: '原来如此' },
  { name: 'tea-sip', src: '/stickers/tea-sip.png', label: '茶润学识' },
];

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
      if (stickerRef.current && !stickerRef.current.contains(e.target as Node)) {
        setShowSticker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    if (!content.trim() || disabled) return;
    onSend(content.trim(), 'TEXT');
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  }, [content, disabled, onSend, onTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const sendSticker = (stickerSrc: string) => {
    onSend(stickerSrc, 'STICKER');
    setShowSticker(false);
  };

  // Block dangerous file types
  const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.dll', '.msi', '.scr', '.vbs', '.js', '.jar'];
  const isFileBlocked = (filename: string): boolean => {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    return BLOCKED_EXTENSIONS.includes(ext);
  };

  const handleFileUpload = async (file: File, type: 'IMAGE' | 'FILE') => {
    if (!file) return;

    // Client-side validation
    if (isFileBlocked(file.name)) {
      setUploadError(`不支持的文件类型：${file.name.slice(file.name.lastIndexOf('.'))}`);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`文件大小超过 10MB 限制 (${formatFileSize(file.size)})`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Use XMLHttpRequest for progress tracking
      const data = await new Promise<{ success: boolean; data?: { url: string }; error?: { message: string } }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/v1/upload');

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('响应解析失败'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error?.message || `上传失败 (${xhr.status})`));
            } catch {
              reject(new Error(`上传失败 (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误，请重试')));
        xhr.addEventListener('abort', () => reject(new Error('上传已取消')));
        xhr.send(formData);
      });

      if (data.success && data.data?.url) {
        if (type === 'IMAGE') {
          onSend(data.data.url, 'IMAGE');
        } else {
          const fileInfo = `${file.name}|${data.data.url}|${formatFileSize(file.size)}`;
          onSend(fileInfo, 'FILE');
        }
      } else {
        throw new Error(data.error?.message || '上传失败');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败，请重试';
      setUploadError(msg);
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'IMAGE');
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'FILE');
    }
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        onTyping(false);
      }
    };
  }, [onTyping]);

  return (
    <div className="border-t border-gray-200/80 bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 pt-2">
        {/* Emoji Button */}
        <div className="relative" ref={emojiRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 text-gray-400 hover:text-gray-600',
              showEmoji && 'text-tea-primary bg-tea-primary/10'
            )}
            onClick={() => {
              setShowEmoji(!showEmoji);
              setShowSticker(false);
            }}
            disabled={disabled || uploading}
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-xl shadow-lg p-3 w-[280px] z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">常用表情</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowEmoji(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="h-7 w-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticker Button */}
        <div className="relative" ref={stickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 text-gray-400 hover:text-gray-600',
              showSticker && 'text-tea-primary bg-tea-primary/10'
            )}
            onClick={() => {
              setShowSticker(!showSticker);
              setShowEmoji(false);
            }}
            disabled={disabled || uploading}
          >
            <Sticker className="h-5 w-5" />
          </Button>

          {/* Sticker Picker */}
          {showSticker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-xl shadow-lg p-3 w-[320px] z-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">学者熊猫表情包</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowSticker(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker.name}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => sendSticker(sticker.src)}
                    title={sticker.label}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={sticker.src}
                        alt={sticker.label}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement).parentElement;
                          if (fallback) fallback.innerHTML = `<span class="text-2xl">🐼</span>`;
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {sticker.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <label className="cursor-pointer relative h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            disabled={disabled || uploading}
          />
          <Image className="h-5 w-5" />
        </label>

        {/* File Upload */}
        <label className="cursor-pointer relative h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
          <Paperclip className="h-5 w-5" />
        </label>

        {uploading && (
          <div className="flex items-center gap-2 ml-1">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-tea-primary rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {/* Input Row */}
      <div className="flex gap-2 items-end px-3 pb-3 pt-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? '连接中...' : '输入消息，按 Enter 发送...'}
          disabled={disabled || uploading}
          maxLength={500}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm',
            'focus:outline-none focus:ring-1 focus:ring-tea-primary focus:border-tea-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[40px] max-h-[120px] transition-all duration-200'
          )}
          style={{
            height: 'auto',
            overflowY: 'auto',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() || disabled || uploading}
          variant="tea"
          className="size-10 flex-shrink-0 rounded-full transition-all duration-200 hover:scale-105 active:scale-90 hover:shadow-md"
        >
          <Send className="size-4 transition-transform duration-200 group-active:translate-x-0.5" />
        </Button>
      </div>
      {/* Error message */}
      {uploadError && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
            <span>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="ml-auto text-destructive/70 hover:text-destructive underline"
            >
              重试
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground px-3 pb-2 font-sans">
        {content.length}/500 · 支持 JPG/PNG/GIF/WebP · 文件最大 10MB
      </p>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

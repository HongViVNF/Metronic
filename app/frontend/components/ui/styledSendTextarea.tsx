'use client';
import React, { useState } from "react";

import { Send } from "lucide-react";
import { Textarea } from "./textarea";
import { Button } from "./button";

interface StyledSendTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  minHeight?: string;
  maxLength?: number;
  className?: string;
  showTitle?: boolean;
  title?: string;
  titleIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  submitButtonText?: string;
  loadingText?: string;
  showEmojiPicker?: boolean;
  showCharacterCount?: boolean;
  showKeyboardHints?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  maxRows?: number; // Thêm prop để giới hạn số hàng tối đa
}

const EMOJI_LIST = [
  "😊",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "👍",
  "👏",
  "🔥",
  "💯",
  "❤️",
  "💪",
  "🎉",
  "✨",
  "🚀",
  "💡",
  "👀",
  "🙌",
];

export function StyledSendTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = "Write your text here...",
  isLoading = false,
  minHeight,
  maxLength = 500,
  className = "",
  showTitle = false,
  title = "Add text",
  titleIcon,
  size = "md",
  submitButtonText,
  loadingText,
  showEmojiPicker = true,
  showCharacterCount = true,
  showKeyboardHints = true,
  autoFocus = false,
  onCancel,
  maxRows = 10, // Giới hạn tối đa 10 hàng
}: StyledSendTextareaProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [rows, setRows] = useState(1); // State để theo dõi số hàng hiện tại

  // Variant-based defaults
  const getVariantDefaults = () => {
    return {
      containerClass: "bg-white border border-gray-200",
      minHeight: minHeight || "40px",
      placeholder: placeholder,
      submitText: submitButtonText || "Submit",
      loadingText: loadingText || "Submitting...",
      showTitle: showTitle,
    };
  };

  // Size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          container: "p-3",
          title: "text-base font-medium mb-3",
          button: "h-6 w-6",
          icon: "h-2.5 w-2.5",
          emoji: "h-6 w-6",
          text: "text-xs",
        };
      case "lg":
        return {
          container: "p-6",
          title: "text-xl font-semibold mb-5",
          button: "h-8 w-8",
          icon: "h-4 w-4",
          emoji: "h-8 w-8",
          text: "text-sm",
        };
      default: // md
        return {
          container: "p-4",
          title: "text-lg font-semibold mb-4",
          button: "h-7 w-7",
          icon: "h-3 w-3",
          emoji: "h-8 w-8",
          text: "text-xs",
        };
    }
  };

  const variantDefaults = getVariantDefaults();
  const sizeStyles = getSizeStyles();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter để tăng số hàng
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (rows < maxRows) {
        setRows(prev => prev + 1);
      }
      return;
    }
    
    // Enter để submit (không có Shift hoặc Ctrl)
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
      return;
    }
    
    // Shift+Enter để xuống dòng (cho phép hành vi mặc định)
    if (e.key === "Enter" && e.shiftKey) {
      // Tự động tăng rows nếu cần thiết khi xuống dòng
      const lineCount = value.split('\n').length + 1;
      if (lineCount > rows && rows < maxRows) {
        setRows(lineCount);
      }
    }
    
    if (e.key === "Escape") {
      setShowEmoji(false);
      if (onCancel) onCancel();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setShowEmoji(false);
  };

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  // Tự động điều chỉnh rows dựa trên nội dung
  const handleTextChange = (newValue: string) => {
    onChange(newValue);
    
    // Tính số dòng dựa trên nội dung
    const lineCount = newValue.split('\n').length;
    
    // Chỉ giảm rows nếu nội dung ít hơn
    if (lineCount < rows) {
      setRows(Math.max(1, lineCount));
    }
  };

  // Reset rows về 1 khi submit thành công (có thể gọi từ component cha)
  const resetRows = () => {
    setRows(1);
  };

  return (
    <div
      className={`${variantDefaults.containerClass} rounded-lg ${sizeStyles.container} ${className}`}
    >
      {variantDefaults.showTitle && (
        <h4
          className={`text-gray-800 flex items-center gap-2 ${sizeStyles.title}`}
        >
          {titleIcon}
          {title}
        </h4>
      )}

      <div className="relative">
        <Textarea
          placeholder={variantDefaults.placeholder}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => setShowEmoji(false)}
          className={`resize-none ${
            showEmojiPicker || onCancel ? "pr-28" : "pr-20"
          } border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg`}
          style={{ 
            minHeight: variantDefaults.minHeight,
            lineHeight: "1.5"
          }}
          maxLength={maxLength}
          autoFocus={autoFocus}
          rows={rows} // Sử dụng state rows thay vì cố định
        />

        <div className={`absolute ${rows > 1 ? 'top-3' : 'top-1/2 -translate-y-1/2'} right-3 flex items-center gap-2`}>
          {/* Cancel Button (for replies) */}
          {onCancel && (
            <Button
              onClick={onCancel}
              size="sm"
              variant="ghost"
              type="button"
              className={`${sizeStyles.button} p-0 rounded-full hover:bg-gray-200 transition-colors duration-200 text-gray-500`}
            >
              ✕
            </Button>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="relative">
              <Button
                onClick={() => setShowEmoji(!showEmoji)}
                size="sm"
                variant="ghost"
                type="button"
                className={`${sizeStyles.button} p-0 rounded-full hover:bg-gray-200 transition-colors duration-200`}
              >
                😊
              </Button>

              {showEmoji && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 min-w-[200px] z-10">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`${sizeStyles.emoji} rounded hover:bg-gray-100 transition-colors duration-150 flex items-center justify-center text-lg`}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            size="sm"
            type="button"
            className={`${sizeStyles.button} p-0 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center`}
          >
            {isLoading ? (
              <div
                className={`animate-spin ${sizeStyles.icon} border-2 border-white border-t-transparent rounded-full`}
              ></div>
            ) : (
              <Send className={`${sizeStyles.icon} text-white`} />
            )}
          </Button>
        </div>
      </div>

      {(showKeyboardHints || showCharacterCount) && (
        <div
          className={`mt-2 ${sizeStyles.text} text-gray-500 flex justify-between items-center`}
        >
          {showKeyboardHints && (
            <span>
              Press Enter to send • Shift+Enter for new line • Ctrl+Enter to expand
              {showEmojiPicker ? " • Esc to close emoji" : ""}
            </span>
          )}
          {showCharacterCount && (
            <span className="text-gray-400 ml-auto">
              {value.length}/{maxLength} • {rows}/{maxRows} rows
            </span>
          )}
        </div>
      )}
    </div>
  );
}
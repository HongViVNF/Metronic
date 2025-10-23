'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Type } from 'lucide-react';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function TiptapEditor({ content, onChange, placeholder, readOnly = false }: TiptapEditorProps) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:'text-sm leading-normal focus:outline-none min-h-[120px] p-3 ' +
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-md ${!readOnly ? 'border-gray-300' : 'border-transparent'}`}>
      {!readOnly && (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 p-2 border-b bg-gray-50 w-max min-w-full">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('bold') ? 'bg-gray-300' : ''
              }`}
              title="Bold"
            >
              <Bold size={16} />
            </button>
          
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('italic') ? 'bg-gray-300' : ''
              }`}
              title="Italic"
            >
              <Italic size={16} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Heading Buttons */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 1"
            >
              H1
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
              }`}
              title="Heading 2"
            >
              H2
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
              }`}
              title="Heading 3"
            >
              H3
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('paragraph') ? 'bg-gray-300' : ''
              }`}
              title="Normal Text"
            >
              P
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('bulletList') ? 'bg-gray-300' : ''
              }`}
            title="Bullet List"
            >
              <List size={16} />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-2 py-1 text-sm border rounded hover:bg-gray-200 ${
                editor.isActive('orderedList') ? 'bg-gray-300' : ''
              }`}
            title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-200 disabled:opacity-50"
              title="Undo"
            >
              <Undo size={16} />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-200 disabled:opacity-50"
              title="Redo"
            >
              <Redo size={16} />
            </button>
          </div>
        </div>
      )}
      <div className={readOnly ? 'bg-gray-50' : 'bg-white'}>
        <div className="relative">
        <EditorContent 
          editor={editor} 
          className="max-h-[300px] overflow-y-auto p-4"
        />
        
        {/* Placeholder */}
        {!content && placeholder && (
          <div className="absolute top-7 left-7 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

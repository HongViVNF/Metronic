// import { useEditor, EditorContent } from "@tiptap/react"
// import StarterKit from "@tiptap/starter-kit"
// import Underline from "@tiptap/extension-underline"
// import Image from "@tiptap/extension-image"
// import Link from "@tiptap/extension-link"
// import {
//   Bold,
//   Italic,
//   UnderlineIcon,
//   Quote,
//   Code,
//   List,
//   Heading,
//   ImageIcon,
// } from "lucide-react"
// import "./index.css"
// import { ToggleGroup, ToggleGroupItem } from "@/app/frontend/components/ui/togglegroup_2"
// import { useRef } from "react"
// import { Input } from "@/app/frontend/components/ui/input"
// import ResizeImage from "tiptap-extension-resize-image"

// interface RichTextEditorProps {
//   value: string
//   onChange: (value: string) => void
// }

// export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Underline,
//       Link,
//       ResizeImage.configure({
//         allowBase64: true,
//         inline: false,
//         HTMLAttributes: {
//           class: "resizable-image",
//         },
//       }),
//     ],
//     content: value,
//     onUpdate: ({ editor }) => onChange(editor.getHTML()),
//   })

//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (!file) return
  
//     const formData = new FormData()
//     formData.append('file', file)
  
//     try {
//       const res = await fetch('/recruitment/api/upload-image', {
//         method: 'POST',
//         body: formData,
//       })
  
//       const data = await res.json()
//       if (data.url) {
//         editor?.chain().focus().setImage({ src: data.url }).run()
//       }
//     } catch (err) {
//       console.error('Upload failed', err)
//     }
//   }

//   const triggerFileSelect = () => {
//     fileInputRef.current?.click()
//   }

//   if (!editor) return null

//   return (
//     <div className="space-y-2">
//       {/* Hidden file input */}
//       <Input
//         type="file"
//         accept="image/*"
//         ref={fileInputRef}
//         onChange={handleImageUpload}
//         className="hidden"
//       />

//       <ToggleGroup type="multiple" className="gap-2">
//         <ToggleGroupItem
//           value="bold"
//           pressed={editor.isActive("bold")}
//           onClick={() => editor.chain().focus().toggleBold().run()}
//         >
//           <Bold className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="italic"
//           pressed={editor.isActive("italic")}
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//         >
//           <Italic className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="underline"
//           pressed={editor.isActive("underline")}
//           onClick={() => editor.chain().focus().toggleUnderline().run()}
//         >
//           <UnderlineIcon className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="heading"
//           pressed={editor.isActive("heading", { level: 2 })}
//           onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//         >
//           <Heading className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="bulletList"
//           pressed={editor.isActive("bulletList")}
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//         >
//           <List className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="blockquote"
//           pressed={editor.isActive("blockquote")}
//           onClick={() => editor.chain().focus().toggleBlockquote().run()}
//         >
//           <Quote className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="code"
//           pressed={editor.isActive("code")}
//           onClick={() => editor.chain().focus().toggleCode().run()}
//         >
//           <Code className="w-4 h-4" />
//         </ToggleGroupItem>

//         {/* Nút chèn ảnh từ máy */}
//         <ToggleGroupItem
//           value="image"
//           pressed={false}
//           onClick={triggerFileSelect}
//         >
//           <ImageIcon className="w-4 h-4" />
//         </ToggleGroupItem>
//       </ToggleGroup>

//       <EditorContent
//         editor={editor}
//         className="editor-content prose dark:prose-invert"
//       />
//     </div>
//   )
// }

// import { useEditor, EditorContent } from "@tiptap/react"
// import StarterKit from "@tiptap/starter-kit"
// import Underline from "@tiptap/extension-underline"
// import Link from "@tiptap/extension-link"
// import {
//   Bold,
//   Italic,
//   UnderlineIcon,
//   Quote,
//   Code,
//   List,
//   Heading,
//   ImageIcon,
// } from "lucide-react"
// import "./index.css"
// import { ToggleGroup, ToggleGroupItem } from "@/app/frontend/components/ui/togglegroup_2"
// import { useRef } from "react"
// import { Input } from "@/app/frontend/components/ui/input"
// import ResizeImage from "easy-image-resizer"

// interface RichTextEditorProps {
//   value: string
//   onChange: (value: string) => void
// }

// // ✅ Custom extension để lưu width/height vào HTML
// const CustomImage = ResizeImage.extend({
//   addAttributes() {
//     return {
//       ...this.parent?.(),
//       width: {
//         default: null,
//         parseHTML: element => element.getAttribute("width"),
//         renderHTML: attributes => {
//           if (!attributes.width) return {}
//           return { width: attributes.width }
//         },
//       },
//       height: {
//         default: null,
//         parseHTML: element => element.getAttribute("height"),
//         renderHTML: attributes => {
//           if (!attributes.height) return {}
//           return { height: attributes.height }
//         },
//       },
//     }
//   },
// })

// export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Underline,
//       Link,
//       CustomImage.configure({
//         allowBase64: true,
//         inline: false,
//         HTMLAttributes: {
//           class: "resizable-image",
//         },
//       }),
//     ],
//     content: value,
//     onUpdate: ({ editor }) => onChange(editor.getHTML()),
//   })

//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (!file) return

//     const formData = new FormData()
//     formData.append("file", file)

//     try {
//       const res = await fetch("/recruitment/api/upload-image", {
//         method: "POST",
//         body: formData,
//       })

//       const data = await res.json()
//       if (data.url) {
//         editor?.chain().focus().setImage({ src: data.url }).run()
//       }
//     } catch (err) {
//       console.error("Upload failed", err)
//     }
//   }

//   const triggerFileSelect = () => {
//     fileInputRef.current?.click()
//   }

//   if (!editor) return null

//   return (
//     <div className="space-y-2">
//       {/* Hidden file input */}
//       <Input
//         type="file"
//         accept="image/*"
//         ref={fileInputRef}
//         onChange={handleImageUpload}
//         className="hidden"
//       />

//       <ToggleGroup type="multiple" className="gap-2">
//         <ToggleGroupItem
//           value="bold"
//           pressed={editor.isActive("bold")}
//           onClick={() => editor.chain().focus().toggleBold().run()}
//         >
//           <Bold className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="italic"
//           pressed={editor.isActive("italic")}
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//         >
//           <Italic className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="underline"
//           pressed={editor.isActive("underline")}
//           onClick={() => editor.chain().focus().toggleUnderline().run()}
//         >
//           <UnderlineIcon className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="heading"
//           pressed={editor.isActive("heading", { level: 2 })}
//           onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//         >
//           <Heading className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="bulletList"
//           pressed={editor.isActive("bulletList")}
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//         >
//           <List className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="blockquote"
//           pressed={editor.isActive("blockquote")}
//           onClick={() => editor.chain().focus().toggleBlockquote().run()}
//         >
//           <Quote className="w-4 h-4" />
//         </ToggleGroupItem>

//         <ToggleGroupItem
//           value="code"
//           pressed={editor.isActive("code")}
//           onClick={() => editor.chain().focus().toggleCode().run()}
//         >
//           <Code className="w-4 h-4" />
//         </ToggleGroupItem>

//         {/* Nút chèn ảnh từ máy */}
//         <ToggleGroupItem value="image" pressed={false} onClick={triggerFileSelect}>
//           <ImageIcon className="w-4 h-4" />
//         </ToggleGroupItem>
//       </ToggleGroup>

//       <EditorContent
//         editor={editor}
//         className="editor-content prose dark:prose-invert"
//       />
//     </div>
//   )
// }
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import {
  Bold,
  Italic,
  UnderlineIcon,
  Quote,
  Code,
  List,
  Heading,
  ImageIcon,
} from "lucide-react"
import "./index.css"
import { ToggleGroup, ToggleGroupItem } from "@/app/frontend/components/ui/togglegroup_2"
import { useRef } from "react"
import { Input } from "@/app/frontend/components/ui/input"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

// ✅ Extend @tiptap/extension-image để thêm width / height
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
    }
  },
})

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "resizable-image",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/recruitment/api/upload-image", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (err) {
      console.error("Upload failed", err)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  if (!editor) return null

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />

      <ToggleGroup type="multiple" className="gap-2">
        <ToggleGroupItem
          value="bold"
          pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="italic"
          pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="underline"
          pressed={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="heading"
          pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="bulletList"
          pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="blockquote"
          pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="code"
          pressed={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="w-4 h-4" />
        </ToggleGroupItem>

        {/* Nút chèn ảnh từ máy */}
        <ToggleGroupItem value="image" pressed={false} onClick={triggerFileSelect}>
          <ImageIcon className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <EditorContent
        editor={editor}
        className="editor-content prose dark:prose-invert w-full max-w-none"
      />
    </div>
  )
}

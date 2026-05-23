'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="tiptap-editor rounded-md border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
      <div className="flex flex-wrap gap-0.5 border-b border-input p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editor.isActive('link') ? 'bg-muted' : ''}`}
          onClick={handleLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="mx-1 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="px-3 py-2" />
    </div>
  );
}

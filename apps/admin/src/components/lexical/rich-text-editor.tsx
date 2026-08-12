'use client';

/**
 * A standalone @lexical/react editor whose output is byte-compatible with the
 * Payload `richText` field (Payload stores Lexical SerializedEditorState and uses
 * these same standard nodes). Pinned to lexical@0.41.0 to match the CMS so node
 * `version` fields line up. Covers core formatting; custom upload/block nodes can
 * be layered on later.
 */

import { useCallback, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode, type HeadingTagType,
} from '@lexical/rich-text';
import {
  ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import {
  $getSelection, $isRangeSelection, $createParagraphNode, FORMAT_TEXT_COMMAND,
  type EditorState, type TextFormatType,
} from 'lexical';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  Pilcrow, List, ListOrdered, Quote, Link2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const theme = {
  paragraph: 'mb-2 leading-relaxed',
  heading: {
    h1: 'text-3xl font-bold mb-3',
    h2: 'text-2xl font-bold mb-2',
    h3: 'text-xl font-semibold mb-2',
    h4: 'text-lg font-semibold mb-2',
  },
  list: { ul: 'list-disc pl-6 mb-2', ol: 'list-decimal pl-6 mb-2', listitem: 'mb-1' },
  quote: 'border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-2',
  link: 'text-blue-600 underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
};

function TB({
  onClick, title, children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const fmt = (f: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, f);
  const setBlock = (create: () => ReturnType<typeof $createParagraphNode> | ReturnType<typeof $createHeadingNode> | ReturnType<typeof $createQuoteNode>) =>
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) $setBlocksType(sel, create);
    });
  const heading = (tag: HeadingTagType) => setBlock(() => $createHeadingNode(tag));

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const applyLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim() ? linkUrl.trim() : null);
    setLinkOpen(false);
    setLinkUrl('');
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <TB title="Bold" onClick={() => fmt('bold')}><Bold className="h-4 w-4" /></TB>
        <TB title="Italic" onClick={() => fmt('italic')}><Italic className="h-4 w-4" /></TB>
        <TB title="Underline" onClick={() => fmt('underline')}><Underline className="h-4 w-4" /></TB>
        <TB title="Strikethrough" onClick={() => fmt('strikethrough')}><Strikethrough className="h-4 w-4" /></TB>
        <Divider />
        <TB title="Heading 1" onClick={() => heading('h1')}><Heading1 className="h-4 w-4" /></TB>
        <TB title="Heading 2" onClick={() => heading('h2')}><Heading2 className="h-4 w-4" /></TB>
        <TB title="Heading 3" onClick={() => heading('h3')}><Heading3 className="h-4 w-4" /></TB>
        <TB title="Paragraph" onClick={() => setBlock(() => $createParagraphNode())}><Pilcrow className="h-4 w-4" /></TB>
        <TB title="Quote" onClick={() => setBlock(() => $createQuoteNode())}><Quote className="h-4 w-4" /></TB>
        <Divider />
        <TB title="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}><List className="h-4 w-4" /></TB>
        <TB title="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}><ListOrdered className="h-4 w-4" /></TB>
        <TB title="Link" onClick={() => { setLinkUrl(''); setLinkOpen(true); }}><Link2 className="h-4 w-4" /></TB>
      </div>
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Link</DialogTitle></DialogHeader>
          <Input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={applyLink}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface RichTextEditorProps {
  /** Initial Payload richText value (SerializedEditorState) or null/undefined. */
  value?: unknown;
  /** Called with the new SerializedEditorState (plain object) on every change. */
  onChange: (state: unknown) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const hasValue =
    value && typeof value === 'object' && 'root' in (value as Record<string, unknown>);

  const initialConfig = {
    namespace: 'PostContent',
    theme,
    onError: (e: Error) => {
      // eslint-disable-next-line no-console
      console.error('[lexical]', e);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    editorState: hasValue ? JSON.stringify(value) : undefined,
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange(editorState.toJSON());
    },
    [onChange],
  );

  return (
    <div className="rounded-md border bg-background">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative min-h-48 px-3 py-2 text-sm">
          <RichTextPlugin
            contentEditable={<ContentEditable className="min-h-44 outline-none" />}
            placeholder={
              <div className="pointer-events-none absolute left-3 top-2 text-muted-foreground">
                {placeholder || '…'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </LexicalComposer>
    </div>
  );
}

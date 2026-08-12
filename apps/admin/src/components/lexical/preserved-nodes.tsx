'use client';

import { DecoratorNode, type SerializedLexicalNode, type NodeKey } from 'lexical';
import type { JSX } from 'react';

/**
 * Passthrough decorator nodes for Payload's custom Lexical node types
 * (`upload`, `block`, `horizontalrule`). Our core editor doesn't author these,
 * but existing post/page content may contain them — without registering them,
 * `parseEditorState` throws "type X not found". These nodes keep the original
 * serialized JSON verbatim (exportJSON returns it unchanged) so content
 * round-trips losslessly, and render a lightweight preview in the editor.
 */

type Raw = SerializedLexicalNode & Record<string, unknown>;

class UploadNode extends DecoratorNode<JSX.Element> {
  __data: Raw;
  static getType() { return 'upload'; }
  static clone(n: UploadNode) { return new UploadNode(n.__data, n.__key); }
  constructor(data: Raw, key?: NodeKey) { super(key); this.__data = data; }
  static importJSON(json: Raw) { return new UploadNode(json); }
  exportJSON(): Raw { return { ...this.__data, type: 'upload', version: (this.__data.version as number) ?? 3 }; }
  createDOM() { const d = document.createElement('div'); d.className = 'my-2'; return d; }
  updateDOM() { return false; }
  isInline() { return false; }
  decorate() {
    const value = this.__data.value as { url?: string | null } | number | string | undefined;
    const url = value && typeof value === 'object' ? value.url : undefined;
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="max-h-48 rounded border object-contain" />
    ) : (
      <span className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">[image]</span>
    );
  }
}

class BlockNode extends DecoratorNode<JSX.Element> {
  __data: Raw;
  static getType() { return 'block'; }
  static clone(n: BlockNode) { return new BlockNode(n.__data, n.__key); }
  constructor(data: Raw, key?: NodeKey) { super(key); this.__data = data; }
  static importJSON(json: Raw) { return new BlockNode(json); }
  exportJSON(): Raw { return { ...this.__data, type: 'block', version: (this.__data.version as number) ?? 2 }; }
  createDOM() { const d = document.createElement('div'); d.className = 'my-2'; return d; }
  updateDOM() { return false; }
  isInline() { return false; }
  decorate() {
    const fields = this.__data.fields as { blockType?: string } | undefined;
    return (
      <div className="rounded border border-dashed p-2 text-xs text-muted-foreground">
        [block: {fields?.blockType || 'custom'}]
      </div>
    );
  }
}

class HorizontalRuleNode extends DecoratorNode<JSX.Element> {
  __data: Raw;
  static getType() { return 'horizontalrule'; }
  static clone(n: HorizontalRuleNode) { return new HorizontalRuleNode(n.__data, n.__key); }
  constructor(data: Raw, key?: NodeKey) { super(key); this.__data = data; }
  static importJSON(json: Raw) { return new HorizontalRuleNode(json); }
  exportJSON(): Raw { return { ...this.__data, type: 'horizontalrule', version: (this.__data.version as number) ?? 1 }; }
  createDOM() { const d = document.createElement('div'); return d; }
  updateDOM() { return false; }
  isInline() { return false; }
  decorate() { return <hr className="my-2 border-border" />; }
}

export const PRESERVED_NODES = [UploadNode, BlockNode, HorizontalRuleNode];

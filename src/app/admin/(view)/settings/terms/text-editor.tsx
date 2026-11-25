"use client";

import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { RichTextProvider } from "reactjs-tiptap-editor";
import { RichTextBold, Bold } from "reactjs-tiptap-editor/bold";
import { RichTextItalic, Italic } from "reactjs-tiptap-editor/italic";
import {
  History,
  RichTextUndo,
  RichTextRedo,
} from "reactjs-tiptap-editor/history";
import "reactjs-tiptap-editor/style.css";
import { useEffect } from "react";
import { useT } from "@/i18n";

const searchPluginKey = new PluginKey("termsSearch");

const SearchHighlight = Extension.create({
  name: "searchHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init: () => ({ search: "", decorations: DecorationSet.empty }),
          apply(transaction, previous, _oldState, newState) {
            const search =
              transaction.getMeta(searchPluginKey) ?? previous.search;
            if (search === previous.search && !transaction.docChanged)
              return previous;
            if (!search) return { search, decorations: DecorationSet.empty };

            const decorations: Decoration[] = [];
            const query = search.toLocaleLowerCase();
            newState.doc.descendants((node, position) => {
              if (!node.isText || !node.text) return;

              const text = node.text.toLocaleLowerCase();
              let start = 0;
              while (start < text.length) {
                const matchStart = text.indexOf(query, start);
                if (matchStart === -1) break;
                decorations.push(
                  Decoration.inline(
                    position + matchStart,
                    position + matchStart + query.length,
                    { class: "terms-search-match" },
                  ),
                );
                start = matchStart + query.length;
              }
            });

            return {
              search,
              decorations: DecorationSet.create(newState.doc, decorations),
            };
          },
        },
        props: {
          decorations(state) {
            return searchPluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});

const extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  History,
  SearchHighlight,
];

export default function TextEditor({
  content,
  search,
  onChange,
  onMatchCountChange,
}: {
  content: string;
  search: string;
  onChange: (content: string) => void;
  onMatchCountChange: (count: number) => void;
}) {
  const t = useT();
  const editor = useEditor({
    extensions,
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(content || "", {
      emitUpdate: false,
    });
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;

    editor.view.dispatch(editor.state.tr.setMeta(searchPluginKey, search));

    if (!search) {
      onMatchCountChange(0);
      return;
    }

    const query = search.toLocaleLowerCase();
    let count = 0;
    editor.state.doc.descendants((node) => {
      if (!node.isText || !node.text) return;
      const text = node.text.toLocaleLowerCase();
      let start = 0;
      while (start < text.length) {
        const matchStart = text.indexOf(query, start);
        if (matchStart === -1) break;
        count += 1;
        start = matchStart + query.length;
      }
    });
    onMatchCountChange(count);
  }, [editor, onMatchCountChange, search]);

  if (!editor) return null;

  return (
    <div className="border rounded-xl p-4 mt-6">
      <RichTextProvider editor={editor}>
        <div
          role="toolbar"
          aria-label={t("admin.settings.terms.formatting")}
          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
        >
          <RichTextUndo />
          <RichTextRedo />
          <EditorContent editor={editor} className="h-full! flex-1" />
        </div>
      </RichTextProvider>
    </div>
  );
}

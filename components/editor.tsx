"use client"

import { useEffect, useRef } from "react"
import { EditorView, basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { EditorState } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { useTheme } from "next-themes"

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!editorRef.current) return

    // Clean up previous editor instance
    if (editorViewRef.current) {
      editorViewRef.current.destroy()
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })

    const extensions = [
      basicSetup,
      markdown(),
      updateListener,
      EditorView.lineWrapping,
      theme === "dark" ? oneDark : [],
    ]

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    editorViewRef.current = view

    return () => {
      view.destroy()
    }
  }, [value, onChange, theme])

  return <div ref={editorRef} className="w-full h-full min-h-[400px]" />
}

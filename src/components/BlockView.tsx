import React, { useState, useRef, ReactNode, useEffect } from "react";
import { Block } from "../useNotes";

export function BlockView({
  block,
  isFocused,
  setFocus,
  updateBlock,
  selectionStart = 0,
  setSelectionStart,
  onClick,
}: {
  block: Block;
  isFocused: boolean;
  setFocus: () => void;
  updateBlock: (update: Partial<Block>) => void;
  selectionStart: number;
  setSelectionStart: (selectionStart: number) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const fontSize = 16;
  const editableDiv = useRef<HTMLDivElement>(null);

  const [innerText, setInnerText] = useState("");

  useEffect(() => {
    if (isFocused) {
      const el = editableDiv.current;
      if (!el) return;
      el.focus();
      updateSelection();
    }
  }, [isFocused]);

  useEffect(() => {
    if (block.text !== innerText) {
      setInnerText(block.text);
      if (editableDiv.current) {
        editableDiv.current.innerHTML = block.text.replace(/\s/g, "\u00a0");
      }
    }
  }, [block.text, innerText]);

  useEffect(() => {
    updateSelection();
  }, [editableDiv.current?.childNodes]);

  function updateSelection() {
    let pos = 0;
    if (selectionStart < 0) {
      pos = Math.max(0, block.text.length + selectionStart + 1);
    } else {
      pos = Math.min(block.text.length, selectionStart);
    }
    if (!pos) return;
    const el = editableDiv.current;
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    const textNode = el.childNodes[0];
    if (!textNode) return;
    range.setStart(textNode, pos);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
    setSelectionStart(pos);
  }

  function keyDownHandler(e: React.KeyboardEvent) {
    const sel = window.getSelection();
    const hasSelection = sel?.anchorOffset !== sel?.focusOffset;
    if (selectionStart === 0 && hasSelection) {
      if (e.key === "Backspace") {
        e.stopPropagation();
      }
    }
  }

  function keyUpHandler(e: React.KeyboardEvent) {
    const pos = document.getSelection()?.anchorOffset || 0;
    if (isFocused) {
      setSelectionStart(pos);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        margin: "10px",
      }}
    >
      <div
        style={{
          textAlign: "left",
          width: "100%",
        }}
        className="block"
        onClick={onClick}
        data-block-id={block.id}
      >
        <div
          ref={editableDiv}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "sans-serif",
            padding: 0,
            margin: 0,
            cursor: "text",
            border: "none",
            outline: "none",
          }}
          contentEditable
          className="block-text"
          onInput={(e) => {
            setInnerText(e.currentTarget.innerText);
            updateBlock({ text: e.currentTarget.innerText });
          }}
          onKeyDown={keyDownHandler}
          onKeyUp={keyUpHandler}
          onFocus={() => {
            setFocus();
            updateSelection();
          }}
        />
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { BlockItem } from "../model/useNotes";

export function BlockView({
  block,
  updateBlock,
  moveIndent,
  indent,
  mergeWithPrevious,
  split,
  editable = false,
}: {
  block: BlockItem;
  updateBlock: (update: Partial<BlockItem>) => void;
  moveIndent: (shift: -1 | 1) => void;
  indent: number;
  mergeWithPrevious: () => void;
  split: (index: number) => void;
  editable?: boolean;
}) {
  const fontSize = 16;
  const editableDiv = useRef<HTMLDivElement>(null);
  const [innerText, setInnerText] = useState("");

  function getCursorPosition(): null | number {
    const sel = document.getSelection();
    return sel?.anchorOffset || null;
  }

  function isActive(): boolean {
    return document.activeElement === editableDiv.current;
  }

  function keyDownHandler(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      moveIndent(e.shiftKey ? -1 : 1);
    } else if (e.key === " " && getCursorPosition() === 1) {
      if (block.text.match(/^\s.*$/)) {
        // The user added two spaces at the start of the line
        e.preventDefault();
        updateBlock({ text: block.text.replace(/^\s+/, "") });
        moveIndent(1);
      } else if (block.text.match(/^-.*$/)) {
        // The user started a bullet point
        e.preventDefault();
        updateBlock({ text: block.text.replace(/^-\s*/, "") });
        moveIndent(1);
      }
    } else if (e.key === "Backspace") {
      const sel = document.getSelection();
      if (!sel) return;
      if (sel.anchorOffset > 0) return;
      e.preventDefault();
      if (indent > 0) {
        moveIndent(-1);
      } else {
        mergeWithPrevious();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = document.getSelection();
      if (!sel) return;
      split(sel.anchorOffset);
    }
  }

  // updates the view when the model changes
  useEffect(() => {
    if (!isActive() && block.text !== innerText) {
      setInnerText(block.text);
      if (editableDiv.current) {
        editableDiv.current.innerHTML = block.text.replace(/\s/g, "\u00a0");
      }
    }
  }, [block.text, innerText]);

  // updates the model when the view changes
  function inputHandler(e: React.FormEvent<HTMLDivElement>) {
    const newInnerText = e.currentTarget.innerText;
    if (newInnerText !== innerText) {
      setInnerText(newInnerText);
      updateBlock({ text: newInnerText });
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%",
      }}
      onKeyDown={keyDownHandler}
    >
      <div
        style={{
          textAlign: "left",
          width: "100%",
        }}
        className="block"
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
            width: "100%",
            height: "100%",
            overflowWrap: "break-word",
          }}
          contentEditable={editable}
          className="block-text"
          onInput={inputHandler}
        />
      </div>
    </div>
  );
}

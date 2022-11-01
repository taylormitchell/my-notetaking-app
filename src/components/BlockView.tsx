import React, { useState, useRef, ReactNode, useEffect } from "react";
import { Block } from "../useNotes";

export function BlockView({
  block,
  updateBlock,
  moveIndent,
}: {
  block: Block;
  updateBlock: (update: Partial<Block>) => void;
  moveIndent: (shift: -1 | 1) => void;
}) {
  const fontSize = 16;
  const editableDiv = useRef<HTMLDivElement>(null);

  const [innerText, setInnerText] = useState("");

  const [touchstart, setTouchstart] = useState<number | null>(0);

  function startTouchHandler(e: React.TouchEvent) {
    setTouchstart(e.changedTouches[0].screenX);
  }

  function endTouchHandler(e: React.TouchEvent) {
    if (touchstart === null) return;
    const deltaX = e.changedTouches[0].screenX - touchstart;
    if (deltaX > 50) {
      moveIndent(1);
    } else if (deltaX < -50) {
      moveIndent(-1);
    }
    setTouchstart(null);
  }

  useEffect(() => {
    if (block.text !== innerText) {
      setInnerText(block.text);
      if (editableDiv.current) {
        editableDiv.current.innerHTML = block.text.replace(/\s/g, "\u00a0");
      }
    }
  }, [block.text, innerText]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        margin: "10px",
        width: "100%",
      }}
      onTouchStart={startTouchHandler}
      onTouchEnd={endTouchHandler}
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
          }}
          contentEditable
          className="block-text"
          onInput={(e) => {
            setInnerText(e.currentTarget.innerText);
            updateBlock({ text: e.currentTarget.innerText });
          }}
        />
      </div>
    </div>
  );
}

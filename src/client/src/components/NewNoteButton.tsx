import { useNavigate } from "react-router-dom";
import { Notes } from "../model/useNotes";

export const NewNoteButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      style={{
        position: "absolute",
        bottom: "1rem",
        right: "1rem",
        fontSize: "1.5rem",
        padding: "0.5rem",
      }}
      onClick={onClick}
    >
      +
    </button>
  );
};

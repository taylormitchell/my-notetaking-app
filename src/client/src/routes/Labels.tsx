import { useState } from "react";
import { Link } from "react-router-dom";
import { Notes } from "../model/useNotes";

export const Labels = ({ notes }: { notes: Notes }) => {
  const [newLabel, setNewLabel] = useState("");
  return (
    <div>
      <ul>
        {notes.getLabels().map((label) => {
          return (
            <li key={label.id}>
              <Link to={`/?q=${label.name}`}>{label.name}</Link>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          notes.upsertLabel({ name: newLabel });
          setNewLabel("");
        }}
      >
        <input type="text" onChange={(e) => setNewLabel(e.target.value)} />
        <input type="submit" value="Add" />
      </form>
    </div>
  );
};

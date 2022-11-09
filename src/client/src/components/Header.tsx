import { Link } from "react-router-dom";

export const Header = ({ children, back }: { children: React.ReactNode; back: () => void }) => {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "lightgrey",
        padding: "0px 30px",
      }}
    >
      <div>
        <a
          style={{
            fontSize: "1.5rem",
          }}
          onClick={back}
        >
          ←
        </a>
      </div>
      <h3>{children}</h3>
      <div></div>
    </header>
  );
};

import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Counter } from "./counter";

function App() {
  const [n, setN] = useState(0);
  return <Counter value={n} onIncrement={() => setN(n + 1)} />;
}

createRoot(document.getElementById("root")!).render(<App />);

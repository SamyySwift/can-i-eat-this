import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initImageCache } from "./lib/imageCache";

// Initialize image cache system
initImageCache()
  .then(() => console.log('Image cache system initialized'))
  .catch(err => console.error('Failed to initialize image cache:', err));

createRoot(document.getElementById("root")!).render(<App />);

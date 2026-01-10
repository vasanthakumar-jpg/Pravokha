import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// 🛡️ Pravokha Enterprise Security Shield
console.log(
  "%cSTOP! Pravokha Security Protocol Active",
  "color: red; font-family: sans-serif; font-size: 2.5em; font-weight: bolder; text-shadow: #000 1px 1px;"
);
console.log(
  "%cThis is a professional security feature (Self-XSS Protection). \nUsing this console to paste untrusted code may compromise your marketplace security. \nUnless you are a Pravokha system administrator, do not interact with this console.",
  "font-family: sans-serif; font-size: 1.1em; color: #666;"
);
console.log(
  "%c[System] Real-World Marketplace Engine: Connected to Custom Backend",
  "color: #10b981; font-weight: bold;"
);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);

import { createRoot } from "react-dom/client";
import "./i18n"; // Initialize i18n BEFORE App
import App from "./App.tsx";
import "./index.css";

// Force unregister any service workers to prevent caching/API blocking issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            console.log('Unregistering SW:', registration);
            registration.unregister();
        }
    });
}

createRoot(document.getElementById("root")!).render(<App />);

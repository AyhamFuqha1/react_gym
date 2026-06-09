import { RouterProvider } from "react-router-dom";
import { TranslationProvider } from "./i18n";
import { router } from "./routes/AppRoutes";

export default function App() {
  return (
    <TranslationProvider>
      <RouterProvider router={router} />
    </TranslationProvider>
  );
}

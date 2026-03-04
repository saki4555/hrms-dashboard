import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { BrowserRouter } from "react-router";
import AppRoutes from "./routes";

import { ThemeProvider } from "./components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { SearchProvider } from "./context/search-provider";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <SearchProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
          </SearchProvider>
        </QueryClientProvider>
      </NuqsAdapter>
    </BrowserRouter>
  </StrictMode>,
);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppView from "./pages/AppView";
import Index from "./pages/Index";
import AdminPage from "./pages/AdminPage";
import ArchivePage from "./pages/ArchivePage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppView />} />
          <Route path="/intro" element={<Index />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/archiv" element={<ArchivePage />} />
          <Route path="/thema/:id" element={<TopicDetailPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

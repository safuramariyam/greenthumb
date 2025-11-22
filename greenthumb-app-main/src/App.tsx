import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SoilAnalysis from "./pages/SoilAnalysis";
import PlantHealth from "./pages/PlantHealth";
import CropRecommendations from "./pages/CropRecommendations";
import Calendar from "./pages/Calendar";
import Sustainability from "./pages/Sustainability";
import "./i18n/config";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="soil-analysis" element={<SoilAnalysis />} />
            <Route path="plant-health" element={<PlantHealth />} />
            <Route path="crop-recommendations" element={<CropRecommendations />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="sustainability" element={<Sustainability />} />
        
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  
    </TooltipProvider>

  </QueryClientProvider>
);

export default App;

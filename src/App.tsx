import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import MyTasks from "./pages/MyTasks";
import CreateTask from "./pages/CreateTask";
import Calendar from "./pages/Calendar";
import ConsultaTicket from "./pages/ConsultaTicket";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Estoque = lazy(() => import("./pages/Estoque"));
const Prospeccao = lazy(() => import("./pages/Prospeccao"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const Scripts = lazy(() => import("./pages/Scripts"));

const queryClient = new QueryClient();

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/my-tasks" element={<MyTasks />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-task" element={<CreateTask />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/prospeccao" element={<Prospeccao />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/consulta-ticket" element={<ConsultaTicket />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

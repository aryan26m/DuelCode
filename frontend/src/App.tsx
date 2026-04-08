import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CreateRoom from "./pages/CreateRoom.tsx";
import JoinRoom from "./pages/JoinRoom.tsx";
import Lobby from "./pages/Lobby.tsx";
import Battle from "./pages/Battle.tsx";
import Results from "./pages/Results.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/create-room" element={<RequireAuth><CreateRoom /></RequireAuth>} />
          <Route path="/join-room" element={<RequireAuth><JoinRoom /></RequireAuth>} />
          <Route path="/lobby" element={<RequireAuth><Lobby /></RequireAuth>} />
          <Route path="/battle/:id" element={<RequireAuth><Battle /></RequireAuth>} />
          <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

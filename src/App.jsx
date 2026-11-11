import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import CaseArchives from "./pages/CaseArchives";
import DetectionWorkspace from "./pages/DetectionWorkspace";
import InvestigationRoom from "./pages/InvestigationRoom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import VerificationWorkspace from "./pages/VerificationWorkspace";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<InvestigationRoom />} />
          {/* Two independent modules: separate pages, API files and hooks */}
          <Route path="/detection" element={<DetectionWorkspace />} />
          <Route path="/verification" element={<VerificationWorkspace />} />
          <Route path="/archives" element={<CaseArchives />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/new" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<Navigate to="/archives" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

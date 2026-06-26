import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../layouts/Layout";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import InterviewSetup from "../pages/interview/InterviewSetup";
import InterviewSession from "../pages/interview/InterviewSession";
import InterviewResults from "../pages/interview/InterviewResults";
import api, { setAccessToken } from "../services/api";

function AppRoutes() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await api.post("/api/v1/users/refresh-token");
        setAccessToken(res.data.data.accessToken);
      } catch {
        // no valid refresh cookie — user just isn't logged in, that's fine
      } finally {
        setAuthChecked(true);
      }
    };
    tryRefresh();
  }, []);

  if (!authChecked) {
    return null; // or a loading spinner, your call
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/interview/new" element={<InterviewSetup />} />
          <Route path="/interview/session" element={<InterviewSession />} />
          <Route path="/interview/results" element={<InterviewResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import AdminAuth from "./admin/AdminAuth";
import AdminHome from "./admin/AdminHome";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Admin Routes - Separate from main app with no Navbar/Footer */}
        <Route path="/youarenotsupposedtocomehere">
          {/* Show AdminAuth by default when visiting /youarenotsupposedtocomehere */}
          <Route index element={<AdminAuth />} />

          {/* Protected admin routes - only accessible after login */}
          <Route
            path="dashboard"
            element={
              <AdminProtectedRoute>
                <AdminHome />
              </AdminProtectedRoute>
            }
          />

          {/* Catch all for admin routes - redirect to admin auth */}
          <Route
            path="*"
            element={<Navigate to="/youarenotsupposedtocomehere" replace />}
          />
        </Route>

        {/* Main App Routes - Show Navbar & Footer */}
        <Route
          path="*"
          element={
            <div className="min-h-screen">
              <Navbar />
              <main className="container mx-auto max-w-7xl px-4 py-8">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/about" element={<About />} />

                  {/* Protected User Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all route for main app - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

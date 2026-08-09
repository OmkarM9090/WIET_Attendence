/**
 * AUTH CONTEXT
 * Manages user authentication state globally
 * Handles login, logout, and token/user data persistence
 */

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to verify if stored JWT token is expired (> 7 days)
  const isTokenExpired = (token) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return true;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch (e) {
      return true;
    }
  };

  // Initialize user state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login user with token, role, and name
   * @param {object} data - { token, role, name }
   */
  const login = (data) => {
    // Store token and user info separately for flexibility
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({
      role: data.role,
      name: data.name,
    }));
    setUser({
      role: data.role,
      name: data.name,
    });
  };

  /**
   * Logout user and clear storage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use Auth Context
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * DASHBOARD LAYOUT COMPONENT
 * Wraps dashboard pages with sidebar and header
 * Provides consistent layout structure
 */

import { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { theme } from "../styles/theme";

export default function DashboardLayout({ children, sidebarItems, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.surface }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          items={sidebarItems}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader title={title} subtitle={subtitle} />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-8"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

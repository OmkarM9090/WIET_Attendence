import { useState } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardLayout({ children, sidebarItems, title, subtitle }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-[#212529] font-sans antialiased">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          items={sidebarItems}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        {/* Header */}
        <DashboardHeader 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content Area with Smooth Page Animation */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8f9fa] animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import React from "react";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Layers,
  FileText,
  AlertTriangle,
} from "lucide-react";

export const DEFAULT_ADMIN_SIDEBAR_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Branches", path: "/admin/branches", icon: <Building2 size={18} /> },
  { label: "Subjects", path: "/admin/subjects", icon: <BookOpen size={18} /> },
  { label: "Students", path: "/admin/students", icon: <Users size={18} /> },
  { label: "Teachers", path: "/admin/teachers", icon: <GraduationCap size={18} /> },
  { label: "Batches", path: "/admin/batches", icon: <Layers size={18} /> },
  { label: "Reports", path: "/admin/reports", icon: <FileText size={18} /> },
  { label: "Defaulters", path: "/admin/defaulters", icon: <AlertTriangle size={18} /> },
];

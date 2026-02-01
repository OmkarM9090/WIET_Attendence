/**
 * EDIT ATTENDANCE MODAL
 * 
 * Shown when teacher attempts to mark attendance for a session
 * that already has attendance marked for the same date.
 * 
 * Allows teacher to:
 * - Cancel (close modal, keep current selection)
 * - Edit Attendance (update existing record with new absent students)
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: function - Callback to close modal
 * - onEdit: function - Callback when "Edit Attendance" clicked
 * - isLoading: boolean - Show loading state during API call
 */

import { theme } from "../styles/theme";
import Button from "./Button";

export default function EditAttendanceModal({
  isOpen,
  onClose,
  onEdit,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md rounded-lg"
        style={{
          backgroundColor: theme.colors.background,
          boxShadow: theme.shadows.xl,
        }}
      >
        {/* Modal Header with Icon */}
        <div
          className="border-b px-6 py-4"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-2xl"
              style={{ color: theme.colors.warning }}
            >
              ⚠️
            </span>
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              Edit Attendance
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5">
          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ color: theme.colors.text.primary }}
          >
            Attendance has already been marked for this session and date.
          </p>

          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: theme.colors.text.primary }}
          >
            You can update the list of absent students and generate a new report.
          </p>

          {/* Information Box */}
          <div
            className="rounded-lg border p-3 mb-6"
            style={{
              backgroundColor: theme.colors.info[50],
              borderColor: theme.colors.info[200],
            }}
          >
            <p
              className="text-xs"
              style={{ color: theme.colors.info[900] }}
            >
              <strong>ℹ️ Note:</strong> Your previous absent student selection will
              replace the existing record. The WhatsApp report will be regenerated
              with the updated information.
            </p>
          </div>
        </div>

        {/* Modal Footer with Buttons */}
        <div
          className="border-t px-6 py-4 flex gap-3 justify-end"
          style={{ borderColor: theme.colors.border }}
        >
          <Button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "600",
              backgroundColor: theme.colors.neutral[200],
              color: theme.colors.text.primary,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={onEdit}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "600",
              backgroundColor: theme.colors.primary,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Updating..." : "Edit Attendance"}
          </Button>
        </div>
      </div>
    </div>
  );
}

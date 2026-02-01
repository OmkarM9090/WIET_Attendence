/**
 * REPORT PREVIEW COMPONENT
 * Shows session summary and WhatsApp report text with copy/share actions.
 */

import { theme } from "../styles/theme";
import Button from "./Button";

export default function ReportPreview({ reportText, onCopy, onShare, onUpdateExcel, isUpdatingExcel, attendanceId }) {
  return (
    <div
      style={{
        marginTop: "24px",
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "12px",
        padding: "24px",
        boxShadow: theme.shadows.sm,
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: theme.colors.text.primary,
          marginBottom: "16px",
        }}
      >
        ✅ WhatsApp Report Preview
      </h3>

      <div
        style={{
          backgroundColor: theme.colors.neutral[50],
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "8px",
          padding: "16px",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "13px",
          color: theme.colors.text.primary,
          lineHeight: "1.6",
        }}
      >
        {reportText}
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}
      >
        {attendanceId && onUpdateExcel && (
          <Button 
            onClick={onUpdateExcel}
            disabled={isUpdatingExcel}
            style={{
              backgroundColor: isUpdatingExcel ? theme.colors.neutral[300] : theme.colors.success,
              color: theme.colors.surface,
            }}
          >
            {isUpdatingExcel ? "📊 Updating..." : "📊 Update Excel"}
          </Button>
        )}
        <Button onClick={onCopy}>Copy</Button>
        <Button onClick={onShare}>Share WhatsApp</Button>
      </div>
    </div>
  );
}

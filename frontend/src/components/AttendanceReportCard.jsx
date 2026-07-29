import Card from "./Card";
import { MessageSquare } from "lucide-react";

export default function AttendanceReportCard({ reportText }) {
  if (!reportText) return null;

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
          <MessageSquare size={18} />
        </div>
        <h3 className="text-base font-bold text-emerald-950">WhatsApp Report Preview</h3>
      </div>
      <div className="whitespace-pre-wrap rounded-xl bg-white p-4 text-xs font-mono text-emerald-950 border border-emerald-200/80 shadow-xs leading-relaxed">
        {reportText}
      </div>
    </Card>
  );
}

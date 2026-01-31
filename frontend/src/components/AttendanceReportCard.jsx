import Card from "./Card";

export default function AttendanceReportCard({ reportText }) {
  if (!reportText) return null;

  return (
    <Card className="border-green-200 bg-green-50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💬</span>
        <h3 className="text-lg font-semibold text-green-900">WhatsApp Preview</h3>
      </div>
      <div className="whitespace-pre-wrap rounded-lg bg-[#dcf8c6] p-4 text-sm font-mono text-green-900 border border-green-200">
        {reportText}
      </div>
    </Card>
  );
}

import { theme } from "../styles/theme";
import Modal from "./Modal";
import Button from "./Button";

export default function UploadResultModal({ isOpen, onClose, result }) {
  if (!result) return null;

  const { summary, failedRows } = result;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Excel Upload Results"
      size="xl"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800">Total Rows</h4>
            <p className="text-2xl font-bold text-blue-900">{summary?.total || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800">Success ✅</h4>
            <p className="text-2xl font-bold text-green-900">{summary?.successful || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm font-semibold text-red-800">Failed ❌</h4>
            <p className="text-2xl font-bold text-red-900">{summary?.failed || 0}</p>
          </div>
        </div>

        {/* Failed Rows Detail */}
        {failedRows && failedRows.length > 0 ? (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
              ❌ Failed Rows Details
            </h4>
            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 bg-gray-100 border-b">Row No</th>
                    <th className="px-4 py-3 bg-gray-100 border-b">Student Info</th>
                    <th className="px-4 py-3 bg-gray-100 border-b text-red-600">Issue Found</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failedRows.map((fail, idx) => (
                    <tr key={idx} className="hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-700">Row {fail.rowNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{fail.data.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{fail.data.email || "No Email"} • Roll: {fail.data.rollNo || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3 text-red-700 font-medium">
                        {fail.simpleMessage || fail.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 italic">
              💡 Tip: Fix these rows in your Excel file, delete the successful ones from it, and re-upload the fixed rows.
            </p>
          </div>
        ) : (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-8 rounded-lg text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold">Awesome!</h3>
            <p>All students were uploaded successfully without any errors.</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onClose} style={{ padding: "8px 24px" }}>
            Got it, Thanks!
          </Button>
        </div>
      </div>
    </Modal>
  );
}

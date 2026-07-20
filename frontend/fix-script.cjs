const fs = require('fs');
const file = 'c:/MERN Practice/Wiet-AttendenceSystem/frontend/src/pages/TeacherManagement.jsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// We want to keep everything up to line 1710 (0-indexed 1709)
const newLines = lines.slice(0, 1710);

const suffix = `              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  onClick={handleUpdateAssignment}
                  loading={editAssignmentLoading}
                  style={{ flex: 1 }}
                >
                  {editAssignmentLoading ? "Updating..." : "Update Assignment"}
                </Button>
                <Button
                  onClick={() => setIsEditAssignmentOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.neutral[100],
                    color: theme.colors.text.primary,
                    border: "none",
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

      {/* Upload Result Modal */}
      <UploadResultModal 
        isOpen={isResultModalOpen} 
        onClose={() => setIsResultModalOpen(false)} 
        result={uploadResult} 
        type="teacher"
      />

      {/* Data Preview Overlay */}
      {showPreview && uploadFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-6xl w-full">
            <DataPreviewTable 
              file={uploadFile} 
              type="teacher" 
              onCancel={() => {
                setShowPreview(false);
                setUploadFile(null);
              }}
              onConfirm={async (file) => {
                await handleUpload();
                setShowPreview(false);
              }} 
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
`;

fs.writeFileSync(file, newLines.join('\n') + '\n' + suffix);
console.log('Successfully fixed TeacherManagement.jsx');

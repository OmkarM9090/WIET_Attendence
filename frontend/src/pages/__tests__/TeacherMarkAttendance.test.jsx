/**
 * TEACHER MARK ATTENDANCE - COMPREHENSIVE TEST SUITE
 * 
 * Tests cover:
 * - Component rendering
 * - State management
 * - API interactions (mocked)
 * - User interactions
 * - Form validation
 * - Error handling
 * - Date validation
 * - Student selection
 * - Quick add functionality
 * - Edit modal functionality
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeacherMarkAttendance from '../TeacherMarkAttendance';
import * as teacherService from '../../services/teacherService';
import axiosInstance from '../../utils/axios';

// Mock dependencies
jest.mock('../../services/teacherService');
jest.mock('../../utils/axios');
jest.mock('../../components/DashboardLayout', () => {
  return function MockDashboardLayout({ children, title, subtitle }) {
    return (
      <div data-testid="dashboard-layout">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    );
  };
});

// Mock data
const mockAssignments = [
  {
    _id: 'assignment1',
    branch: { _id: 'branch1', name: 'Computer Engineering', code: 'COMP' },
    subject: { _id: 'subject1', name: 'Data Structures', code: 'DS' },
    year: 2,
    division: 'A',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'LECTURE',
    academicYear: '2025-2026',
  },
  {
    _id: 'assignment2',
    branch: { _id: 'branch1', name: 'Computer Engineering', code: 'COMP' },
    subject: { _id: 'subject2', name: 'DBMS Lab', code: 'DBMS' },
    year: 2,
    division: 'A',
    batch: { _id: 'batch1', name: 'B1' },
    startTime: '11:00',
    endTime: '12:00',
    sessionType: 'PRACTICAL',
    academicYear: '2025-2026',
  },
];

const mockStudents = [
  {
    _id: 'student1',
    rollNo: 1,
    name: 'John Doe',
    userId: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
  },
  {
    _id: 'student2',
    rollNo: 2,
    name: 'Jane Smith',
    userId: { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
  },
  {
    _id: 'student3',
    rollNo: 5,
    name: 'Bob Johnson',
    userId: { _id: 'user3', name: 'Bob Johnson', email: 'bob@example.com' },
  },
];

// Helper function to render component
const renderComponent = () => {
  return render(
    <BrowserRouter>
      <TeacherMarkAttendance />
    </BrowserRouter>
  );
};

describe('TeacherMarkAttendance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teacherService.getMyTeachingAssignments.mockResolvedValue(mockAssignments);
  });

  // ==================== RENDERING TESTS ====================

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      teacherService.getMyTeachingAssignments.mockImplementation(
        () => new Promise(() => {})
      );
      renderComponent();
      expect(screen.getByText(/loading your teaching sessions/i)).toBeInTheDocument();
    });

    test('renders main heading and description', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
      });
    });

    test('renders all three steps when assignment is selected', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/select your teaching session/i)).toBeInTheDocument();
      });

      // Select assignment
      const select = screen.getByLabelText(/select session/i);
      fireEvent.change(select, { target: { value: 'assignment1' } });

      await waitFor(() => {
        expect(screen.getByText(/select date/i)).toBeInTheDocument();
      });
    });

    test('renders error message when API fails', async () => {
      teacherService.getMyTeachingAssignments.mockRejectedValue(
        new Error('Network error')
      );
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('renders no assignments message', async () => {
      teacherService.getMyTeachingAssignments.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/no teaching assignments found/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== ASSIGNMENT SELECTION TESTS ====================

  describe('Assignment Selection', () => {
    test('displays assignment options in dropdown', async () => {
      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/select session/i);
      const options = within(select).getAllByRole('option');
      
      // Should have placeholder + 2 assignments
      expect(options).toHaveLength(3);
      expect(options[1]).toHaveTextContent(/data structures/i);
      expect(options[2]).toHaveTextContent(/dbms lab/i);
    });

    test('shows session details card when assignment selected', async () => {
      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/selected session details/i)).toBeInTheDocument();
        expect(screen.getByText('Computer Engineering')).toBeInTheDocument();
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
      });
    });

    test('clears students when assignment changes', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalled();
      });

      // Change assignment
      const select = screen.getByLabelText(/select session/i);
      fireEvent.change(select, { target: { value: 'assignment2' } });

      // Should trigger new API call
      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==================== DATE VALIDATION TESTS ====================

  describe('Date Validation', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });
    });

    test('accepts today\'s date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const dateInput = screen.getByLabelText(/attendance date/i);
      
      fireEvent.change(dateInput, { target: { value: today } });

      await waitFor(() => {
        expect(screen.queryByText(/cannot mark attendance for future dates/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/can only mark attendance for today or yesterday/i)).not.toBeInTheDocument();
      });
    });

    test('accepts yesterday\'s date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/attendance date/i);
      fireEvent.change(dateInput, { target: { value: yesterdayStr } });

      await waitFor(() => {
        expect(screen.queryByText(/cannot mark attendance for future dates/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/can only mark attendance for today or yesterday/i)).not.toBeInTheDocument();
      });
    });

    test('rejects future dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/attendance date/i);
      fireEvent.change(dateInput, { target: { value: tomorrowStr } });

      await waitFor(() => {
        expect(screen.getByText(/cannot mark attendance for future dates/i)).toBeInTheDocument();
      });
    });

    test('rejects dates older than yesterday', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/attendance date/i);
      fireEvent.change(dateInput, { target: { value: twoDaysAgoStr } });

      await waitFor(() => {
        expect(screen.getByText(/can only mark attendance for today or yesterday/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== STUDENT LOADING TESTS ====================

  describe('Student List Loading', () => {
    test('fetches and displays students for LECTURE session', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/students/for-session', {
          params: expect.objectContaining({
            sessionType: 'LECTURE',
            year: 2,
            division: 'A',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    test('fetches students with batch for PRACTICAL session', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment2' } });
      });

      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/students/for-session', {
          params: expect.objectContaining({
            sessionType: 'PRACTICAL',
            batch: 'batch1',
          }),
        });
      });
    });

    test('shows error when student loading fails', async () => {
      axiosInstance.get.mockRejectedValue({
        response: { data: { message: 'Failed to load students' } },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load students/i)).toBeInTheDocument();
      });
    });

    test('displays attendance summary correctly', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total students
      });
    });
  });

  // ==================== STUDENT SELECTION TESTS ====================

  describe('Student Selection', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('toggles student absent status', async () => {
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];

      expect(firstCheckbox).not.toBeChecked();
      
      fireEvent.click(firstCheckbox);
      
      await waitFor(() => {
        expect(firstCheckbox).toBeChecked();
      });

      fireEvent.click(firstCheckbox);
      
      await waitFor(() => {
        expect(firstCheckbox).not.toBeChecked();
      });
    });

    test('updates attendance summary when selecting students', async () => {
      const checkboxes = screen.getAllByRole('checkbox');
      
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        // Should show 2 absent, 1 present
        const absentCount = screen.getByText('2');
        const presentCount = screen.getByText('1');
        expect(absentCount).toBeInTheDocument();
        expect(presentCount).toBeInTheDocument();
      });
    });
  });

  // ==================== QUICK ADD TESTS ====================

  describe('Quick Add by Roll Numbers', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('adds students by comma-separated roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\., 1, 5, 9, 12/i);
      const addButton = screen.getByText(/add all/i);

      fireEvent.change(input, { target: { value: '1, 2' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Check that 2 students are marked absent
        expect(screen.getByText('2')).toBeInTheDocument(); // Absent count
      });
    });

    test('adds students by space-separated roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\., 1, 5, 9, 12/i);
      const addButton = screen.getByText(/add all/i);

      fireEvent.change(input, { target: { value: '1 5' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('shows error for invalid roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\., 1, 5, 9, 12/i);
      const addButton = screen.getByText(/add all/i);

      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid roll numbers/i)).toBeInTheDocument();
      });
    });

    test('shows error for non-existent roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\., 1, 5, 9, 12/i);
      const addButton = screen.getByText(/add all/i);

      fireEvent.change(input, { target: { value: '99' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/roll numbers not found: 99/i)).toBeInTheDocument();
      });
    });

    test('clears input after successful add', async () => {
      const input = screen.getByPlaceholderText(/e\.g\., 1, 5, 9, 12/i);
      const addButton = screen.getByText(/add all/i);

      fireEvent.change(input, { target: { value: '1, 2' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  // ==================== SAVE ATTENDANCE TESTS ====================

  describe('Save Attendance', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('save button is disabled initially', () => {
      const saveButton = screen.getByText(/save attendance & generate report/i);
      expect(saveButton).toBeDisabled();
    });

    test('save button is enabled when form is valid', async () => {
      await waitFor(() => {
        const saveButton = screen.getByText(/save attendance & generate report/i);
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('saves attendance successfully', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: false,
          reportText: 'Test Report',
        },
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Mark one student absent

      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/attendance/mark-and-generate',
          expect.objectContaining({
            teachingAssignmentId: 'assignment1',
            absentRollNumbers: [1],
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Test Report')).toBeInTheDocument();
      });
    });

    test('opens edit modal when attendance already exists (200 response)', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: true,
          attendanceId: 'existing123',
          message: 'Attendance already marked',
        },
      });

      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/attendance already marked/i)).toBeInTheDocument();
        expect(screen.getByText(/edit attendance/i)).toBeInTheDocument();
      });
    });

    test('handles 409 conflict error', async () => {
      axiosInstance.post.mockRejectedValue({
        response: {
          status: 409,
          data: {
            alreadyExists: true,
            attendanceId: 'existing123',
          },
        },
      });

      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Modal should open
        expect(screen.getByText(/edit attendance/i)).toBeInTheDocument();
      });
    });

    test('shows error message on save failure', async () => {
      axiosInstance.post.mockRejectedValue({
        response: {
          data: { message: 'Server error' },
        },
      });

      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== EDIT MODAL TESTS ====================

  describe('Edit Attendance Modal', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: true,
          attendanceId: 'existing123',
        },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Trigger duplicate detection
      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/edit attendance/i)).toBeInTheDocument();
      });
    });

    test('closes modal when cancel clicked', async () => {
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/attendance already marked/i)).not.toBeInTheDocument();
      });
    });

    test('updates attendance when edit confirmed', async () => {
      axiosInstance.put.mockResolvedValue({
        data: {
          success: true,
          reportText: 'Updated Report',
        },
      });

      const editButton = screen.getByText(/edit attendance/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(axiosInstance.put).toHaveBeenCalledWith(
          '/attendance/update/existing123',
          expect.objectContaining({
            absentRollNumbers: expect.any(Array),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Updated Report')).toBeInTheDocument();
      });
    });

    test('shows error when update fails', async () => {
      axiosInstance.put.mockRejectedValue({
        response: {
          data: { message: 'Update failed' },
        },
      });

      const editButton = screen.getByText(/edit attendance/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== REPORT PREVIEW TESTS ====================

  describe('Report Preview', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: false,
          reportText: 'Test WhatsApp Report\nAbsent: 1, 2',
        },
      });

      renderComponent();
      
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/test whatsapp report/i)).toBeInTheDocument();
      });
    });

    test('displays generated report', () => {
      expect(screen.getByText(/test whatsapp report/i)).toBeInTheDocument();
      expect(screen.getByText(/absent: 1, 2/i)).toBeInTheDocument();
    });

    test('copies report to clipboard', async () => {
      const copyButton = screen.getByText(/copy/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('Test WhatsApp Report')
        );
      });
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Integration Tests', () => {
    test('complete flow: select assignment, date, students, and save', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, students: mockStudents },
      });

      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: false,
          reportText: 'Success Report',
        },
      });

      renderComponent();
      
      // Step 1: Select assignment
      await waitFor(() => {
        const select = screen.getByLabelText(/select session/i);
        fireEvent.change(select, { target: { value: 'assignment1' } });
      });

      // Step 2: Date is already set to today by default

      // Step 3: Wait for students to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select absent students
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Save attendance
      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      // Verify report displayed
      await waitFor(() => {
        expect(screen.getByText('Success Report')).toBeInTheDocument();
      });
    });
  });
});

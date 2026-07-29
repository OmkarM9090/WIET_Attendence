/**
 * TEACHER MARK ATTENDANCE - COMPREHENSIVE TEST SUITE
 * 
 * Tests cover:
 * - Component rendering (session selection list & dedicated session page)
 * - Navigation to dedicated session page on card click
 * - State management
 * - API interactions (mocked)
 * - User interactions
 * - Form validation
 * - Date validation
 * - Student selection & roll call
 * - Quick add functionality
 * - Edit modal functionality (centered viewport overlay)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
    dayOfWeek: 'MONDAY',
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
    dayOfWeek: 'MONDAY',
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

// Helper function to render component with routes
const renderComponent = (initialRoute = '/teacher/mark-attendance') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/teacher/mark-attendance" element={<TeacherMarkAttendance />} />
        <Route path="/teacher/mark-attendance/:sessionId" element={<TeacherMarkAttendance />} />
      </Routes>
    </MemoryRouter>
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
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    test('renders main heading on session selection page', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
        expect(screen.getByText(/select teaching session/i)).toBeInTheDocument();
      });
    });

    test('renders session cards list when assignments load', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
        expect(screen.getByText('DBMS Lab')).toBeInTheDocument();
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

    test('renders no assignments message when list is empty', async () => {
      teacherService.getMyTeachingAssignments.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/no teaching sessions assigned/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== SESSION NAVIGATION TESTS ====================

  describe('Session Selection Navigation', () => {
    test('navigates to dedicated session page when session card is clicked', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
      });

      // Click session card
      const card = screen.getByText('Data Structures');
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/back to teaching sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/session details/i)).toBeInTheDocument();
        expect(screen.getByText(/select attendance date/i)).toBeInTheDocument();
      });
    });

    test('shows back button on dedicated session page and navigates back', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText(/back to teaching sessions/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText(/back to teaching sessions/i);
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText(/click on any teaching session card above/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== DATE VALIDATION TESTS ====================

  describe('Date Validation', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });
      renderComponent('/teacher/mark-attendance/assignment1');
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('accepts today\'s date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const dateInput = screen.getByLabelText(/date/i);
      
      fireEvent.change(dateInput, { target: { value: today } });

      await waitFor(() => {
        expect(screen.queryByText(/cannot mark attendance for future dates/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/cannot mark attendance for dates older than yesterday/i)).not.toBeInTheDocument();
      });
    });

    test('accepts yesterday\'s date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: yesterdayStr } });

      await waitFor(() => {
        expect(screen.queryByText(/cannot mark attendance for future dates/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/cannot mark attendance for dates older than yesterday/i)).not.toBeInTheDocument();
      });
    });

    test('rejects future dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: tomorrowStr } });

      await waitFor(() => {
        expect(screen.getByText(/cannot mark attendance for future dates/i)).toBeInTheDocument();
      });
    });

    test('rejects dates older than yesterday', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
      
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: twoDaysAgoStr } });

      await waitFor(() => {
        expect(screen.getByText(/cannot mark attendance for dates older than yesterday/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== STUDENT LOADING TESTS ====================

  describe('Student List Loading', () => {
    test('fetches and displays students for session', async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/attendance/students-for-session', {
          params: expect.objectContaining({
            teachingAssignmentId: 'assignment1',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    test('shows error when student loading fails', async () => {
      axiosInstance.get.mockRejectedValue({
        response: { data: { message: 'Failed to fetch students for this session' } },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch students for this session/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== STUDENT SELECTION TESTS ====================

  describe('Student Selection', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('toggles student absent status', async () => {
      const studentRow = screen.getByText('John Doe');

      fireEvent.click(studentRow);
      
      await waitFor(() => {
        expect(studentRow).toHaveClass('line-through');
      });

      fireEvent.click(studentRow);
      
      await waitFor(() => {
        expect(studentRow).not.toHaveClass('line-through');
      });
    });
  });

  // ==================== QUICK ADD TESTS ====================

  describe('Quick Add by Roll Numbers', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('adds students by comma-separated roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\. 12 34 35 or 12, 34/i);
      const addButton = screen.getByText('Add');

      fireEvent.change(input, { target: { value: '1, 2' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('shows error for invalid roll numbers', async () => {
      const input = screen.getByPlaceholderText(/e\.g\. 12 34 35 or 12, 34/i);
      const addButton = screen.getByText('Add');

      fireEvent.change(input, { target: { value: '99' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid roll numbers: 99/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== SAVE ATTENDANCE TESTS ====================

  describe('Save Attendance', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
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

      const studentRow = screen.getByText('John Doe');
      fireEvent.click(studentRow); // Mark one student absent

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
        expect(screen.getByRole('heading', { name: /edit attendance/i })).toBeInTheDocument();
      });
    });
  });

  // ==================== EDIT MODAL TESTS ====================

  describe('Edit Attendance Modal', () => {
    beforeEach(async () => {
      axiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockStudents },
      });

      axiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          alreadyExists: true,
          attendanceId: 'existing123',
        },
      });

      renderComponent('/teacher/mark-attendance/assignment1');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Trigger duplicate detection
      const saveButton = screen.getByText(/save attendance & generate report/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit attendance/i })).toBeInTheDocument();
      });
    });

    test('closes modal when cancel clicked', async () => {
      const cancelButton = screen.getByText(/cancel/i);
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/attendance has already been marked for this session/i)).not.toBeInTheDocument();
      });
    });

    test('updates attendance when edit confirmed', async () => {
      axiosInstance.put.mockResolvedValue({
        data: {
          success: true,
          reportText: 'Updated Report',
        },
      });

      const editButton = screen.getByRole('button', { name: /edit attendance/i });
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
  });
});

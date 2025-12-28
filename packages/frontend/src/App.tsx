import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DashboardPage } from './pages/DashboardPage';
import { CapturePage } from './pages/CapturePage';
import { TrashPage } from './pages/TrashPage';
import { CalendarPage } from './pages/CalendarPage';
import { AssignmentBoardPage } from './pages/AssignmentBoardPage';
import { FloatingActionButton } from './components/common/FloatingActionButton';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h1 className="text-xl font-bold text-gray-900">Agenda Management</h1>
            </div>
            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/calendar"
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Calendar
              </Link>
              <Link
                to="/assignments"
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Assignments
              </Link>
              <Link
                to="/trash"
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Trash
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <FloatingActionButton onClick={() => setIsQuickCaptureOpen(true)} />
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/assignments" element={<AssignmentBoardPage />} />
            <Route path="/trash" element={<TrashPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;

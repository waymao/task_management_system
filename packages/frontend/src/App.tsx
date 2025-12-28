import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => {
    const baseClass = "px-4 py-2 rounded-lg transition-colors";
    const activeClass = "bg-primary-600 text-white";
    const inactiveClass = "text-gray-700 hover:text-primary-600 hover:bg-gray-100";
    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h1 className="text-xl font-bold text-gray-900">Agenda Management</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-4">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/calendar" className={navLinkClass('/calendar')}>
                Calendar
              </Link>
              <Link to="/assignments" className={navLinkClass('/assignments')}>
                Assignments
              </Link>
              <Link to="/trash" className={navLinkClass('/trash')}>
                Trash
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  className={navLinkClass('/dashboard')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/calendar"
                  className={navLinkClass('/calendar')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Calendar
                </Link>
                <Link
                  to="/assignments"
                  className={navLinkClass('/assignments')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Assignments
                </Link>
                <Link
                  to="/trash"
                  className={navLinkClass('/trash')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trash
                </Link>
              </div>
            </div>
          )}
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

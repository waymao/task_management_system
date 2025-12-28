import { useTasks } from '../hooks/useTasks';
import { Calendar } from '../components/calendar/Calendar';
import { useState, useEffect, useMemo } from 'react';
import { useGoogleCalendarAuth, useGoogleCalendarAccounts, useDisconnectGoogleCalendar, useGoogleCalendarEvents, useSyncCalendarList, useCalendarPreferences, useUpdateCalendarPreference, useRefreshGoogleCalendarEvents } from '../hooks/useGoogleCalendar';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { TaskDetailModal } from '../components/common/TaskDetailModal';
import toast from 'react-hot-toast';
import type { Task } from '../types';

interface GoogleCalendarAccount {
  id: string;
  email: string;
  createdAt: string;
}

export function CalendarPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: authData } = useGoogleCalendarAuth();
  const { data: googleAccounts, isLoading: accountsLoading } = useGoogleCalendarAccounts();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const refreshEventsMutation = useRefreshGoogleCalendarEvents();

  // Calendar preferences
  const { data: calendarPreferences, isLoading: preferencesLoading } = useCalendarPreferences(selectedAccountId);
  const syncCalendarsMutation = useSyncCalendarList(selectedAccountId || '');
  const updatePreferenceMutation = useUpdateCalendarPreference(selectedAccountId || '');

  // Auto-select first account when accounts load
  useEffect(() => {
    if (googleAccounts && googleAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(googleAccounts[0].id);
    }
  }, [googleAccounts, selectedAccountId]);

  // Fetch Google Calendar events for a 3-month range
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString();

  const { data: googleEvents } = useGoogleCalendarEvents(
    googleAccounts && googleAccounts.length > 0 ? startDate : '',
    googleAccounts && googleAccounts.length > 0 ? endDate : ''
  );

  // Check for OAuth callback success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      setShowGoogleSettings(true);
      // Clean up URL
      window.history.replaceState({}, '', '/calendar');
    } else if (params.get('error')) {
      toast.error('Failed to connect Google Calendar');
      window.history.replaceState({}, '', '/calendar');
    }
  }, []);

  const handleConnectGoogle = () => {
    if (authData?.authUrl) {
      window.location.href = authData.authUrl;
    }
  };

  const handleDisconnect = (accountId: string) => {
    disconnectMutation.mutate(accountId, {
      onSuccess: () => {
        toast.success('Google Calendar disconnected');
        if (selectedAccountId === accountId) {
          setSelectedAccountId(null);
        }
      },
      onError: () => {
        toast.error('Failed to disconnect Google Calendar');
      },
    });
  };

  const handleSyncCalendars = () => {
    if (!selectedAccountId) return;

    syncCalendarsMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Calendars synced successfully');
      },
      onError: () => {
        toast.error('Failed to sync calendars');
      },
    });
  };

  const handleToggleCalendar = (calendarId: string, currentEnabled: boolean) => {
    updatePreferenceMutation.mutate(
      { calendarId, enabled: !currentEnabled },
      {
        onSuccess: () => {
          toast.success(!currentEnabled ? 'Calendar enabled' : 'Calendar disabled');
        },
        onError: () => {
          toast.error('Failed to update calendar preference');
        },
      }
    );
  };

  const handleRefreshEvents = () => {
    if (!googleAccounts || googleAccounts.length === 0) {
      toast.error('No Google Calendar connected');
      return;
    }

    refreshEventsMutation.mutate(
      { startDate, endDate },
      {
        onSuccess: () => {
          toast.success('Calendar events refreshed');
        },
        onError: () => {
          toast.error('Failed to refresh events');
        },
      }
    );
  };

  // Merge tasks with Google Calendar events (convert events to task-like objects)
  // IMPORTANT: This must be before any conditional returns to follow Rules of Hooks
  const allTasks = useMemo(() => {
    const taskList = tasks || [];

    if (!googleEvents || googleEvents.length === 0) {
      return taskList;
    }

    // Convert Google Calendar events to task-like objects
    const eventTasks: Task[] = googleEvents.map(event => ({
      id: `gcal-${event.id}`,
      title: `📅 ${event.title}`,
      description: `Google Calendar event from ${event.accountEmail}`,
      type: 'immediate' as const,
      status: 'pending' as const,
      priority: 'low' as const,
      dueDate: event.startTime,
      userId: '',
      createdAt: event.startTime,
      updatedAt: event.startTime,
      delegatedTo: null,
      followUpDate: null,
      projectId: null,
    }));

    return [...taskList, ...eventTasks];
  }, [tasks, googleEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg">Failed to load calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
          <p className="text-gray-600">
            View your tasks by their due dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {googleAccounts && googleAccounts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshEvents}
              disabled={refreshEventsMutation.isPending}
            >
              {refreshEventsMutation.isPending ? 'Refreshing...' : '🔄 Refresh Events'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGoogleSettings(!showGoogleSettings)}
          >
            {showGoogleSettings ? 'Hide' : 'Show'} Google Calendar Settings
          </Button>
        </div>
      </div>

      {showGoogleSettings && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Calendar Integration</h3>

          {accountsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : googleAccounts && googleAccounts.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Connected accounts:</p>
                {googleAccounts.map((account: GoogleCalendarAccount) => (
                  <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm font-medium">{account.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedAccountId === account.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSyncCalendars}
                            disabled={syncCalendarsMutation.isPending}
                          >
                            {syncCalendarsMutation.isPending ? 'Syncing...' : 'Refresh Calendars'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    {/* Calendar preferences for this account */}
                    {selectedAccountId === account.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Calendar Filters</h4>
                          {calendarPreferences && calendarPreferences.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {calendarPreferences.filter(c => c.enabled).length} of {calendarPreferences.length} enabled
                            </span>
                          )}
                        </div>

                        {preferencesLoading ? (
                          <p className="text-sm text-gray-500">Loading calendars...</p>
                        ) : calendarPreferences && calendarPreferences.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {calendarPreferences.map((calendar) => (
                              <label
                                key={calendar.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={calendar.enabled}
                                  onChange={() => handleToggleCalendar(calendar.calendarId, calendar.enabled)}
                                  disabled={updatePreferenceMutation.isPending}
                                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{calendar.calendarName}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No calendars found. Click "Sync Calendars" to load your calendars.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show button to expand calendar settings if not already selected */}
                    {selectedAccountId !== account.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAccountId(account.id)}
                        className="mt-2 text-xs"
                      >
                        Manage Calendars →
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">
                  Your Google Calendar events will appear on the calendar below with a 📅 icon
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to automatically sync your assignments as calendar events.
              </p>
              <Button onClick={handleConnectGoogle}>
                Connect Google Calendar
              </Button>
            </div>
          )}
        </Card>
      )}

      <Calendar
        tasks={allTasks}
        onTaskClick={setSelectedTask}
      />

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

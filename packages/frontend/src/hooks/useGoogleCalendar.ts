import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface GoogleCalendarAccount {
  id: string;
  email: string;
  createdAt: string;
}

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  accountEmail: string;
  isAllDay: boolean;
}

export function useGoogleCalendarAuth() {
  return useQuery({
    queryKey: ['google-calendar-auth-url'],
    queryFn: async () => {
      const response = await apiClient.get<{ authUrl: string }>('/google/auth');
      return response.data;
    },
    staleTime: Infinity, // Auth URL doesn't change frequently
  });
}

export function useGoogleCalendarAccounts() {
  return useQuery({
    queryKey: ['google-calendar-accounts'],
    queryFn: async () => {
      const response = await apiClient.get<{ accounts: GoogleCalendarAccount[] }>('/google/accounts');
      return response.data.accounts;
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      await apiClient.delete(`/google/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-accounts'] });
    },
  });
}

export function useGoogleCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['google-calendar-events', startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get<{ events: GoogleCalendarEvent[] }>('/google/events', {
        params: { startDate, endDate },
      });
      return response.data.events;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useSyncAssignmentToGoogle() {
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/google/sync-assignment/${assignmentId}`);
      return response.data;
    },
  });
}

interface CalendarPreference {
  id: string;
  accountId: string;
  calendarId: string;
  calendarName: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useSyncCalendarList(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ calendars: CalendarPreference[] }>(
        `/google/accounts/${accountId}/sync-calendars`
      );
      return response.data.calendars;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-preferences', accountId] });
    },
  });
}

export function useCalendarPreferences(accountId: string | null) {
  return useQuery({
    queryKey: ['google-calendar-preferences', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const response = await apiClient.get<{ calendars: CalendarPreference[] }>(
        `/google/accounts/${accountId}/calendars`
      );
      return response.data.calendars;
    },
    enabled: !!accountId,
  });
}

export function useUpdateCalendarPreference(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ calendarId, enabled }: { calendarId: string; enabled: boolean }) => {
      const response = await apiClient.patch(
        `/google/accounts/${accountId}/calendars`,
        { calendarId, enabled }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-preferences', accountId] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
  });
}

export function useRefreshGoogleCalendarEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const response = await apiClient.get<{ events: GoogleCalendarEvent[] }>('/google/events', {
        params: { startDate, endDate },
      });
      return response.data.events;
    },
    onSuccess: () => {
      // Invalidate all calendar event queries to refetch with fresh data
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
  });
}

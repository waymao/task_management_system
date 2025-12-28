import type { FastifyInstance } from 'fastify';
import { GoogleCalendarService } from '../services/google-calendar.service.js';
import { z } from 'zod';

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(), // userId
});

const accountIdParamSchema = z.object({
  accountId: z.string(),
});

const eventsQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const updateCalendarPreferenceSchema = z.object({
  calendarId: z.string(),
  enabled: z.boolean(),
});

export async function googleCalendarRoutes(app: FastifyInstance) {
  // Get auth URL to start OAuth flow
  app.get('/google/auth', async (request, reply) => {
    const userId = process.env.DEFAULT_USER_ID || 'default-user-1';
    const authUrl = GoogleCalendarService.getAuthUrl(userId);
    return { authUrl };
  });

  // OAuth callback handler
  app.get('/google/callback', async (request, reply) => {
    try {
      const { code, state: userId } = callbackQuerySchema.parse(request.query);
      await GoogleCalendarService.handleOAuthCallback(code, userId);

      // Redirect to frontend success page
      return reply.redirect('http://localhost:5173/calendar?connected=true');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return reply.redirect('http://localhost:5173/calendar?error=auth_failed');
    }
  });

  // Get connected accounts
  app.get('/google/accounts', async (request, reply) => {
    const userId = process.env.DEFAULT_USER_ID || 'default-user-1';
    const accounts = await GoogleCalendarService.getConnectedAccounts(userId);
    return { accounts };
  });

  // Disconnect account
  app.delete('/google/accounts/:accountId', async (request, reply) => {
    const { accountId } = accountIdParamSchema.parse(request.params);
    const userId = process.env.DEFAULT_USER_ID || 'default-user-1';

    await GoogleCalendarService.disconnectAccount(accountId, userId);
    return { success: true };
  });

  // Fetch events from Google Calendar
  app.get('/google/events', async (request, reply) => {
    const { startDate, endDate } = eventsQuerySchema.parse(request.query);
    const userId = process.env.DEFAULT_USER_ID || 'default-user-1';

    const events = await GoogleCalendarService.fetchEventsFromGoogle(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    return { events };
  });

  // Manually trigger sync of an assignment
  app.post('/google/sync-assignment/:assignmentId', async (request, reply) => {
    const { assignmentId } = z.object({ assignmentId: z.string() }).parse(request.params);
    const userId = process.env.DEFAULT_USER_ID || 'default-user-1';

    // Get assignment with task details
    const { prisma } = await import('../db/prisma.js');
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        userId,
      },
      include: {
        task: true,
      },
    });

    if (!assignment) {
      return reply.status(404).send({ error: 'Assignment not found' });
    }

    const event = await GoogleCalendarService.syncAssignmentToGoogle(assignment);
    return { success: true, event };
  });

  // Sync calendar list for an account
  app.post('/google/accounts/:accountId/sync-calendars', async (request, reply) => {
    const { accountId } = accountIdParamSchema.parse(request.params);
    const calendars = await GoogleCalendarService.syncCalendarList(accountId);
    return { calendars };
  });

  // Get calendar preferences for an account
  app.get('/google/accounts/:accountId/calendars', async (request, reply) => {
    const { accountId } = accountIdParamSchema.parse(request.params);
    const calendars = await GoogleCalendarService.getCalendarPreferences(accountId);
    return { calendars };
  });

  // Update calendar preference
  app.patch('/google/accounts/:accountId/calendars', async (request, reply) => {
    const { accountId } = accountIdParamSchema.parse(request.params);
    const { calendarId, enabled } = updateCalendarPreferenceSchema.parse(request.body);

    const calendar = await GoogleCalendarService.updateCalendarPreference(accountId, calendarId, enabled);
    return { calendar };
  });
}

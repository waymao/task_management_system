import { google } from 'googleapis';
import { prisma } from '../db/prisma.js';
import type { Assignment } from '@prisma/client';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GoogleCalendarService {
  static getAuthUrl(userId: string) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/calendar.readonly', // Access to read calendar list
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: userId, // Pass userId in state to link the account later
      prompt: 'consent', // Force consent screen to ensure we get refresh token
    });
    return authUrl;
  }

  static async handleOAuthCallback(code: string, userId: string) {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get access token or refresh token');
    }

    // Set credentials to get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    if (!email) {
      throw new Error('Failed to get user email from Google');
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    // Store or update the Google Calendar account
    const account = await prisma.googleCalendarAccount.upsert({
      where: {
        userId_email: {
          userId,
          email,
        },
      },
      create: {
        userId,
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });

    return account;
  }

  static async getConnectedAccounts(userId: string) {
    return prisma.googleCalendarAccount.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  static async disconnectAccount(accountId: string, userId: string) {
    // Verify the account belongs to the user
    const account = await prisma.googleCalendarAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Revoke the token with Google
    try {
      oauth2Client.setCredentials({ access_token: account.accessToken });
      await oauth2Client.revokeCredentials();
    } catch (error) {
      console.error('Failed to revoke Google token:', error);
    }

    // Delete the account (cascade will delete events)
    await prisma.googleCalendarAccount.delete({
      where: { id: accountId },
    });
  }

  static async refreshAccessToken(account: { refreshToken: string; id: string }) {
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiresAt = new Date(Date.now() + (credentials.expiry_date || 3600 * 1000));

    // Update the stored tokens
    await prisma.googleCalendarAccount.update({
      where: { id: account.id },
      data: {
        accessToken: credentials.access_token,
        expiresAt,
      },
    });

    return credentials.access_token;
  }

  static async getValidAccessToken(accountId: string) {
    const account = await prisma.googleCalendarAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired = account.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

    if (isExpired) {
      return this.refreshAccessToken(account);
    }

    return account.accessToken;
  }

  static async syncAssignmentToGoogle(assignment: Assignment & { task: { title: string; description: string | null } }) {
    // Get all connected accounts for this user
    const accounts = await prisma.googleCalendarAccount.findMany({
      where: { userId: assignment.userId },
    });

    if (accounts.length === 0) {
      return; // No Google Calendar connected
    }

    // Use the first connected account (you can enhance this later)
    const account = accounts[0];
    const accessToken = await this.getValidAccessToken(account.id);

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate start and end times based on slot
    const date = new Date(assignment.date);
    let startHour = 0;
    let endHour = 0;

    switch (assignment.slot) {
      case 'allday':
        startHour = 0;
        endHour = 23;
        break;
      case 'morning':
        startHour = 6;
        endHour = 12;
        break;
      case 'afternoon':
        startHour = 12;
        endHour = 18;
        break;
      case 'evening':
        startHour = 18;
        endHour = 23;
        break;
    }

    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);

    // Create event in Google Calendar
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: assignment.task.title,
        description: assignment.task.description || undefined,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        extendedProperties: {
          private: {
            agendaManagementId: assignment.id,
          },
        },
      },
    });

    // Store the event ID for future reference
    if (event.data.id) {
      await prisma.googleCalendarEvent.upsert({
        where: {
          accountId_eventId: {
            accountId: account.id,
            eventId: event.data.id,
          },
        },
        create: {
          accountId: account.id,
          eventId: event.data.id,
          title: assignment.task.title,
          startTime,
          endTime,
        },
        update: {
          title: assignment.task.title,
          startTime,
          endTime,
        },
      });
    }

    return event.data;
  }

  static async syncCalendarList(accountId: string) {
    const account = await prisma.googleCalendarAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = await this.getValidAccessToken(accountId);
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch all calendars for this account
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];

    // Sync calendar preferences
    for (const cal of calendars) {
      if (!cal.id || !cal.summary) continue;

      await prisma.googleCalendarPreference.upsert({
        where: {
          accountId_calendarId: {
            accountId,
            calendarId: cal.id,
          },
        },
        create: {
          accountId,
          calendarId: cal.id,
          calendarName: cal.summary,
          enabled: true, // Enable all calendars by default
        },
        update: {
          calendarName: cal.summary, // Update name if changed
        },
      });
    }

    return prisma.googleCalendarPreference.findMany({
      where: { accountId },
    });
  }

  static async getCalendarPreferences(accountId: string) {
    return prisma.googleCalendarPreference.findMany({
      where: { accountId },
      orderBy: { calendarName: 'asc' },
    });
  }

  static async updateCalendarPreference(accountId: string, calendarId: string, enabled: boolean) {
    return prisma.googleCalendarPreference.update({
      where: {
        accountId_calendarId: {
          accountId,
          calendarId,
        },
      },
      data: { enabled },
    });
  }

  static async fetchEventsFromGoogle(userId: string, startDate: Date, endDate: Date) {
    const accounts = await prisma.googleCalendarAccount.findMany({
      where: { userId },
    });

    const allEvents = [];

    for (const account of accounts) {
      const accessToken = await this.getValidAccessToken(account.id);
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Fetch all calendars for this account
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      // Sync calendar preferences (create if not exists)
      for (const cal of calendars) {
        if (!cal.id || !cal.summary) continue;

        await prisma.googleCalendarPreference.upsert({
          where: {
            accountId_calendarId: {
              accountId: account.id,
              calendarId: cal.id,
            },
          },
          create: {
            accountId: account.id,
            calendarId: cal.id,
            calendarName: cal.summary,
            enabled: true,
          },
          update: {
            calendarName: cal.summary,
          },
        });
      }

      // Get enabled calendars
      const enabledCalendars = await prisma.googleCalendarPreference.findMany({
        where: {
          accountId: account.id,
          enabled: true,
        },
      });

      const enabledCalendarIds = enabledCalendars.map(c => c.calendarId);

      // Fetch events from each enabled calendar
      for (const cal of calendars) {
        if (!cal.id || !enabledCalendarIds.includes(cal.id)) continue;

        try {
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = response.data.items || [];

          for (const event of events) {
            if (event.id && event.summary && event.start && event.end) {
              // Detect if this is an all-day event (has date instead of dateTime)
              const isAllDay = !event.start.dateTime;

              let startTime: Date;
              let endTime: Date;

              if (isAllDay) {
                // For all-day events, use the date at midnight local time
                // event.start.date is in format "YYYY-MM-DD"
                const [startYear, startMonth, startDay] = event.start.date!.split('-').map(Number);
                startTime = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

                const [endYear, endMonth, endDay] = event.end.date!.split('-').map(Number);
                endTime = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);
              } else {
                // For timed events, use the dateTime as-is
                startTime = new Date(event.start.dateTime!);
                endTime = new Date(event.end.dateTime!);
              }

              await prisma.googleCalendarEvent.upsert({
                where: {
                  accountId_eventId: {
                    accountId: account.id,
                    eventId: event.id,
                  },
                },
                create: {
                  accountId: account.id,
                  eventId: event.id,
                  title: event.summary,
                  startTime,
                  endTime,
                  isAllDay,
                },
                update: {
                  title: event.summary,
                  startTime,
                  endTime,
                  isAllDay,
                },
              });

              allEvents.push({
                id: event.id,
                title: event.summary,
                startTime,
                endTime,
                isAllDay,
                accountEmail: account.email,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch events from calendar ${cal.id}:`, error);
          // Continue with other calendars even if one fails
        }
      }
    }

    return allEvents;
  }
}

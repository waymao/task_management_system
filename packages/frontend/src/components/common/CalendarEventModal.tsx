import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  accountEmail?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  isAllDay?: boolean;
}

interface CalendarEventModalProps {
  event: GoogleCalendarEvent;
  onClose: () => void;
}

export function CalendarEventModal({ event, onClose }: CalendarEventModalProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h3 className="text-lg font-semibold text-gray-900">Calendar Event</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{event.title}</h4>
          </div>

          {/* Date and Time */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">{event.isAllDay ? '📅' : '🕒'}</span>
              <div className="flex-1">
                {event.isAllDay ? (
                  <>
                    <div className="font-medium text-gray-900">All-day event</div>
                    <div className="text-sm text-gray-700 mt-1">
                      {formatInTimeZone(startDate, 'UTC', 'EEEE, MMMM d, yyyy')}
                    </div>
                    {startDate.toDateString() !== endDate.toDateString() && (
                      <div className="text-xs text-gray-600 mt-1">
                        Until: {formatInTimeZone(new Date(endDate.getTime() - 1), 'UTC', 'EEEE, MMMM d, yyyy')}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">
                      {format(startDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                    </div>
                    {startDate.toDateString() !== endDate.toDateString() && (
                      <div className="text-xs text-gray-600 mt-1">
                        Ends: {format(endDate, 'EEEE, MMMM d, yyyy')} at {format(endDate, 'h:mm a')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Email */}
          {event.accountEmail && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📧 Account:</span>
              <span className="text-sm text-gray-600">{event.accountEmail}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Description:</div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📍 Location:</span>
              <span className="text-sm text-gray-600">{event.location}</span>
            </div>
          )}

          {/* Link to Google Calendar */}
          {event.htmlLink && (
            <div className="pt-4 border-t">
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <span>Open in Google Calendar</span>
                <span>→</span>
              </a>
            </div>
          )}

          <div className="text-xs text-gray-500 italic border-t pt-3">
            This is a read-only event from Google Calendar. To edit, open the event in Google Calendar.
          </div>
        </div>
      </div>
    </div>
  );
}

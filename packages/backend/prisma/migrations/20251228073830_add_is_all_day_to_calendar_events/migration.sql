-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_google_calendar_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "google_calendar_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "google_calendar_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_google_calendar_events" ("accountId", "createdAt", "endTime", "eventId", "id", "startTime", "title", "updatedAt") SELECT "accountId", "createdAt", "endTime", "eventId", "id", "startTime", "title", "updatedAt" FROM "google_calendar_events";
DROP TABLE "google_calendar_events";
ALTER TABLE "new_google_calendar_events" RENAME TO "google_calendar_events";
CREATE INDEX "google_calendar_events_accountId_startTime_idx" ON "google_calendar_events"("accountId", "startTime");
CREATE UNIQUE INDEX "google_calendar_events_accountId_eventId_key" ON "google_calendar_events"("accountId", "eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

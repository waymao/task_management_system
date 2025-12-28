-- CreateTable
CREATE TABLE "google_calendar_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "calendarName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "google_calendar_preferences_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "google_calendar_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "google_calendar_preferences_accountId_enabled_idx" ON "google_calendar_preferences"("accountId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_preferences_accountId_calendarId_key" ON "google_calendar_preferences"("accountId", "calendarId");

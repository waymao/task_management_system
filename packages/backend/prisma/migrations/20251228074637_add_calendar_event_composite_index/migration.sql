-- CreateIndex
CREATE INDEX "google_calendar_accounts_userId_idx" ON "google_calendar_accounts"("userId");

-- CreateIndex
CREATE INDEX "google_calendar_events_accountId_endTime_idx" ON "google_calendar_events"("accountId", "endTime");

-- CreateIndex
CREATE INDEX "google_calendar_events_accountId_startTime_endTime_idx" ON "google_calendar_events"("accountId", "startTime", "endTime");

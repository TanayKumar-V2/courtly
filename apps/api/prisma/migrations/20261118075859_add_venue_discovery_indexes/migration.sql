-- CreateIndex
CREATE INDEX "courts_venueId_status_sport_idx" ON "courts"("venueId", "status", "sport");

-- CreateIndex
CREATE INDEX "courts_venueId_status_basePricePerHour_idx" ON "courts"("venueId", "status", "basePricePerHour");

-- CreateIndex
CREATE INDEX "courts_venueId_status_indoor_idx" ON "courts"("venueId", "status", "indoor");

-- CreateIndex
CREATE INDEX "venues_status_state_idx" ON "venues"("status", "state");

-- CreateIndex
CREATE INDEX "venues_status_latitude_longitude_idx" ON "venues"("status", "latitude", "longitude");

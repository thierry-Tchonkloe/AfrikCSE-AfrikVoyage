-- CreateIndex
CREATE INDEX "bookings_travelRequestId_idx" ON "bookings"("travelRequestId");

-- CreateIndex
CREATE INDEX "bookings_flightRouteId_idx" ON "bookings"("flightRouteId");

-- CreateIndex
CREATE INDEX "bookings_hotelRoomTypeId_idx" ON "bookings"("hotelRoomTypeId");

-- CreateIndex
CREATE INDEX "bookings_trainRouteId_idx" ON "bookings"("trainRouteId");

-- CreateIndex
CREATE INDEX "bookings_carRentalVehicleId_idx" ON "bookings"("carRentalVehicleId");

-- CreateIndex
CREATE INDEX "travel_requests_partnerId_idx" ON "travel_requests"("partnerId");

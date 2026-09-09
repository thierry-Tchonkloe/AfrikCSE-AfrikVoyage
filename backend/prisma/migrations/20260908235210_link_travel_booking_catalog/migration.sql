/*
  Warnings:

  - You are about to drop the column `partnerName` on the `travel_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "carRentalVehicleId" TEXT,
ADD COLUMN     "flightRouteId" TEXT,
ADD COLUMN     "hotelRoomTypeId" TEXT,
ADD COLUMN     "trainRouteId" TEXT,
ADD COLUMN     "travelRequestId" TEXT;

-- AlterTable
ALTER TABLE "travel_requests" DROP COLUMN "partnerName",
ADD COLUMN     "partnerId" TEXT;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "travel_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_flightRouteId_fkey" FOREIGN KEY ("flightRouteId") REFERENCES "flight_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotelRoomTypeId_fkey" FOREIGN KEY ("hotelRoomTypeId") REFERENCES "hotel_room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trainRouteId_fkey" FOREIGN KEY ("trainRouteId") REFERENCES "train_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_carRentalVehicleId_fkey" FOREIGN KEY ("carRentalVehicleId") REFERENCES "car_rental_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

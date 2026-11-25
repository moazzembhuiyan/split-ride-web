import type { AppSocket } from "@/lib/socket";
import { bookingService } from "@/services/booking.service";

const CANCEL_REASON = "Payment was not completed";

export async function withdrawUnpaid(opts: {
  socket: AppSocket;
  rideId?: string;
  bookingId?: string;
}): Promise<void> {
  const { socket, rideId, bookingId } = opts;

  if (rideId) {
    await new Promise<void>((resolve) => {
      socket.emit(
        "ride:cancel-before-accept",
        { rideId, reason: CANCEL_REASON },
        () => resolve(),
      );
      // Don't hang if the backend never acks
      setTimeout(resolve, 2500);
    });
  }

  if (bookingId) {
    try {
      await bookingService.changeBookingStatus(bookingId, {
        status: "cancelled",
        cancellationReason: CANCEL_REASON,
      });
    } catch {
      // Best-effort; the socket cancel is the primary withdraw
    }
  }
}

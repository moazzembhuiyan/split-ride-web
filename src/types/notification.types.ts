export interface Notification {
  _id: string;
  id: string;
  user: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  booking?: string;
  bookingId?: string;
  rideId?: string;
  screen?: string;
  type?: string;
  chatId?: string;
  data?: Record<string, string | undefined>;
  payload?: Record<string, string | undefined>;
}

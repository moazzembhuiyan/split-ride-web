/** Stages of one passenger's trip, in the only order they can happen. */
export const RIDE_STAGES = [
  "waiting",
  "accepted",
  "enRoute",
  "arrived",
  "pickedUp",
  "droppedOff",
  "completed",
] as const;

export type RideStage = (typeof RIDE_STAGES)[number];

function rank(stage: RideStage): number {
  return RIDE_STAGES.indexOf(stage);
}

/** The later of two stages: a late refresh never moves the status back. */
export function furthest(a: RideStage, b: RideStage): RideStage {
  return rank(b) > rank(a) ? b : a;
}

export function hasReached(stage: RideStage, target: RideStage): boolean {
  return rank(stage) >= rank(target);
}

interface PassengerState {
  status?: string | null;
  arriveAt?: string | null;
  arrivedNotified?: boolean;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
}

function key(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

const STATUS_STAGE: Record<string, RideStage> = {
  accepted: "accepted",
  enroute: "enRoute",
  started: "enRoute",
  arrived: "arrived",
  pickedup: "pickedUp",
  running: "enRoute",
  droppedoff: "droppedOff",
  dropped: "droppedOff",
  completed: "completed",
};

/** Stage of a passenger according to the server. */
export function passengerStage(
  passenger: PassengerState | null | undefined,
): RideStage {
  if (!passenger) return "waiting";
  let stage = STATUS_STAGE[key(passenger.status)] ?? "waiting";
  if (passenger.arriveAt || passenger.arrivedNotified) {
    stage = furthest(stage, "arrived");
  }
  if (passenger.pickedUpAt) stage = furthest(stage, "pickedUp");
  if (passenger.droppedOffAt) stage = furthest(stage, "droppedOff");
  return stage;
}

const GONE = new Set(["cancelled", "canceled", "declined", "noshow"]);

/** False once the passenger has left the ride. */
export function isActivePassenger(
  passenger: { status?: string | null; isNoShow?: boolean } | null | undefined,
): boolean {
  if (!passenger) return false;
  return !GONE.has(key(passenger.status)) && passenger.isNoShow !== true;
}

/**
 * Whether a ride event concerns this passenger. Events without a passenger id
 * can only be attributed on a ride with a single rider.
 */
export function isEventForPassenger(
  event: { passengerId?: string; userId?: string } | null | undefined,
  mine: { passengerId?: string; userId?: string; alone: boolean },
): boolean {
  if (event?.passengerId) return event.passengerId === mine.passengerId;
  if (event?.userId) return event.userId === mine.userId;
  return mine.alone;
}

"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Add01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Car01Icon,
  FavouriteIcon,
  Location01Icon,
  Luggage01Icon,
  MinusSignCircleIcon,
  Navigation01Icon,
  PlusSignCircleIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const LUGGAGE_OPTIONS = ["Suitcase", "Handcarry", "Backpack", "Box"];
const CAR_TYPES = ["Sedan", "SUV", "Van", "Truck"];
const SEAT_OPTIONS = ["4 Seater", "6 Seater", "8 Seater"];

export const RIDE_OPTIONS = [
  { id: 1, name: "Jane Cooper", rating: 4.9, price: 60, eta: 10, seats: 4 },
  { id: 2, name: "Esther Howard", rating: 4.9, price: 65, eta: 12, seats: 4 },
  { id: 3, name: "Leslie Alexander", rating: 5, price: 70, eta: 10, seats: 4 },
  { id: 4, name: "Robert Fox", rating: 4.9, price: 68, eta: 16, seats: 4 },
];

export default function Form() {
  const [passengers, setPassengers] = React.useState(2);
  const [carType, setCarType] = React.useState("Sedan");
  const [seatOption, setSeatOption] = React.useState("4 Seater");
  const [luggageTags, setLuggageTags] = React.useState<
    { id: number; label: string }[]
  >([
    { id: 1, label: "Suitcase" },
    { id: 2, label: "Handcarry" },
    { id: 3, label: "Suitcase" },
  ]);
  const nextId = React.useRef(4);
  const [from, setFrom] = React.useState("F2 Square");
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [luggageOpen, setLuggageOpen] = React.useState(false);
  const [dialogLuggageType, setDialogLuggageType] = React.useState("Suitcase");
  const [luggageDetails, setLuggageDetails] = React.useState("");
  const [rideDialogOpen, setRideDialogOpen] = React.useState(false);
  const [selectedRide, setSelectedRide] = React.useState(RIDE_OPTIONS[0].id);

  function removeLuggage(id: number) {
    setLuggageTags((prev) => prev.filter((t) => t.id !== id));
  }

  function addDialogLuggage() {
    setLuggageTags((prev) => [
      ...prev,
      { id: nextId.current++, label: dialogLuggageType },
    ]);
  }

  return (
    <>
      <div className="w-full">
        <FieldGroup>
          {/* Passengers + Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Passengers</FieldLabel>
              <div className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12">
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  className="text-primary"
                >
                  <HugeiconsIcon
                    icon={MinusSignCircleIcon}
                    className="size-5"
                  />
                </button>
                <span className="flex-1 text-center font-medium">
                  {passengers}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengers((p) => p + 1)}
                  className="text-primary"
                >
                  <HugeiconsIcon icon={PlusSignCircleIcon} className="size-5" />
                </button>
              </div>
            </Field>
            <Field>
              <FieldLabel>Select Date &amp; Time</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Calendar01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  type="datetime-local"
                  placeholder="Date & Time"
                />
              </InputGroup>
            </Field>
          </div>

          {/* Type Of Car + Options */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Type Of Car</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Car01Icon} />
                </InputGroupAddon>
                <Select value={carType} onValueChange={setCarType}>
                  <SelectTrigger className="flex-1 border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 h-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Options</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Car01Icon} />
                </InputGroupAddon>
                <Select value={seatOption} onValueChange={setSeatOption}>
                  <SelectTrigger className="flex-1 border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 h-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEAT_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InputGroup>
            </Field>
          </div>

          {/* Luggage Type */}
          <Field>
            <FieldLabel>Luggage Type</FieldLabel>
            <button
              type="button"
              onClick={() => setLuggageOpen(true)}
              className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12 w-full text-left text-sm"
            >
              <HugeiconsIcon
                icon={Luggage01Icon}
                className="text-muted-foreground size-5 shrink-0"
              />
              <span className="flex-1 text-muted-foreground">
                {luggageTags.length > 0
                  ? luggageTags[0].label
                  : "Select luggage type"}
              </span>
              <HugeiconsIcon
                icon={Add01Icon}
                className="text-primary size-4 shrink-0"
              />
            </button>
          </Field>

          {/* Luggage tags */}
          <div className="flex flex-wrap items-center gap-2 -mt-3">
            {luggageTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-input/50 px-3 py-1 text-sm font-medium"
              >
                {tag.label}
                <button
                  type="button"
                  onClick={() => removeLuggage(tag.id)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setLuggageOpen(true)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add More Luggage
            </button>
          </div>

          {/* Add Luggage Dialog */}
          <Dialog open={luggageOpen} onOpenChange={setLuggageOpen}>
            <DialogContent className="gap-4" showCloseButton={false}>
              <DialogTitle className="text-center text-base font-semibold">
                Add Luggage
              </DialogTitle>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Luggage Type</p>
                  <div className="flex flex-wrap gap-2">
                    {LUGGAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDialogLuggageType(opt)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          dialogLuggageType === opt
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-input/50 hover:border-primary/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {luggageTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-input/50 px-3 py-1 text-sm font-medium"
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => removeLuggage(tag.id)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          className="size-3.5"
                        />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={addDialogLuggage}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary hover:bg-primary/20"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    Add More
                  </button>
                </div>

                <textarea
                  value={luggageDetails}
                  onChange={(e) => setLuggageDetails(e.target.value)}
                  placeholder="Enter Your Luggage Details"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-border bg-input/50 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="button"
                onClick={() => setLuggageOpen(false)}
                className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-400 py-3 text-sm font-semibold text-white"
              >
                Confirm Now
              </button>
            </DialogContent>
          </Dialog>

          {/* From + To */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel className="mb-0">From</FieldLabel>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <HugeiconsIcon icon={FavouriteIcon} className="size-3.5" />
                  Save this place
                </button>
              </div>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Location01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Ride Origin"
                />
                <InputGroupAddon align="inline-end">
                  <HugeiconsIcon
                    icon={Navigation01Icon}
                    className="text-muted-foreground"
                  />
                </InputGroupAddon>
              </InputGroup>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline text-left mt-1"
              >
                Choose from Saved Places
              </button>
            </Field>
            <Field>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel className="mb-0">To</FieldLabel>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <HugeiconsIcon icon={FavouriteIcon} className="size-3.5" />
                  Save this place
                </button>
              </div>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Location01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Ride Destination"
                />
                <InputGroupAddon align="inline-end">
                  <HugeiconsIcon
                    icon={Navigation01Icon}
                    className="text-muted-foreground"
                  />
                </InputGroupAddon>
              </InputGroup>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline text-left mt-1"
              >
                Choose from Saved Places
              </button>
            </Field>
          </div>

          {/* Note + Book button */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field>
              <FieldLabel>Enter note for driver</FieldLabel>
              <InputGroup className="h-auto">
                <InputGroupInput
                  placeholder="Type here"
                  value={note}
                  className="resize-none h-12 pt-2"
                  onChange={(e) => setNote(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Dialog open={rideDialogOpen} onOpenChange={setRideDialogOpen}>
              <DialogTrigger asChild>
                <Button type="submit" className="w-full h-12 mt-2">
                  Book Your Ride
                </Button>
              </DialogTrigger>
              <DialogContent
                className="gap-4 p-0 overflow-hidden"
                showCloseButton={false}
              >
                <div className="flex items-center justify-between px-5 pt-5">
                  <DialogTitle className="text-lg font-bold">
                    Choose Your Ride
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => setRideDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                  </button>
                </div>

                <div className="px-2">
                  {RIDE_OPTIONS.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedRide(driver.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors text-left ${
                        selectedRide === driver.id
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar>
                        <AvatarImage src="/user.png" alt="Avatar" />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{driver.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <HugeiconsIcon
                              icon={StarIcon}
                              className="size-3.5 text-amber-400 fill-amber-400"
                            />
                            {driver.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="size-4 rounded-full bg-primary/20 inline-flex items-center justify-center text-primary font-bold text-[10px]">
                              $
                            </span>
                            ${driver.price}
                          </span>
                          <span>{driver.eta} min</span>
                          <span>{driver.seats} Seats</span>
                        </div>
                      </div>
                      <div className="shrink-0 w-16 h-10">
                        <Image
                          className="-scale-x-100"
                          src={"/single-car.webp"}
                          alt="Car"
                          width={64}
                          height={40}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <Button type="button" className="w-full" asChild>
                    <Link href="/book/confirm">Continue</Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </FieldGroup>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Have Issues Booking? Get In Touch With{" "}
        <Link
          href="/support"
          className="text-primary font-semibold hover:underline"
        >
          Our Support
        </Link>
      </p>
    </>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import Form from "../form";
import {
  Map as RideMap,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import Image from "next/image";
import React from "react";
import Find from "../find";
import { mapStyle } from "../mapThree";

const dummyCars = [
  { id: "car-1", longitude: -74.0152, latitude: 40.7171, heading: 18 },
  { id: "car-2", longitude: -73.9998, latitude: 40.7056, heading: 132 },
  { id: "car-3", longitude: -74.0029, latitude: 40.7264, heading: 248 },
  { id: "car-4", longitude: -73.9897, latitude: 40.7193, heading: 310 },
  { id: "car-5", longitude: -74.0188, latitude: 40.7041, heading: 86 },
] as const;

export default function Page() {
  const [type, setType] = React.useState<"split" | "private">("split");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-full w-full py-8 lg:py-12 flex flex-col items-center justify-start gap-4 px-4 sm:px-8 lg:px-12">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Let's Book Your Ride</h1>
        </div>

        <div className="w-full space-y-2">
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              variant={type === "split" ? "default" : "accent"}
              className="w-full"
              onClick={() => setType("split")}
            >
              Split Your Ride
            </Button>
            <Button
              variant={type === "private" ? "default" : "accent"}
              className="w-full"
              onClick={() => setType("private")}
            >
              Private Ride
            </Button>
          </div>
          <div className="font-medium text-sm">
            <span className="text-primary font-semibold">Save upto 50%</span> by
            sharing ride with others
          </div>
        </div>
        {type === "split" ? <Form /> : <Find />}
      </div>
      <div className="min-h-80 lg:min-h-180 overflow-hidden rounded-3xl border border-border/60 bg-muted/20 shadow-2xl shadow-black/5">
        <RideMap
          center={[-74.006, 40.7128]}
          className="h-full min-h-80 lg:min-h-180"
          theme="light"
          // styles={{
          //   light: mapStyle,
          // }}
          pitch={45}
          zoom={16}
        >
          <MapControls />
          <MapMarker longitude={-74.006} latitude={40.7128}>
            <MarkerContent>
              <Image src="/icon/car.svg" alt="Car" width={24} height={24} />
            </MarkerContent>
          </MapMarker>
          {dummyCars.map((car) => (
            <MapMarker
              key={car.id}
              longitude={car.longitude}
              latitude={car.latitude}
              rotation={car.heading}
              rotationAlignment="map"
            >
              <MarkerContent className="">
                <Image src="/icon/car.svg" alt="Car" width={24} height={24} />
              </MarkerContent>
            </MapMarker>
          ))}
        </RideMap>
      </div>
    </div>
  );
}

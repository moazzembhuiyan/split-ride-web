"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  CYPRUS_AIRPORTS,
  CYPRUS_CENTER_LATLNG,
  isInCyprus,
} from "@/lib/cyprus";
import { cn } from "@/lib/utils";

export interface AddressData {
  lat: number;
  lng: number;
  streetName: string;
  streetNumber: string;
  district: string;
  municipality: string;
  zip: string;
}

const MIN_QUERY_LENGTH = 2;

type ListItem =
  | {
      kind: "airport";
      id: string;
      label: string;
      lat: number;
      lng: number;
    }
  | { kind: "place"; id: string; label: string };

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? "";
}

function parseComponents(
  result: google.maps.GeocoderResult,
  lat: number,
  lng: number,
): AddressData {
  const c = result.address_components;
  return {
    lat,
    lng,
    streetName: getComponent(c, "route"),
    streetNumber: getComponent(c, "street_number"),
    district:
      getComponent(c, "sublocality_level_1") ||
      getComponent(c, "sublocality") ||
      getComponent(c, "neighborhood"),
    municipality:
      getComponent(c, "locality") ||
      getComponent(c, "administrative_area_level_2"),
    zip: getComponent(c, "postal_code"),
  };
}

function matchingAirports(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const genericAirport =
    q === "airport" || q === "airports" || q.startsWith("airport ");

  return CYPRUS_AIRPORTS.filter((a) => {
    if (genericAirport) return true;
    if (a.label.toLowerCase().includes(q)) return true;
    return a.aliases.some(
      (alias) => alias.includes(q) || q.includes(alias),
    );
  });
}

interface PlacesInputProps {
  value: string;
  onChange: (v: string) => void;
  onCoordinates?: (lat: number, lng: number) => void;
  onAddressData?: (data: AddressData) => void;
  disabled?: boolean;
  placeholder?: string;
}

function PlacesInput({
  value,
  onChange,
  onCoordinates,
  onAddressData,
  disabled,
  placeholder = "Search an address in Cyprus",
}: PlacesInputProps) {
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    ready,
    value: inputVal,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    defaultValue: value,
    requestOptions: {
      componentRestrictions: { country: "cy" },
      locationBias: CYPRUS_CENTER_LATLNG,
    },
  });

  useEffect(() => {
    if (value && value !== inputVal) setValue(value, false);
  }, [value, inputVal, setValue]);

  const items = useMemo<ListItem[]>(() => {
    const q = inputVal.trim();
    if (q.length < MIN_QUERY_LENGTH) return [];

    const airports: ListItem[] = matchingAirports(q).map((a) => ({
      kind: "airport",
      id: `airport-${a.lat}-${a.lng}`,
      label: a.label,
      lat: a.lat,
      lng: a.lng,
    }));

    const airportLabels = new Set(airports.map((a) => a.label.toLowerCase()));
    const places: ListItem[] =
      status === "OK"
        ? data
            .filter((p) => !airportLabels.has(p.description.toLowerCase()))
            .map((p) => ({
              kind: "place",
              id: p.place_id,
              label: p.description,
            }))
        : [];

    return [...airports, ...places];
  }, [inputVal, status, data]);

  const showList = open && !disabled && items.length > 0;

  function closeList() {
    setOpen(false);
    setActiveIndex(-1);
    clearSuggestions();
  }

  function applyLocation(label: string, lat: number, lng: number, parsed?: AddressData) {
    if (!isInCyprus(lat, lng)) {
      toast.error("Pickup and destination must be in Cyprus.");
      return;
    }
    committed.current = label;
    setValue(label, false);
    closeList();
    onChange(label);
    onCoordinates?.(lat, lng);
    if (parsed) onAddressData?.(parsed);
  }

  async function selectPlace(description: string) {
    setValue(description, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = getLatLng(results[0]);
      applyLocation(description, lat, lng, parseComponents(results[0], lat, lng));
    } catch {
      toast.error("Could not find that address. Try another suggestion.");
    }
  }

  function selectItem(item: ListItem) {
    if (item.kind === "airport") {
      applyLocation(item.label, item.lat, item.lng);
      return;
    }
    void selectPlace(item.label);
  }

  function handleInputChange(next: string) {
    setValue(next);
    onChange(next);
    setOpen(true);
    setActiveIndex(-1);
    if (next.trim() !== committed.current.trim()) {
      onCoordinates?.(0, 0);
    }
    if (next.trim().length < MIN_QUERY_LENGTH) {
      clearSuggestions();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeList();
      return;
    }
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  }

  return (
    <div className="relative flex-1 flex items-center min-w-0">
      <input
        data-slot="input-group-control"
        value={inputVal}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => closeList(), 120);
        }}
        onKeyDown={handleKeyDown}
        disabled={!ready || disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        className="flex-1 w-full rounded-none border-0 bg-transparent shadow-none ring-0 outline-none focus:outline-none text-sm py-2"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 top-full inset-x-0 mt-1 rounded-xl border bg-popover shadow-lg overflow-hidden text-sm max-h-[min(15rem,40dvh)] overflow-y-auto"
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(item);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "cursor-pointer px-3 py-2.5 truncate",
                index === activeIndex ? "bg-accent" : "hover:bg-accent",
                item.kind === "airport" && "font-medium",
              )}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onCoordinates?: (lat: number, lng: number) => void;
  onAddressData?: (data: AddressData) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordinates,
  onAddressData,
  disabled,
  placeholder,
}: AddressAutocompleteProps) {
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    if (!key) {
      setMapsError(true);
      return;
    }
    setOptions({ key });
    importLibrary("places")
      .then(() => setMapsReady(true))
      .catch(() => setMapsError(true));
  }, []);

  if (!mapsReady) {
    return (
      <input
        data-slot="input-group-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled
        placeholder={
          mapsError
            ? "Address search unavailable"
            : (placeholder ?? "Loading address search…")
        }
        className="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 outline-none text-sm py-2"
      />
    );
  }

  return (
    <PlacesInput
      value={value}
      onChange={onChange}
      onCoordinates={onCoordinates}
      onAddressData={onAddressData}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

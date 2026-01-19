"use client";

import { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AddressSelectorValue = {
  country: string; // country name
  state: string;   // state/region name
  city: string;    // city name
};

type Props = {
  value: AddressSelectorValue;
  onChange: (next: Partial<AddressSelectorValue>) => void;

  labels: {
    country: string;
    state: string;
    city: string;

    selectCountry: string;
    selectState: string;
    selectCity: string;

    cityManualPlaceholder: string;

    // optional, if not provided fallback strings are used
    stateManualPlaceholder?: string;
    stateNotAvailableHint?: string;
    cityNotAvailableHint?: string;
    cityManualLabel?: string; // "Manual"
  };

  /** City can be required (default true). */
  requiredCity?: boolean;
};

function findCountryIsoByName(name: string): string {
  const n = name.trim().toLowerCase();
  if (!n) return "";
  return (
    Country.getAllCountries().find((c) => c.name.toLowerCase() === n)?.isoCode ??
    ""
  );
}

function findStateIsoByName(countryIso: string, stateName: string): string {
  const n = stateName.trim().toLowerCase();
  if (!countryIso || !n) return "";
  return (
    State.getStatesOfCountry(countryIso).find(
      (s) => s.name.toLowerCase() === n
    )?.isoCode ?? ""
  );
}

export function AddressSelector({
  value,
  onChange,
  labels,
  requiredCity = true,
}: Props) {
  const countries = useMemo(() => Country.getAllCountries(), []);

  const [countryIso, setCountryIso] = useState<string>(() =>
    findCountryIsoByName(value.country)
  );
  const [stateIso, setStateIso] = useState<string>(() =>
    findStateIsoByName(countryIso, value.state)
  );

  // If cities exist, user can still manually type by toggling this flag.
  const [cityManualMode, setCityManualMode] = useState(false);

  // Keep ISO state in sync when parent value changes (e.g. saved address applied)
  useEffect(() => {
    const nextCountryIso = findCountryIsoByName(value.country);
    setCountryIso(nextCountryIso);
    setStateIso(findStateIsoByName(nextCountryIso, value.state));

    // If saved address already has city filled, keep manualMode false
    // unless user later chooses manual explicitly.
    setCityManualMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.country, value.state]);

  const states = useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso);
  }, [countryIso]);

  const cities = useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso);
  }, [countryIso, stateIso]);

  const stateHasSelectableList = states.length > 0;
  const cityHasSelectableList = cities.length > 0;

  const stateManualPlaceholder =
    labels.stateManualPlaceholder ?? labels.selectState;
  const stateNotAvailableHint =
    labels.stateNotAvailableHint ?? "State/region list is not available.";
  const cityNotAvailableHint =
    labels.cityNotAvailableHint ?? "City list is not available.";
  const cityManualLabel = labels.cityManualLabel ?? "Manual";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* COUNTRY */}
      <div className="space-y-2">
        <Label>{labels.country}</Label>
        <Select
          value={countryIso || ""}
          onValueChange={(iso) => {
            const country = countries.find((c) => c.isoCode === iso);
            setCountryIso(iso);
            setStateIso("");
            setCityManualMode(false);

            onChange({
              country: country?.name ?? "",
              state: "",
              city: "",
            });
          }}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder={labels.selectCountry} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {countries.map((c) => (
              <SelectItem key={c.isoCode} value={c.isoCode}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STATE */}
      <div className="space-y-2">
        <Label>{labels.state}</Label>

        {stateHasSelectableList ? (
          <Select
            value={stateIso || ""}
            onValueChange={(iso) => {
              const st = states.find((s) => s.isoCode === iso);
              setStateIso(iso);
              setCityManualMode(false);
              onChange({ state: st?.name ?? "", city: "" });
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={labels.selectState} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              value={value.state}
              onChange={(e) => {
                // If state is manually typed, clear stateIso
                setStateIso("");
                setCityManualMode(false);
                onChange({ state: e.target.value, city: "" });
              }}
              placeholder={stateManualPlaceholder}
              disabled={!countryIso}
            />
            {countryIso ? (
              <p className="text-xs text-slate-500">{stateNotAvailableHint}</p>
            ) : null}
          </>
        )}
      </div>

      {/* CITY */}
      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <Label>{labels.city}</Label>

          {/* Manual toggle only makes sense if there is a list */}
          {cityHasSelectableList ? (
            <button
              type="button"
              onClick={() => {
                setCityManualMode((v) => !v);
                onChange({ city: "" });
              }}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              {cityManualMode ? labels.selectCity : cityManualLabel}
            </button>
          ) : null}
        </div>

        {cityHasSelectableList && !cityManualMode ? (
          <Select
            value={value.city || ""}
            onValueChange={(name) => onChange({ city: name })}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={labels.selectCity} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {cities.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              value={value.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder={labels.cityManualPlaceholder}
              required={requiredCity}
              disabled={!countryIso}
            />
            {countryIso && stateIso && !cityHasSelectableList ? (
              <p className="text-xs text-slate-500">{cityNotAvailableHint}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
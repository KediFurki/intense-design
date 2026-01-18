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
  country: string;
  state: string;
  city: string;
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
  };

  /** State/city selects are optional; city can always be manually typed. */
  requiredCity?: boolean;
};

function findCountryIsoByName(name: string): string {
  const n = name.trim().toLowerCase();
  if (!n) return "";
  return Country.getAllCountries().find((c) => c.name.toLowerCase() === n)?.isoCode ?? "";
}

function findStateIsoByName(countryIso: string, stateName: string): string {
  const n = stateName.trim().toLowerCase();
  if (!countryIso || !n) return "";
  return (
    State.getStatesOfCountry(countryIso).find((s) => s.name.toLowerCase() === n)?.isoCode ?? ""
  );
}

export function AddressSelector({ value, onChange, labels, requiredCity = true }: Props) {
  const countries = useMemo(() => Country.getAllCountries(), []);

  const [countryIso, setCountryIso] = useState<string>(() => findCountryIsoByName(value.country));
  const [stateIso, setStateIso] = useState<string>(() => findStateIsoByName(countryIso, value.state));

  // Keep ISO state in sync when parent value changes (e.g., saved address applied)
  useEffect(() => {
    const nextCountryIso = findCountryIsoByName(value.country);
    setCountryIso(nextCountryIso);
    setStateIso(findStateIsoByName(nextCountryIso, value.state));
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

  const cityHasSelectableList = cities.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>{labels.country}</Label>
        <Select
          value={countryIso || ""}
          onValueChange={(iso) => {
            const country = countries.find((c) => c.isoCode === iso);
            setCountryIso(iso);
            setStateIso("");
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

      <div className="space-y-2">
        <Label>{labels.state}</Label>
        <Select
          value={stateIso || ""}
          onValueChange={(iso) => {
            const st = states.find((s) => s.isoCode === iso);
            setStateIso(iso);
            onChange({ state: st?.name ?? "", city: "" });
          }}
          disabled={!countryIso || states.length === 0}
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
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>{labels.city}</Label>
        {cityHasSelectableList ? (
          <Select
            value={value.city || ""}
            onValueChange={(name) => onChange({ city: name })}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={labels.selectCity} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {cities.map((c) => (
                <SelectItem key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder={labels.cityManualPlaceholder}
            required={requiredCity}
          />
        )}
      </div>
    </div>
  );
}
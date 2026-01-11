"use client";

import { useState } from "react";
// Tipleri import ediyoruz (any hatasını çözer)
import { Country, State, City, IState, ICity } from "country-state-city";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function AddressSelector() {
  const [countries] = useState(Country.getAllCountries());
  const [selectedCountry, setSelectedCountry] = useState("");
  
  // 'any' yerine doğru tipleri kullanıyoruz
  const [states, setStates] = useState<IState[]>([]);
  const [selectedState, setSelectedState] = useState("");
  
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  // useEffect YERİNE Event Handler kullanıyoruz (Performans artışı)
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setStates(State.getStatesOfCountry(value)); // Eyaletleri hemen güncelle
    setSelectedState(""); // Eyalet seçimini sıfırla
    setCities([]); // Şehirleri sıfırla
    setSelectedCity(""); // Şehir seçimini sıfırla
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setCities(City.getCitiesOfState(selectedCountry, value)); // Şehirleri hemen güncelle
    setSelectedCity(""); // Şehir seçimini sıfırla
  };

  const getCountryName = () => countries.find(c => c.isoCode === selectedCountry)?.name || selectedCountry;
  const getStateName = () => states.find(s => s.isoCode === selectedState)?.name || selectedState;
  
  const showCityInput = selectedState && cities.length === 0;

  return (
    <div className="space-y-4">
      {/* GİZLİ INPUTLAR */}
      <input type="hidden" name="country" value={getCountryName()} />
      <input type="hidden" name="state" value={getStateName()} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ÜLKE SEÇİMİ */}
        <div className="space-y-2">
          <Label>Country</Label>
          <Select onValueChange={handleCountryChange} value={selectedCountry}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.isoCode} value={c.isoCode}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* EYALET / BÖLGE SEÇİMİ */}
        <div className="space-y-2">
          <Label>State / Province</Label>
          <Select onValueChange={handleStateChange} value={selectedState} disabled={!selectedCountry}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ŞEHİR SEÇİMİ */}
        <div className="space-y-2">
          <Label>City</Label>
          {showCityInput ? (
             <Input name="city" placeholder="Enter City" className="bg-white" required />
          ) : (
            <>
                <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState || cities.length === 0}>
                    <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                    {cities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                        {c.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <input type="hidden" name="city" value={selectedCity} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
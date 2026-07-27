import { useState } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const RESTAURANTS = [
  "Bread Street Kitchen & Bar",
  "Petrus by Gordon Ramsay",
  "Lucky Cat by Gordon Ramsay",
  "Gordon Ramsay Bar & Grill",
  "Union Street Cafe",
  "Gordon Ramsay Restaurant, Chelsea",
];

const GUEST_COUNTS = Array.from({ length: 12 }, (_, i) => i + 1);

export function BookingBar() {
  const [restaurant, setRestaurant] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !date || !time || !guests) {
      toast.error("Please complete every field to book a table.");
      return;
    }
    toast.success(`Checking availability at ${restaurant} for ${guests} guest(s)...`);
  };

  return (
    <form
      id="book"
      onSubmit={handleSubmit}
      className="w-full bg-[#141414] py-3"
      aria-label="Book a table"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col md:flex-row items-stretch gap-3 px-4 md:px-8 py-2">
        <label className="sr-only" htmlFor="gr-restaurant">
          Restaurant
        </label>
        <select
          id="gr-restaurant"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          className="flex-[1.4] rounded-[4px] border border-[rgba(77,77,77,0.8)] bg-[#141414] px-5 py-[15px] text-[15px] text-[#d0d0d0] outline-none focus:border-white/60"
        >
          <option value="" disabled>
            Select a Restaurant
          </option>
          {RESTAURANTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[4px] border border-[rgba(77,77,77,0.8)] bg-[#141414] px-5 py-[15px] pr-10 text-[15px] text-[#d0d0d0] outline-none focus:border-white/60 [color-scheme:dark]"
          />
          <CalendarDays className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d0d0d0]" />
        </div>

        <div className="relative flex-1">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-[4px] border border-[rgba(77,77,77,0.8)] bg-[#141414] px-5 py-[15px] pr-10 text-[15px] text-[#d0d0d0] outline-none focus:border-white/60 [color-scheme:dark]"
          />
          <Clock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d0d0d0]" />
        </div>

        <div className="relative flex-1">
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            aria-label="Party size"
            className="w-full appearance-none rounded-[4px] border border-[rgba(77,77,77,0.8)] bg-[#141414] px-5 py-[15px] pr-10 text-[15px] text-[#d0d0d0] outline-none focus:border-white/60"
          >
            <option value="" disabled>
              Guests
            </option>
            {GUEST_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
                {n === 12 ? "+" : ""} Guest{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <Users className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d0d0d0]" />
        </div>

        <button type="submit" className="gr-btn gr-btn-light flex-1 md:flex-none">
          Book a Table
        </button>
      </div>
    </form>
  );
}

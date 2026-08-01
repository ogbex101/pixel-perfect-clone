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
    <div className="relative z-20 mx-auto -mt-14 max-w-[1240px] px-4 md:px-6">
      <form
        id="book"
        onSubmit={handleSubmit}
        aria-label="Book a table"
        className="gr-booking-card grid grid-cols-1 gap-5 p-6 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end md:gap-4 md:p-7"
      >
        <div>
          <label className="gr-field-label" htmlFor="gr-restaurant">
            Restaurant
          </label>
          <select
            id="gr-restaurant"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            className="gr-input"
          >
            <option value="" disabled>
              Select a restaurant
            </option>
            {RESTAURANTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="gr-field-label" htmlFor="gr-date">
            Date
          </label>
          <div className="relative">
            <input
              id="gr-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="gr-input pr-10 [color-scheme:dark]"
            />
            <CalendarDays className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--gr-gold)]" />
          </div>
        </div>

        <div>
          <label className="gr-field-label" htmlFor="gr-time">
            Time
          </label>
          <div className="relative">
            <input
              id="gr-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="gr-input pr-10 [color-scheme:dark]"
            />
            <Clock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--gr-gold)]" />
          </div>
        </div>

        <div>
          <label className="gr-field-label" htmlFor="gr-guests">
            Guests
          </label>
          <div className="relative">
            <select
              id="gr-guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="gr-input appearance-none pr-10"
            >
              <option value="" disabled>
                Party size
              </option>
              {GUEST_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                  {n === 12 ? "+" : ""} Guest{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <Users className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--gr-gold)]" />
          </div>
        </div>

        <button type="submit" className="gr-btn-solid w-full md:w-auto">
          Book a Table
        </button>
      </form>
    </div>
  );
}

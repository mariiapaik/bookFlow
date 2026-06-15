import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { api, Service, Slot } from '../api';

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );

const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<Slot | null>(null);

  useEffect(() => {
    api.listServices().then(setServices).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!service) return;
    setSlot(null);
    setLoadingSlots(true);
    api
      .getSlots(service.id, date)
      .then(setSlots)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSlots(false));
  }, [service, date]);

  const canSubmit = useMemo(
    () =>
      service &&
      slot &&
      form.customerName.trim().length > 1 &&
      form.customerPhone.trim().length > 4 &&
      /\S+@\S+\.\S+/.test(form.customerEmail),
    [service, slot, form],
  );

  async function submit() {
    if (!service || !slot) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createBooking({ serviceId: service.id, startAt: slot.start, ...form });
      setConfirmed(slot);
    } catch (e: any) {
      setError(e.message);
      // Slot may have just been taken — refresh availability.
      if (service) api.getSlots(service.id, date).then(setSlots);
      setSlot(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed && service) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold">You're booked!</h1>
        <p className="mt-2 text-gray-600">
          {service.name} on{' '}
          <b>{format(parseISO(confirmed.start), 'EEEE, d MMM yyyy · HH:mm')}</b>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          A confirmation email is on its way to {form.customerEmail}.
        </p>
        <button
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2 text-white hover:bg-brand-700"
          onClick={() => {
            setConfirmed(null);
            setService(null);
            setSlot(null);
            setForm({ customerName: '', customerPhone: '', customerEmail: '' });
          }}
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Book an appointment</h1>
      <p className="mt-1 text-gray-500">Choose a service, pick a time, and you're set.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1 — service */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          1 · Service
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setService(s)}
              className={`rounded-xl border p-4 text-left transition ${
                service?.id === s.id
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.name}</span>
                <span className="text-brand-600">{money(s.priceCents)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{s.description}</p>
              <p className="mt-1 text-xs text-gray-400">{s.durationMinutes} min</p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — date + slot */}
      {service && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            2 · Date & time
          </h2>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <div className="mt-4">
            {loadingSlots ? (
              <p className="text-gray-400">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-400">No free slots on this day. Try another date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setSlot(s)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      slot?.start === s.start
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-gray-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    {format(parseISO(s.start), 'HH:mm')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 3 — details */}
      {service && slot && (
        <section className="mt-8 max-w-md">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            3 · Your details
          </h2>
          <div className="space-y-3">
            <input
              placeholder="Full name"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Phone"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <button
              disabled={!canSubmit || submitting}
              onClick={submit}
              className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {submitting
                ? 'Booking…'
                : `Confirm ${format(parseISO(slot.start), 'HH:mm')} · ${money(service.priceCents)}`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

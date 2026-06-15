import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { api, auth, Booking, BookingStatus, SessionUser } from '../api';

const STATUS_FILTERS: (BookingStatus | 'all')[] = [
  'all',
  'confirmed',
  'completed',
  'cancelled',
];

const badge: Record<BookingStatus, string> = {
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const money = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [error, setError] = useState('');

  function logout() {
    auth.clear();
    navigate('/admin/login', { replace: true });
  }

  async function load() {
    try {
      const data = await api.listBookings(filter === 'all' ? undefined : filter);
      setBookings(data);
    } catch (e: any) {
      setError(e.message);
      if (/401|unauth/i.test(e.message)) logout();
    }
  }

  useEffect(() => {
    api.me().then(setUser).catch(logout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function changeStatus(b: Booking, status: BookingStatus) {
    await api.setBookingStatus(b.id, status);
    load();
  }

  const upcomingRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.service.priceCents, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          {user && (
            <p className="text-sm text-gray-500">
              {user.name} · <span className="capitalize">{user.role}</span>
            </p>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Log out
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
          <span className="text-xs text-gray-400">Confirmed (shown)</span>
          <div className="text-lg font-bold">{money(upcomingRevenue)}</div>
        </div>
        <div className="ml-auto flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No bookings here yet.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {format(parseISO(b.startAt), 'd MMM · HH:mm')}
                </td>
                <td className="px-4 py-3">{b.service?.name}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.customerName}</div>
                  <div className="text-xs text-gray-400">
                    {b.customerPhone} · {b.customerEmail}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${badge[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {b.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => changeStatus(b, 'completed')}
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => changeStatus(b, 'cancelled')}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

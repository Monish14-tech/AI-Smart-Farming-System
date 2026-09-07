'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRequireRole } from '@/contexts/AuthContext';
import { api } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Stats {
  totalListings: number;
  activeListings: number;
  pendingOrders: number;
  totalEarnings: number;
  thisMonthEarnings: number;
}

interface MandiPrice { commodity: string; market: string; state: string; modal_price: number; min_price: number; max_price: number; }

export default function FarmerDashboard() {
  const { user, loading } = useRequireRole('farmer');
  const [stats, setStats] = useState<Stats | null>(null);
  const [mandiPrices, setMandiPrices] = useState<MandiPrice[]>([]);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [listingsRes, ordersRes, earningsRes, mandiRes, weatherRes] = await Promise.all([
          api.get('/farmer/listings'),
          api.get('/farmer/orders'),
          api.get('/farmer/earnings'),
          api.get('/farmer/mandi-prices'),
          api.get('/ai/weather'),
        ]);
        const listings = listingsRes.data.listings || [];
        const orders = ordersRes.data.orders || [];
        setStats({
          totalListings: listings.length,
          activeListings: listings.filter((l: any) => l.status === 'active').length,
          pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
          totalEarnings: earningsRes.data.totalEarnings || 0,
          thisMonthEarnings: earningsRes.data.thisMonthEarnings || 0,
        });
        setMandiPrices(mandiRes.data.prices || []);
        setWeather(weatherRes.data.weather);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    load();
  }, [user]);

  if (loading || !user) return <LoadingSkeleton />;

  const weatherCode = weather?.current?.weathercode;
  const weatherEmoji = weatherCode === 0 ? '☀️' : weatherCode < 3 ? '⛅' : weatherCode < 60 ? '🌧️' : '🌩️';

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          {/* Header */}
          <div className="animate-fade-in" style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
              <span className="gradient-text">{user.name.split(' ')[0]}</span>! 🌾
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>Here's your farm overview for today</p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Active Listings', value: stats?.activeListings ?? '—', icon: '📋', color: '#059669', glow: 'stat-glow-green' },
              { label: 'Pending Orders', value: stats?.pendingOrders ?? '—', icon: '📦', color: '#D97706', glow: 'stat-glow-gold' },
              { label: 'This Month', value: stats ? `₹${stats.thisMonthEarnings.toLocaleString('en-IN')}` : '—', icon: '📈', color: '#4F46E5', glow: 'stat-glow-blue' },
              { label: 'Total Earnings', value: stats ? `₹${stats.totalEarnings.toLocaleString('en-IN')}` : '—', icon: '💰', color: '#D97706', glow: 'stat-glow-gold' },
            ].map((s, i) => (
              <div key={i} className={`glass ${s.glow} animate-fade-in`} style={{ padding: 24, animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* Mandi Prices */}
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>📊 Today's Mandi Prices</h2>
                <span className="badge badge-green">Live</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Crop</th><th>Market</th><th>Modal Price</th><th>Range</th></tr>
                </thead>
                <tbody>
                  {mandiPrices.slice(0, 8).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.commodity}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{p.market}, {p.state}</td>
                      <td><span className="font-display" style={{ color: 'var(--color-gold)', fontWeight: 700 }}>₹{p.modal_price}/q</span></td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>₹{p.min_price}–{p.max_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Weather widget */}
              {weather && (
                <div className="glass stat-glow-blue" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>🌡️ Current Weather</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 40 }}>{weatherEmoji}</span>
                    <div>
                      <div className="font-display" style={{ fontSize: 32, fontWeight: 800 }}>{weather.current?.temperature_2m}°C</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Humidity: {weather.current?.relative_humidity_2m}%</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Wind: {weather.current?.wind_speed_10m} km/h</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>⚡ Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/farmer/listings/new" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>+ Add New Listing</Link>
                  <Link href="/farmer/orders" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>View Pending Orders</Link>
                  <Link href="/farmer/chat" className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}>🤖 Ask AI Advisor</Link>
                </div>
              </div>

              {/* Verification status */}
              {!user.isVerified && (
                <div className="glass" style={{ padding: 20, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#B45309' }}>Verification Pending</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>Upload your land docs to get verified. Verified farmers get priority listing placement.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="layout-main">
        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
          <div className="shimmer" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </main>
    </div>
  );
}

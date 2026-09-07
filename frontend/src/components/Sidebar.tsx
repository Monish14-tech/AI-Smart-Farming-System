'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, Role } from '@/contexts/AuthContext';
import { useLanguage, LANGUAGES, Language } from '@/contexts/LanguageContext';
import { useState, useRef, useEffect } from 'react';

// ─── Nav item definitions (keyed by translation key) ─────────────────────────
type NavItemDef = { href: string; icon: string; labelKey: string };

const navItems: Record<Role, NavItemDef[]> = {
  farmer: [
    { href: '/farmer/dashboard',  icon: '🏠', labelKey: 'nav.dashboard'   },
    { href: '/farmer/listings',   icon: '🌾', labelKey: 'nav.myListings'  },
    { href: '/farmer/orders',     icon: '📦', labelKey: 'nav.orders'      },
    { href: '/farmer/earnings',   icon: '💰', labelKey: 'nav.earnings'    },
    { href: '/farmer/chat',       icon: '🤖', labelKey: 'nav.aiAdvisory'  },
    { href: '/farmer/mandi',      icon: '📊', labelKey: 'nav.mandiPrices' },
  ],
  buyer: [
    { href: '/buyer/dashboard',   icon: '🏠', labelKey: 'nav.dashboard'   },
    { href: '/buyer/marketplace', icon: '🛒', labelKey: 'nav.marketplace' },
    { href: '/buyer/orders',      icon: '📦', labelKey: 'nav.myOrders'    },
    { href: '/buyer/chat',        icon: '🤖', labelKey: 'nav.aiAssistant' },
  ],
  transporter: [
    { href: '/transporter/dashboard', icon: '🏠', labelKey: 'nav.dashboard'     },
    { href: '/transporter/jobs',      icon: '📋', labelKey: 'nav.availableJobs' },
    { href: '/transporter/active',    icon: '🗺️', labelKey: 'nav.activeTrip'    },
    { href: '/transporter/earnings',  icon: '💰', labelKey: 'nav.earnings'      },
  ],
  admin: [
    { href: '/admin/dashboard', icon: '📊', labelKey: 'nav.analytics'  },
    { href: '/admin/users',     icon: '👥', labelKey: 'nav.usersKyc'   },
    { href: '/admin/listings',  icon: '📋', labelKey: 'nav.listings'   },
    { href: '/admin/orders',    icon: '📦', labelKey: 'nav.orders'     },
  ],
};

const roleColors: Record<Role, string> = {
  farmer: '#059669', buyer: '#4F46E5', transporter: '#D97706', admin: '#7C3AED',
};

const roleBg: Record<Role, string> = {
  farmer: '#ECFDF5', buyer: '#EEF2FF', transporter: '#FFFBEB', admin: '#F5F3FF',
};

const portalLabelKeys: Record<Role, string> = {
  farmer: 'portal.farmer',
  buyer: 'portal.buyer',
  transporter: 'portal.transporter',
  admin: 'portal.admin',
};

// ─── Language Selector Dropdown ───────────────────────────────────────────────
function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="lang-selector-wrap">
      {/* Trigger */}
      <button
        className="lang-selector-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className="lang-flag">{language.flag}</span>
        <span className="lang-native">{language.native}</span>
        <span className="lang-chevron" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="lang-dropdown">
          <div className="lang-dropdown-header">{t('sidebar.language')}</div>
          <div className="lang-dropdown-list">
            {LANGUAGES.map((lang: Language) => (
              <button
                key={lang.code}
                className={`lang-option ${lang.code === language.code ? 'lang-option-active' : ''}`}
                onClick={() => { setLanguage(lang); setOpen(false); }}
              >
                <span className="lang-option-flag">{lang.flag}</span>
                <div className="lang-option-text">
                  <span className="lang-option-native">{lang.native}</span>
                  <span className="lang-option-en">{lang.name}</span>
                </div>
                {lang.code === language.code && <span className="lang-option-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();

  if (!user) return null;

  const items = navItems[user.role] || [];
  const color = roleColors[user.role];
  const bg = roleBg[user.role];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portalLabel = t(portalLabelKeys[user.role] as any);

  return (
    <aside className="sidebar">
      {/* Role accent strip */}
      <div style={{ height: 4, background: color, flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${color}, ${color}CC)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff',
          }}>🌿</div>
          <span className="font-display" style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Agri<span style={{ color }}>Nova</span>
          </span>
        </Link>
        <div style={{
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          background: bg, border: `1px solid ${color}30`,
          display: 'inline-block',
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color, letterSpacing: '0.4px' }}>{portalLabel.toUpperCase()}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <span>{t(item.labelKey as any)}</span>
          </Link>
        ))}
      </nav>

      {/* Language Selector */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <LanguageSelector />
      </div>

      {/* User info */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
        </div>
        {!user.isVerified && (
          <div className="badge badge-amber" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 11 }}>⏳ {t('sidebar.pendingVerification')}</div>
        )}
        <button onClick={logout} className="btn-secondary" style={{ width: '100%', fontSize: 13, padding: '8px 16px' }}>
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}

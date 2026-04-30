// Streakz screens — Landing, Tasks, Settings, Profile
// All four share theme tokens via getTheme(dark)

const getTheme = (dark) => dark ? {
  bg: '#0E0E10',
  surface: '#17171A',
  surface2: '#202024',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F4F2EE',
  textDim: 'rgba(244,242,238,0.62)',
  textFaint: 'rgba(244,242,238,0.38)',
  accent: 'oklch(0.72 0.16 50)',
  accentText: '#0E0E10',
  freeze: 'oklch(0.78 0.10 220)',
  divider: 'rgba(255,255,255,0.06)',
  heat0: 'rgba(255,255,255,0.04)',
  heat1: 'oklch(0.45 0.10 50 / 0.45)',
  heat2: 'oklch(0.58 0.13 50 / 0.65)',
  heat3: 'oklch(0.68 0.15 50 / 0.85)',
  heat4: 'oklch(0.78 0.16 50)'
} : {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surface2: '#F1ECE3',
  border: 'rgba(20,18,14,0.08)',
  borderStrong: 'rgba(20,18,14,0.14)',
  text: '#1A1714',
  textDim: 'rgba(26,23,20,0.58)',
  textFaint: 'rgba(26,23,20,0.34)',
  accent: 'oklch(0.62 0.16 50)',
  accentText: '#FFFFFF',
  freeze: 'oklch(0.55 0.10 220)',
  divider: 'rgba(20,18,14,0.06)',
  heat0: 'rgba(20,18,14,0.04)',
  heat1: 'oklch(0.85 0.06 50)',
  heat2: 'oklch(0.78 0.10 50)',
  heat3: 'oklch(0.70 0.14 50)',
  heat4: 'oklch(0.62 0.16 50)'
};

// Hue → color (matches the app's hue-based color system)
const hueAccent = (h, dark) => `oklch(${dark ? 0.72 : 0.62} 0.14 ${h})`;
const hueDim = (h, dark) => `oklch(${dark ? 0.30 : 0.92} ${dark ? 0.05 : 0.04} ${h})`;
const hueText = (h, dark) => `oklch(${dark ? 0.85 : 0.40} 0.12 ${h})`;

// ─────────────────────────────────────────────────────────────
// Tiny icon set — stroke-based, hand-tuned, no emoji
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', stroke = 1.6 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':return <svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
    case 'list':return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="12" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="18" r="1.2" fill={color} stroke="none" /></svg>;
    case 'gear':return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
    case 'user':return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case 'plus':return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'check':return <svg {...p}><path d="M5 13l4 4L19 7" /></svg>;
    case 'flame':return <svg {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 1-9z" /></svg>;
    case 'snow':return <svg {...p}><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" /><path d="M9 4l3 2 3-2M9 20l3-2 3 2M2 9l2 3-2 3M22 9l-2 3 2 3" /></svg>;
    case 'bell':return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
    case 'moon':return <svg {...p}><path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" /></svg>;
    case 'chevron':return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>;
    case 'search':return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
    case 'sort':return <svg {...p}><path d="M3 6h13M3 12h9M3 18h5M17 14l4 4 4-4M21 4v14" transform="translate(-4 0)" /></svg>;
    case 'archive':return <svg {...p}><path d="M3 6h18v4H3zM5 10v10h14V10M10 14h4" /></svg>;
    case 'export':return <svg {...p}><path d="M12 3v13M7 8l5-5 5 5M5 21h14" /></svg>;
    case 'import':return <svg {...p}><path d="M12 16V3M7 11l5 5 5-5M5 21h14" /></svg>;
    case 'trash':return <svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>;
    case 'edit':return <svg {...p}><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z" /></svg>;
    case 'star':return <svg {...p}><path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3 9.4l6-.9z" /></svg>;
    case 'target':return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /></svg>;
    case 'calendar':return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    default:return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Bottom tab bar — shared across screens
// ─────────────────────────────────────────────────────────────
function TabBar({ active, dark }) {
  const t = getTheme(dark);
  const tabs = [
  { id: 'landing', label: 'Today', icon: 'home' },
  { id: 'tasks', label: 'Habits', icon: 'list' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
  { id: 'profile', label: 'Profile', icon: 'user' }];

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: 12, paddingTop: 10, paddingLeft: 8, paddingRight: 8,
      background: dark ?
      'linear-gradient(to top, rgba(14,14,16,0.96) 70%, rgba(14,14,16,0))' :
      'linear-gradient(to top, rgba(250,247,242,0.96) 70%, rgba(250,247,242,0))',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderTop: `0.5px solid ${t.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <div key={tab.id} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '6px 0', cursor: 'pointer'
            }}>
              <Icon name={tab.icon} size={24} color={on ? t.accent : t.textDim} stroke={on ? 2 : 1.6} />
              <span style={{
                fontSize: 11, fontWeight: on ? 600 : 500,
                color: on ? t.accent : t.textDim, letterSpacing: 0.1
              }}>{tab.label}</span>
            </div>);

        })}
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Screen shell — handles status bar inset + tab bar inset
// ─────────────────────────────────────────────────────────────
function ScreenShell({ children, dark, active, scroll = false }) {
  const t = getTheme(dark);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: t.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
      color: t.text, letterSpacing: -0.01
    }}>
      <div style={{ height: 8 }} />{/* small top inset (Android frame supplies status bar) */}
      <div style={{
        flex: 1, overflow: scroll ? 'auto' : 'hidden',
        paddingBottom: 86, minHeight: 0,
        display: 'flex', flexDirection: 'column'
      }}>{children}</div>
      <TabBar active={active} dark={dark} />
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Shared bits: streak ring, today checkbox, heatmap
// ─────────────────────────────────────────────────────────────
function StreakRing({ value, target, color, size = 56, dark }) {
  const t = getTheme(dark);
  const r = (size - 6) / 2,c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(target, 1), 1);
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.divider} strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1
      }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{value}</span>
        <span style={{ fontSize: 9, color: t.textFaint, fontWeight: 500, marginTop: 2 }}>/{target}</span>
      </div>
    </div>);

}

function CheckBubble({ done, color, onTap, size = 32, dark }) {
  const t = getTheme(dark);
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      border: done ? `1.5px solid ${color}` : `1.5px solid ${t.borderStrong}`,
      background: done ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s'
    }}>
      {done && <Icon name="check" size={size * 0.55} color={t.accentText} stroke={2.6} />}
    </div>);

}

function HeatMap({ dark, hue = 50, weeks = 14 }) {
  const t = getTheme(dark);
  // Deterministic pseudo-random pattern, biased toward recent activity
  const cells = [];
  let seed = 7;
  const rand = () => {seed = (seed * 9301 + 49297) % 233280;return seed / 233280;};
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const recencyBias = w / weeks;
      const r = rand();
      let level = 0;
      const score = r * 0.6 + recencyBias * 0.55;
      if (score > 0.85) level = 4;else
      if (score > 0.65) level = 3;else
      if (score > 0.45) level = 2;else
      if (score > 0.28) level = 1;
      // skew last few weeks to more activity
      if (w >= weeks - 3 && r > 0.15) level = Math.max(level, 3);
      if (w === weeks - 1 && d > 4) level = 0; // future days
      cells.push(level);
    }
  }
  const lvl = [t.heat0, hueDim(hue, dark), `oklch(${dark ? 0.50 : 0.78} 0.10 ${hue})`,
  `oklch(${dark ? 0.65 : 0.70} 0.13 ${hue})`, hueAccent(hue, dark)];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${weeks}, 1fr)`,
      gap: 3, width: '100%'
    }}>
      {Array.from({ length: weeks }, (_, w) =>
      <div key={w} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: 7 }, (_, d) =>
        <div key={d} style={{
          aspectRatio: '1', borderRadius: 3, background: lvl[cells[w * 7 + d]]
        }} />
        )}
        </div>
      )}
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────
const SAMPLE_TASKS = [
{ id: 1, title: 'Morning run', hue: 22, streak: 47, target: 60, done: true, reminder: '07:00', frozen: false },
{ id: 2, title: 'Read 20 pages', hue: 220, streak: 12, target: 30, done: false, reminder: '21:00', frozen: false },
{ id: 3, title: 'Meditate 10 min', hue: 280, streak: 89, target: 100, done: true, reminder: '06:30', frozen: false },
{ id: 4, title: 'No phone after 10pm', hue: 160, streak: 4, target: 14, done: false, reminder: null, frozen: true },
{ id: 5, title: 'Stretch routine', hue: 50, streak: 23, target: 30, done: false, reminder: '18:00', frozen: false },
{ id: 6, title: 'Journal', hue: 340, streak: 6, target: 21, done: true, reminder: '22:00', frozen: false }];


// ─────────────────────────────────────────────────────────────
// LANDING — "Today"
// ─────────────────────────────────────────────────────────────
function LandingScreen({ dark, name = 'Alex' }) {
  const t = getTheme(dark);
  const today = SAMPLE_TASKS.slice(0, 5);
  const doneCount = today.filter((x) => x.done).length;
  const pendingCount = today.length - doneCount;
  const efficiency = Math.round(doneCount / today.length * 100);
  const totalHabits = SAMPLE_TASKS.length;
  const dateStr = 'THURSDAY, APR 30';

  // Time-of-day greeting
  const hour = 0;
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Late night';
  const tod = greet === 'Late night' ? 'moon' : greet === 'Good morning' ? 'sun' : greet === 'Good afternoon' ? 'sun' : 'moon';

  return (
    <ScreenShell dark={dark} active="landing">
      {/* Header */}
      <div style={{ padding: '14px 22px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textDim, fontWeight: 500, letterSpacing: 0.8 }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, marginTop: 4, lineHeight: 1, letterSpacing: -0.6, whiteSpace: 'nowrap' }}>
            {greet}
          </div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: t.surface,
          border: `0.5px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          {tod === 'moon' ?
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" fill="#FACC15" stroke="#EAB308" strokeWidth="1.2" />
            </svg> :

          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4.5" fill="#FACC15" />
              <g stroke="#FACC15" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
              </g>
            </svg>
          }
        </div>
      </div>

      {/* Streak efficiency hero */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          borderRadius: 22, padding: '20px 22px 22px',
          background: 'linear-gradient(135deg, oklch(0.62 0.20 250), oklch(0.58 0.22 290))',
          color: '#fff', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px oklch(0.55 0.22 270 / 0.25)'
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.4, opacity: 0.95
          }}>STREAK EFFICIENCY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10 }}>
            <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{efficiency}</span>
            <span style={{ fontSize: 22, fontWeight: 700, marginLeft: 4, opacity: 0.92 }}>%</span>
          </div>
          <div style={{
            marginTop: 14, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.28)', overflow: 'hidden'
          }}>
            <div style={{
              width: `${efficiency}%`, height: '100%',
              background: 'rgba(255,255,255,0.95)', borderRadius: 2
            }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, opacity: 0.95 }}>
            {efficiency === 0 ? 'Create your first habit to start tracking' : `${doneCount} of ${today.length} habits done today`}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 10 }}>
        {[
        { v: totalHabits, l: 'Total habits' },
        { v: pendingCount, l: 'Pending today' }].
        map((s, i) =>
        <div key={i} style={{
          flex: 1, background: t.surface, borderRadius: 14, padding: '14px 16px',
          border: `0.5px solid ${t.border}`
        }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.text, lineHeight: 1, letterSpacing: -0.6 }}>{s.v}</div>
            <div style={{ fontSize: 12, color: t.textDim, marginTop: 6, fontWeight: 500 }}>{s.l}</div>
          </div>
        )}
      </div>

      {/* spacer pushes the CTA toward the bottom */}
      <div style={{ flex: 1 }} />

      {/* Go to Tasks pill */}
      <div style={{ padding: '0 16px 4px' }}>
        <div style={{
          background: t.surface, borderRadius: 14,
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `0.5px solid ${t.border}`,
          boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: 15, color: t.textDim, fontWeight: 600 }}>Go to Tasks</span>
          <span style={{ fontSize: 17, color: t.textDim, marginLeft: 8 }}>→</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: t.textFaint, marginTop: 8, fontWeight: 500 }}>
          or swipe left
        </div>
      </div>
    </ScreenShell>);

}

// ─────────────────────────────────────────────────────────────
// TASKS — full habit list with sort + add
// ─────────────────────────────────────────────────────────────
function TasksScreen({ dark }) {
  const t = getTheme(dark);
  const sorted = [...SAMPLE_TASKS].sort((a, b) => b.streak - a.streak);
  const [viewMode, setViewMode] = React.useState('tiles'); // 'tiles' or 'rows'
  const [tab, setTab] = React.useState('active'); // 'active' or 'archived'

  return (
    <ScreenShell dark={dark} active="tasks">
      {/* Header */}
      <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: -0.8 }}>Tasks</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Sort button */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: t.surface,
            border: `0.5px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sort" size={16} color={t.textDim} stroke={1.7}/>
          </div>
          {/* Star button */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: t.surface,
            border: `0.5px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FACC15" stroke="#EAB308" strokeWidth="1.4">
              <path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3 9.4l6-.9z"/>
            </svg>
          </div>
          {/* Add button */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: t.surface,
            border: `0.5px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="plus" size={18} color={t.textDim} stroke={2}/>
          </div>
        </div>
      </div>

      {/* Active / Archived tabs */}
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 20, borderBottom: `1px solid ${t.divider}` }}>
        {[
          { id: 'active', label: 'Active', count: SAMPLE_TASKS.length },
          { id: 'archived', label: 'Archived', count: 0 },
        ].map(t => {
          const on = tab === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: 15, fontWeight: 600, color: on ? t.text : t.textDim,
                paddingBottom: 10, borderBottom: on ? `2px solid ${t.text}` : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 6,
              }}
            >
              {t.label} <span style={{ fontSize: 13, fontWeight: 500, color: t.textFaint }}>{t.count}</span>
            </div>
          );
        })}
      </div>

      {/* View toggle + sort */}
      <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* View toggle */}
        <div style={{
          display: 'inline-flex', gap: 0, background: t.surface, borderRadius: 8,
          border: `0.5px solid ${t.border}`, padding: 2,
        }}>
          {['tiles', 'rows'].map(mode => {
            const on = viewMode === mode;
            return (
              <div
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: on ? t.bg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? t.text : t.textDim} strokeWidth="1.8">
                  {mode === 'tiles' ? (
                    <>
                      <rect x="4" y="4" width="6" height="6" rx="1"/>
                      <rect x="14" y="4" width="6" height="6" rx="1"/>
                      <rect x="4" y="14" width="6" height="6" rx="1"/>
                      <rect x="14" y="14" width="6" height="6" rx="1"/>
                    </>
                  ) : (
                    <>
                      <path d="M8 6h13M8 12h13M8 18h13"/>
                      <circle cx="4" cy="6" r="1" fill={on ? t.text : t.textDim}/>
                      <circle cx="4" cy="12" r="1" fill={on ? t.text : t.textDim}/>
                      <circle cx="4" cy="18" r="1" fill={on ? t.text : t.textDim}/>
                    </>
                  )}
                </svg>
              </div>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, color: t.textDim, fontWeight: 500,
        }}>
          <svg width="4" height="4" viewBox="0 0 4 4" style={{ marginRight: 2 }}>
            <circle cx="2" cy="2" r="2" fill={t.textDim}/>
          </svg>
          Created
        </div>
      </div>

      {/* Tasks grid/list */}
      <div style={{
        padding: '0 14px',
        display: viewMode === 'tiles' ? 'grid' : 'block',
        gridTemplateColumns: viewMode === 'tiles' ? 'repeat(2, 1fr)' : undefined,
        gap: viewMode === 'tiles' ? 10 : 8,
      }}>
        {sorted.map((task) => {
          const accent = hueAccent(task.hue, dark);
          const pct = Math.min(task.streak / task.target, 1);
          
          if (viewMode === 'tiles') {
            // Tile card: colored dot, title, 0/7d, 0%, progress bar
            return (
              <div key={task.id} style={{
                background: t.surface, borderRadius: 14, padding: '14px 12px 12px',
                border: `0.5px solid ${t.border}`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {/* Color dot + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 5, background: accent, flexShrink: 0,
                  }}/>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text, flex: 1, minWidth: 0 }}>
                    {task.title}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, background: t.divider, overflow: 'hidden' }}>
                  <div style={{ width: `${pct * 100}%`, height: '100%', background: accent, borderRadius: 2 }}/>
                </div>
                {/* 0/7d and 0% */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600 }}>
                    {task.streak}/{task.target}d
                  </span>
                  <span style={{ fontSize: 12, color: t.textDim, fontWeight: 600 }}>
                    {Math.round(pct * 100)}%
                  </span>
                </div>
              </div>
            );
          } else {
            // Row: colored stripe, title, 0/7 on right
            return (
              <div key={task.id} style={{
                background: t.surface, borderRadius: 12, padding: '12px 14px',
                border: `0.5px solid ${t.border}`,
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: accent,
                }}/>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginLeft: 8 }}>
                  {task.title}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>
                  {task.streak}/{task.target}
                </div>
              </div>
            );
          }
        })}
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────
function SettingsRow({ icon, label, value, dark, last, danger, toggle, toggleOn }) {
  const t = getTheme(dark);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      borderBottom: last ? 'none' : `0.5px solid ${t.divider}`
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, background: t.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon name={icon} size={15} color={danger ? 'oklch(0.60 0.18 25)' : t.textDim} stroke={1.7} />
      </div>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: danger ? 'oklch(0.60 0.18 25)' : t.text }}>
        {label}
      </div>
      {toggle ?
      <div style={{
        width: 38, height: 22, borderRadius: 11,
        background: toggleOn ? t.accent : t.surface2,
        padding: 2, transition: 'background 0.2s'
      }}>
          <div style={{
          width: 18, height: 18, borderRadius: 9, background: '#fff',
          transform: toggleOn ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
        </div> :

      <>
          {value && <span style={{ fontSize: 12, color: t.textDim }}>{value}</span>}
          <Icon name="chevron" size={14} color={t.textFaint} stroke={1.7} />
        </>
      }
    </div>);

}

function SettingsGroup({ title, children, dark }) {
  const t = getTheme(dark);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: t.textDim, letterSpacing: 0.6,
        textTransform: 'uppercase', padding: '0 20px 5px'
      }}>{title}</div>
      <div style={{
        margin: '0 14px', background: t.surface, borderRadius: 14,
        border: `0.5px solid ${t.border}`, overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>);

}

function SettingsScreen({ dark, setDark }) {
  const t = getTheme(dark);
  return (
    <ScreenShell dark={dark} active="settings">
      <div style={{ padding: '6px 20px 14px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: t.text, letterSpacing: -0.6 }}>Settings</div>
      </div>

      <SettingsGroup title="Appearance" dark={dark}>
        <SettingsRow icon="moon" label="Dark mode" toggle toggleOn={dark} dark={dark} />
        <SettingsRow icon="star" label="Accent color" value="Amber" dark={dark} last />
      </SettingsGroup>

      <SettingsGroup title="Reminders" dark={dark}>
        <SettingsRow icon="bell" label="Daily reminders" toggle toggleOn={true} dark={dark} />
        <SettingsRow icon="snow" label="Freeze warnings" toggle toggleOn={true} dark={dark} />
        <SettingsRow icon="calendar" label="Quiet hours" value="22:00 – 7:00" dark={dark} last />
      </SettingsGroup>

      <SettingsGroup title="Habits" dark={dark}>
        <SettingsRow icon="sort" label="Default sort" value="Streak" dark={dark} />
        <SettingsRow icon="archive" label="Archived habits" value="3" dark={dark} last />
      </SettingsGroup>

      <SettingsGroup title="Data" dark={dark}>
        <SettingsRow icon="export" label="Export data" dark={dark} />
        <SettingsRow icon="import" label="Import data" dark={dark} />
        <SettingsRow icon="trash" label="Clear all data" dark={dark} danger last />
      </SettingsGroup>

      <div style={{ textAlign: 'center', padding: '4px 0 12px', fontSize: 10, color: t.textFaint }}>
        Streakz · v1.4.2
      </div>
    </ScreenShell>);

}

// ─────────────────────────────────────────────────────────────
// PROFILE — stats, milestones, heatmap
// ─────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, dark, accent }) {
  const t = getTheme(dark);
  return (
    <div style={{
      flex: 1, background: t.surface, borderRadius: 14, padding: '12px 12px',
      border: `0.5px solid ${t.border}`
    }}>
      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || t.text, marginTop: 4, letterSpacing: -0.6, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>);

}

function ProfileScreen({ dark, name = 'Alex' }) {
  const t = getTheme(dark);
  const totalDone = 482;
  const longest = 89;
  const active = 6;
  const milestones = [
  { task: 'Meditate 10 min', target: 100, current: 89, hue: 280 },
  { task: 'Morning run', target: 60, current: 47, hue: 22 },
  { task: 'Stretch routine', target: 30, current: 23, hue: 50 }];


  return (
    <ScreenShell dark={dark} active="profile">
      {/* Avatar + name */}
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 26,
          background: `linear-gradient(135deg, ${hueAccent(50, dark)}, ${hueAccent(22, dark)})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5
        }}>
          {name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.text, letterSpacing: -0.4 }}>{name}</div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 1 }}>Member since Feb 2026</div>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 16, background: t.surface,
          border: `0.5px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon name="edit" size={14} color={t.textDim} stroke={1.8} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 6 }}>
        <StatTile label="Active" value={active} sub="of 20" dark={dark} />
        <StatTile label="Longest" value={longest} sub="day streak" dark={dark} accent={t.accent} />
        <StatTile label="Total" value={totalDone} sub="done" dark={dark} />
      </div>

      {/* Heatmap */}
      <div style={{ padding: '0 20px 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textDim, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Activity
        </div>
        <div style={{ fontSize: 11, color: t.textFaint }}>Last 14 weeks</div>
      </div>
      <div style={{ padding: '0 14px 14px' }}>
        <div style={{
          background: t.surface, borderRadius: 14, padding: '12px 12px',
          border: `0.5px solid ${t.border}`
        }}>
          <HeatMap dark={dark} hue={50} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: t.textFaint }}>Less</span>
            {[0, 1, 2, 3, 4].map((i) =>
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 2,
              background: [t.heat0, hueDim(50, dark),
              `oklch(${dark ? 0.50 : 0.78} 0.10 50)`,
              `oklch(${dark ? 0.65 : 0.70} 0.13 50)`,
              hueAccent(50, dark)][i]
            }} />
            )}
            <span style={{ fontSize: 10, color: t.textFaint }}>More</span>
          </div>
        </div>
      </div>

      {/* Upcoming milestones */}
      <div style={{ padding: '0 20px 5px', fontSize: 11, fontWeight: 600, color: t.textDim, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Upcoming milestones
      </div>
      <div style={{ padding: '0 14px' }}>
        {milestones.slice(0, 2).map((m, i) => {
          const pct = m.current / m.target;
          const accent = hueAccent(m.hue, dark);
          return (
            <div key={i} style={{
              background: t.surface, borderRadius: 12, marginBottom: 6, padding: '10px 12px',
              border: `0.5px solid ${t.border}`,
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: hueDim(m.hue, dark),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Icon name="target" size={16} color={accent} stroke={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{m.task}</div>
                <div style={{ fontSize: 11, color: t.textDim, marginTop: 1 }}>
                  {m.current} / {m.target} · {m.target - m.current} to go
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{Math.round(pct * 100)}%</div>
            </div>);

        })}
      </div>
    </ScreenShell>);

}

Object.assign(window, {
  LandingScreen, TasksScreen, SettingsScreen, ProfileScreen,
  getTheme, Icon, TabBar
});
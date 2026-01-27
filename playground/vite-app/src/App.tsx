import { Link, NavLink, Navigate, Route, Routes } from 'react-router';
import ContainedTriggers from './experiments/perf/contained-triggers';
import DetachedTriggers from './experiments/perf/detached-triggers';
import RadixTriggers from './experiments/perf/radix-triggers';

type NavItem = { type: 'header'; label: string } | { type: 'link'; to: string; label: string };

const navItems: NavItem[] = [
  { type: 'header', label: 'Performance benchmarks' },
  { type: 'link', to: '/perf/contained-triggers', label: 'Contained triggers' },
  { type: 'link', to: '/perf/detached-triggers', label: 'Detached triggers' },
  { type: 'link', to: '/perf/radix-triggers', label: 'Radix triggers' },
];

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="text-lg font-semibold" to="/">
            Base UI playground
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/perf" element={<Navigate replace to="/perf/contained-triggers" />} />
          <Route path="/perf/contained-triggers" element={<ContainedTriggers />} />
          <Route path="/perf/detached-triggers" element={<DetachedTriggers />} />
          <Route path="/perf/radix-triggers" element={<RadixTriggers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-3">
      <ul className="space-y-2 text-sm">
        {navItems.map((item) =>
          item.type === 'header' ? (
            <li
              key={item.label}
              className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {item.label}
            </li>
          ) : (
            <li key={item.to}>
              <Link className="text-gray-800 hover:underline" to={item.to}>
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-gray-700">
        That page doesn&apos;t exist. Pick a benchmark from the navigation.
      </p>
    </div>
  );
}

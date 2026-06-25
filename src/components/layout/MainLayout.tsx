import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ListChecks, PlusCircle, Search, X, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { loadSubmissions } from '../../lib/pipeline';
import { CopyrightFooter } from './CopyrightFooter';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user?.email) {
      navigate('/login', { replace: true });
    }
  }, [loading, navigate, user?.email]);

  useEffect(() => {
    let cancelled = false;

    async function hydratePendingCount() {
      const submissions = await loadSubmissions();
      if (!cancelled) {
        setPendingCount(submissions.filter((submission) => submission.status !== 'Published').length);
      }
    }

    void hydratePendingCount();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/catalog', label: 'Catalog', icon: LayoutGrid },
    { id: '/pipeline', label: 'Pipeline', icon: ListChecks },
    { id: '/submit', label: 'Submit', icon: PlusCircle },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFBFC] font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 md:px-8 lg:px-10 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div 
            className="flex cursor-pointer items-center gap-3" 
            onClick={() => navigate('/')}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-purple-500 text-[10px] font-bold text-white shadow-sm">
              Ai
            </div>
            <span className="text-base font-bold tracking-tight text-slate-800">AIMPLIFY</span>
          </div>

          <div className="hidden h-6 w-px bg-gray-200 md:block" />

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id));
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-sky-50 text-sky-600 shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.id === '/pipeline' && pendingCount > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden items-center md:flex">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val) {
                  navigate(`/catalog?q=${encodeURIComponent(val)}`);
                } else if (location.pathname === '/catalog') {
                  navigate(`/catalog`);
                }
              }}
              placeholder="Search assets..."
              className="h-9 w-64 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-8 text-sm outline-none transition-all focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            {searchQuery && (
              <X 
                className="absolute right-3 h-3.5 w-3.5 cursor-pointer text-gray-400 hover:text-gray-600" 
                onClick={() => {
                  setSearchQuery('');
                  if (location.pathname === '/catalog') navigate('/catalog');
                }}
              />
            )}
          </div>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-md hover:bg-gray-100 p-1.5 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/80 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                {user.initials}
              </div>
              <span className="text-sm font-semibold text-slate-800">{user.name}</span>
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", isProfileOpen && "rotate-180")} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-100 bg-white p-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-gray-100" />
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </button>
                <div className="my-1 h-px bg-gray-100" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    void signOut().then(() => navigate('/login'));
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        className={
          location.pathname.endsWith('/demo')
            ? 'w-full flex-1'
            : 'mx-auto w-full max-w-7xl flex-1'
        }
      >
        <Outlet />
      </main>

      <CopyrightFooter />
    </div>
  );
}

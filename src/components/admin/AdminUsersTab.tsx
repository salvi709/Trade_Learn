import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trophy, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Calendar,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AdminUserRecord, isOwnerAdmin } from '../../services/adminService';
import { getAvatarById } from '../../config/avatars';

interface AdminUsersTabProps {
  users: AdminUserRecord[];
  loading?: boolean;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'streak' | 'recent' | 'pnl'>('progress');
  const [maskPii, setMaskPii] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || u.experienceLevel === levelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return b.overallProgress - a.overallProgress;
        if (sortBy === 'streak') return b.streakDays - a.streakDays;
        if (sortBy === 'pnl') return b.realizedPnL - a.realizedPnL;
        return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
      });
  }, [users, searchQuery, levelFilter, sortBy]);

  const maskString = (str: string, keep: number = 3) => {
    if (!maskPii || str.length <= keep) return str;
    return str.substring(0, keep) + '••••@••••';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="theme-card border theme-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 theme-muted-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learners by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg theme-surface-subtle border theme-border theme-main-text placeholder:theme-muted-text focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filter learners by experience level"
            className="py-2 px-3 rounded-lg theme-surface-subtle border theme-border theme-main-text focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Experience Levels</option>
            <option value="beginner">Beginner</option>
            <option value="basics">Basics Familiar</option>
            <option value="charts">Charts Explorer</option>
            <option value="paper_trader">Paper Trader</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort learners by attribute"
            className="py-2 px-3 rounded-lg theme-surface-subtle border theme-border theme-main-text focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="progress">Sort by Progress</option>
            <option value="streak">Sort by Streak Days</option>
            <option value="recent">Sort by Last Active</option>
            <option value="pnl">Sort by Paper PnL</option>
          </select>

          {/* Mask PII Toggle */}
          <button
            type="button"
            onClick={() => setMaskPii(!maskPii)}
            className={`py-2 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              maskPii
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                : 'theme-surface-subtle border-theme-border theme-muted-text hover:theme-main-text'
            }`}
          >
            {maskPii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {maskPii ? 'PII Masked' : 'Mask PII'}
          </button>
        </div>
      </div>

      {/* Users Count summary */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="theme-muted-text">
          Showing <strong className="theme-main-text font-bold">{filteredUsers.length}</strong> registered learners
        </span>
        <span className="text-emerald-500 font-semibold">Real-time Firestore user profiles</span>
      </div>

      {/* Users Table / Grid */}
      <div className="theme-card border theme-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Learner Profile</th>
                <th className="py-3 px-4">Curriculum Progress</th>
                <th className="py-3 px-4">Streak & Activity</th>
                <th className="py-3 px-4">Paper Trading</th>
                <th className="py-3 px-4">Quiz Avg</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center theme-muted-text">
                    No learners found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const avatar = getAvatarById(u.avatarId);
                  return (
                    <tr
                      key={u.uid}
                      onClick={() => setSelectedUser(u)}
                      className="hover:theme-surface-subtle cursor-pointer transition-colors group"
                    >
                      {/* Learner Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full theme-surface-elevated border theme-border flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            {avatar.svgIcon}
                          </div>
                          <div>
                            <div className="font-semibold theme-main-text flex items-center gap-1.5">
                              {u.displayName}
                              {isOwnerAdmin(u.email) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] theme-muted-text font-mono">
                              @{u.username} • {maskString(u.email)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-emerald-500">{u.overallProgress}% Complete</span>
                            <span className="theme-muted-text">{u.completedLessonsCount} lessons</span>
                          </div>
                          <div className="w-28 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${u.overallProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Streak */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-semibold theme-main-text">{u.streakDays}d streak</span>
                        </div>
                        <span className="text-[10px] theme-muted-text">
                          Active {new Date(u.lastLoginAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* Paper Trading */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-medium theme-main-text">
                          ₹{u.virtualCash.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[10px] font-semibold ${u.realizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {u.realizedPnL >= 0 ? `+₹${u.realizedPnL}` : `-₹${Math.abs(u.realizedPnL)}`} PnL
                        </div>
                      </td>

                      {/* Quiz Average */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                          {u.quizAverage}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg theme-surface-subtle hover:theme-surface-elevated theme-secondary-text group-hover:text-emerald-500 border theme-border transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="theme-card border theme-border rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b theme-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full theme-surface-subtle border theme-border flex items-center justify-center text-2xl shadow-xs">
                  {getAvatarById(selectedUser.avatarId).svgIcon}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg theme-main-text">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-xs font-mono theme-muted-text">
                    @{selectedUser.username} • {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg theme-surface-subtle hover:theme-surface-elevated theme-secondary-text border theme-border transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
                <span className="theme-muted-text">Curriculum Progress</span>
                <div className="text-lg font-bold text-emerald-500">{selectedUser.overallProgress}%</div>
                <span className="text-[10px] theme-muted-text">{selectedUser.completedLessonsCount} lessons finished</span>
              </div>
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
                <span className="theme-muted-text">Learning Streak</span>
                <div className="text-lg font-bold text-amber-500">{selectedUser.streakDays} Days</div>
                <span className="text-[10px] theme-muted-text">Daily habit active</span>
              </div>
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
                <span className="theme-muted-text">Paper Portfolio</span>
                <div className="text-lg font-bold theme-main-text">₹{selectedUser.virtualCash.toLocaleString('en-IN')}</div>
                <span className={`text-[10px] font-semibold ${selectedUser.realizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  PnL: {selectedUser.realizedPnL >= 0 ? `+₹${selectedUser.realizedPnL}` : `-₹${Math.abs(selectedUser.realizedPnL)}`}
                </span>
              </div>
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
                <span className="theme-muted-text">Quiz Performance</span>
                <div className="text-lg font-bold text-emerald-500">{selectedUser.quizAverage}% Avg</div>
                <span className="text-[10px] theme-muted-text">{selectedUser.journalEntriesCount} Journal Entries</span>
              </div>
            </div>

            {/* Profile Attributes */}
            <div className="p-3.5 rounded-xl theme-surface-subtle border theme-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="theme-muted-text">Experience Level:</span>
                <span className="theme-main-text font-medium capitalize">{selectedUser.experienceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted-text">Learning Goal:</span>
                <span className="theme-main-text font-medium capitalize">{selectedUser.learningGoal.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted-text">Selected Theme:</span>
                <span className="theme-main-text font-medium capitalize">{selectedUser.theme.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted-text">Account Created:</span>
                <span className="theme-main-text font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-muted-text">Firestore UID:</span>
                <span className="font-mono text-[10px] theme-muted-text">{selectedUser.uid}</span>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 rounded-xl theme-primary-btn font-semibold text-xs cursor-pointer shadow-md"
            >
              Done Inspecting Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

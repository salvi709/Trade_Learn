import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  AtSign, 
  Calendar, 
  Coins, 
  Palette, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, ProfileCurrency, AppTheme } from '../../types';
import { AVATAR_OPTIONS, getAvatarById, AvatarOption } from '../../config/avatars';
import { validateUsername } from '../../utils/username';
import { checkUsernameAvailability, saveUserProfileWithUsername } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentUser?: any;
  onProfileUpdated: (updated: UserProfile) => void;
}

const CURRENCY_OPTIONS: { code: ProfileCurrency; symbol: string; label: string; flag: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)', flag: '🇯🇵' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  onProfileUpdated,
}) => {
  const { theme: activeTheme, setTheme } = useTheme();

  // Form states
  const [displayName, setDisplayName] = useState<string>(profile.displayName || '');
  const [username, setUsername] = useState<string>(profile.username || '');
  const [birthday, setBirthday] = useState<string>(profile.birthday || '');
  const [avatarId, setAvatarId] = useState<string>(profile.avatarId || 'avatar_investor');
  const [currency, setCurrency] = useState<ProfileCurrency>(profile.currency || 'INR');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(profile.theme || activeTheme || 'royal_blue');

  // Validation & UI states
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBirthday(profile.birthday || '');
      setAvatarId(profile.avatarId || 'avatar_investor');
      setCurrency(profile.currency || 'INR');
      setSelectedTheme(profile.theme || activeTheme || 'royal_blue');
      setUsernameError(null);
      setGeneralError(null);
      setSavedSuccess(false);
    }
  }, [isOpen, profile, activeTheme]);

  if (!isOpen) return null;

  const currentAvatar = getAvatarById(avatarId);

  // Realtime username validation preview
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (!val.trim()) {
      setUsernameError(null);
      return;
    }
    const valResult = validateUsername(val);
    if (!valResult.isValid) {
      setUsernameError(valResult.error || 'Invalid username');
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setUsernameError(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setGeneralError('Please enter a display name.');
      return;
    }

    // Validate username if provided or required
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameError('Username is required for your learner profile.');
      return;
    }

    const validation = validateUsername(trimmedUsername);
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Please enter a valid username.');
      return;
    }

    setSaving(true);

    try {
      // 1. Check uniqueness in Firestore if changed
      const normalizedNew = validation.normalized;
      const normalizedOld = profile.username ? profile.username.trim().toLowerCase() : '';

      if (normalizedNew !== normalizedOld) {
        const availability = await checkUsernameAvailability(normalizedNew, profile.uid);
        if (!availability.available) {
          setUsernameError(availability.reason || 'This username is already taken. Please pick another.');
          setSaving(false);
          return;
        }
      }

      // 2. Prepare updated profile payload
      const updatedProfile: UserProfile = {
        ...profile,
        displayName: trimmedName,
        username: trimmedUsername,
        birthday: birthday || undefined,
        avatarId,
        currency,
        theme: selectedTheme,
      };

      // 3. Persist to Firestore atomically
      const uid = profile.uid || (currentUser ? currentUser.uid : 'local_learner');
      const saveResult = await saveUserProfileWithUsername(uid, updatedProfile, profile.username);

      if (!saveResult.success) {
        if (saveResult.error?.includes('already taken')) {
          setUsernameError(saveResult.error);
        } else {
          setGeneralError(saveResult.error || 'Failed to update profile. Please try again.');
        }
        setSaving(false);
        return;
      }

      // 4. Update application theme if changed
      if (selectedTheme !== activeTheme) {
        setTheme(selectedTheme);
      }

      // 5. Notify parent and show success
      onProfileUpdated(updatedProfile);
      setSavedSuccess(true);

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error during profile save:', err);
      setGeneralError(err.message || 'An unexpected error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      id="modal-edit-profile-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div 
        id="modal-edit-profile-card"
        className="w-full max-w-2xl theme-card rounded-3xl border theme-border shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b theme-border theme-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl theme-soft-accent-bg border theme-border flex items-center justify-center text-xl shadow-2xs">
              {currentAvatar.svgIcon}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading theme-main-text leading-tight">
                Edit Profile
              </h2>
              <p className="text-xs theme-secondary-text">
                Update your public learner identity, avatar persona, and preferences.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-edit-profile"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl theme-muted-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* General error message */}
          {generalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Success banner */}
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Profile successfully saved to your account and synced!</span>
            </div>
          )}

          {/* SECTION 1: Identity (Name & Username) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-muted-text border-b theme-border pb-2">
              <User className="w-3.5 h-3.5 theme-primary-text" />
              <span>Learner Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full / Display Name */}
              <div>
                <label className="text-xs font-bold theme-main-text block mb-1.5" htmlFor="edit-profile-name">
                  Full Name / Display Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 theme-muted-text absolute left-3 top-3" />
                  <input
                    type="text"
                    id="edit-profile-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarthak Salvi"
                    required
                    className="w-full pl-9 pr-3 py-2 theme-surface-subtle border theme-border rounded-xl text-xs theme-main-text focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label className="text-xs font-bold theme-main-text block mb-1.5" htmlFor="edit-profile-username">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 theme-muted-text absolute left-3 top-3" />
                  <input
                    type="text"
                    id="edit-profile-username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="e.g. sarthak_trader"
                    required
                    maxLength={20}
                    className={`w-full pl-9 pr-3 py-2 theme-surface-subtle border rounded-xl text-xs theme-main-text focus:outline-none transition-colors font-mono ${
                      usernameError ? 'border-rose-400 focus:border-rose-500' : 'theme-border focus:border-emerald-500'
                    }`}
                  />
                </div>
                {usernameError ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{usernameError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] theme-muted-text mt-1">
                    3-20 characters: letters, numbers, underscores (_), and periods (.).
                  </p>
                )}
              </div>
            </div>

            {/* Birthday & Currency Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Birthday */}
              <div>
                <label className="text-xs font-bold theme-main-text block mb-1.5" htmlFor="edit-profile-birthday">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 theme-muted-text absolute left-3 top-3" />
                  <input
                    type="date"
                    id="edit-profile-birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 theme-surface-subtle border theme-border rounded-xl text-xs theme-main-text focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="text-xs font-bold theme-main-text block mb-1.5" htmlFor="edit-profile-currency">
                  Preferred Currency
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 theme-muted-text absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="edit-profile-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as ProfileCurrency)}
                    className="w-full pl-9 pr-3 py-2 theme-surface-subtle border theme-border rounded-xl text-xs theme-main-text focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.label} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Avatar Persona Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b theme-border pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-muted-text">
                <Sparkles className="w-3.5 h-3.5 theme-primary-text" />
                <span>Financial Persona Avatar</span>
              </div>
              <span className="text-xs font-bold theme-primary-text flex items-center gap-1.5">
                <span>{currentAvatar.svgIcon}</span>
                <span>{currentAvatar.name}</span>
              </span>
            </div>

            <p className="text-xs theme-secondary-text">
              Select your persona badge from the existing financial avatar system:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {AVATAR_OPTIONS.map((av: AvatarOption) => {
                const isSelected = avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarId(av.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 theme-soft-accent-bg ring-2 ring-emerald-500/20 shadow-xs'
                        : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                    }`}
                  >
                    <div className="text-2xl mb-1">{av.svgIcon}</div>
                    <div className="font-bold text-[11px] theme-main-text leading-tight truncate w-full">
                      {av.name}
                    </div>
                    <div className="text-[9px] theme-muted-text truncate w-full mt-0.5">
                      {av.role}
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-mono font-bold theme-primary-text theme-soft-accent-bg px-1.5 py-0.2 rounded-full mt-1.5">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Visual Theme Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-muted-text border-b theme-border pb-2">
              <Palette className="w-3.5 h-3.5 theme-primary-text" />
              <span>Theme Preference</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Donezo Light */}
              <div
                id="edit-profile-theme-royal"
                onClick={() => setSelectedTheme('royal_blue')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'royal_blue'
                    ? 'border-[#0D6847] shadow-xs ring-2 ring-[#0D6847]/20 theme-card'
                    : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs theme-main-text">Donezo Light</span>
                  {selectedTheme === 'royal_blue' && (
                    <span className="text-[10px] font-bold bg-[#0D6847] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] theme-secondary-text leading-tight mb-2">
                  Donezo-inspired clean canvas with forest green primary CTA and mint highlights.
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md border border-slate-300" style={{ backgroundColor: '#F4F5F7' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#0D6847' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#22C55E' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#E6F4ED' }} />
                </div>
              </div>

              {/* Modern Dark */}
              <div
                id="edit-profile-theme-emerald"
                onClick={() => setSelectedTheme('premium_emerald')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'premium_emerald'
                    ? 'border-[#10B981] shadow-xs ring-2 ring-[#10B981]/20 theme-card'
                    : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs theme-main-text">Modern Dark</span>
                  {selectedTheme === 'premium_emerald' && (
                    <span className="text-[10px] font-bold bg-[#10B981] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] theme-secondary-text leading-tight mb-2">
                  Sleek true black base with unified brand emerald primary CTA and elevated dark cards.
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md border border-slate-700" style={{ backgroundColor: '#000000' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#0D1117' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#10B981' }} />
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: '#1F242C' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Account Info Note */}
          <div className="p-3 theme-surface-subtle rounded-2xl border theme-border flex items-center justify-between text-xs theme-secondary-text">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {currentUser 
                  ? `Authenticated as ${currentUser.email || profile.email}` 
                  : 'Operating in guest mode. Changes will also sync once you sign in.'}
              </span>
            </div>
            <span className="text-[10px] font-mono theme-muted-text shrink-0">
              UID: {profile.uid.slice(0, 8)}...
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t theme-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 theme-surface-subtle hover:theme-surface-elevated theme-main-text text-xs font-semibold rounded-xl border theme-border transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-save-profile-modal"
              disabled={saving || savedSuccess}
              className="px-6 py-2.5 theme-btn-primary text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

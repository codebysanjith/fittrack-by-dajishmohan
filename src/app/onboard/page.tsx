'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'general_health';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
type DietType = 'non_veg' | 'veg' | 'eggetarian' | 'vegan';

function OnboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Token validation state
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'used' | 'expired' | 'invalid' | 'missing'>('checking');
  const [tokenError, setTokenError] = useState('');
  const [customRate, setCustomRate] = useState<number>(2500);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('fat_loss');
  const [goalDetails, setGoalDetails] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [dietType, setDietType] = useState<DietType>('non_veg');
  const [mealsPerDay, setMealsPerDay] = useState('3');
  const [allergiesDislikes, setAllergiesDislikes] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'instagram'>('whatsapp');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus('missing');
      return;
    }

    fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenStatus('valid');
          if (data.client_name) setName(data.client_name);
          if (data.custom_rate) setCustomRate(data.custom_rate);
        } else {
          if (data.reason === 'already_used') setTokenStatus('used');
          else if (data.reason === 'expired') setTokenStatus('expired');
          else setTokenStatus('invalid');
          setTokenError(data.message || 'Invitation link is no longer active.');
        }
      })
      .catch(() => {
        setTokenStatus('invalid');
        setTokenError('Unable to verify invitation link. Please check your connection.');
      });
  }, [token]);

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) return null;
    const val = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));
    let category = 'Normal';
    let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

    if (val < 18.5) {
      category = 'Underweight';
      colorClass = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    } else if (val >= 25 && val < 30) {
      category = 'Overweight';
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (val >= 30) {
      category = 'Obese';
      colorClass = 'text-red-400 bg-red-500/10 border-red-500/30';
    }

    return { val, category, colorClass };
  }, [weight, height]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your WhatsApp contact number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || '',
          name: name.trim(),
          phone: phone.trim(),
          instagram_handle: instagram.trim(),
          email: email.trim(),
          age: age ? parseInt(age) : null,
          gender,
          weight_kg: weight ? parseFloat(weight) : null,
          height_cm: height ? parseFloat(height) : null,
          target_weight_kg: targetWeight ? parseFloat(targetWeight) : null,
          fitness_goal: fitnessGoal,
          goal_details: goalDetails.trim(),
          activity_level: activityLevel,
          diet_type: dietType,
          meals_per_day: mealsPerDay,
          allergies_dislikes: allergiesDislikes.trim(),
          medical_conditions: medicalConditions.trim(),
          additional_notes: additionalNotes.trim(),
          source: preferredContact === 'instagram' ? 'instagram_dm' : 'whatsapp',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const thankYouWhatsAppUrl = `https://wa.me/919895568068?text=${encodeURIComponent(
    `Hi Coach Dajish! I just submitted my diet & fitness assessment form on FitTrack (${name}). Looking forward to starting my personalized diet plan!`
  )}`;
  const instagramDmUrl = 'https://ig.me/m/dajishmohan';

  // 1. Loading/Checking Screen
  if (tokenStatus === 'checking') {
    return (
      <div className="min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  // 2. Used, Expired, Invalid, or Missing Token Screen
  if (tokenStatus === 'used' || tokenStatus === 'expired' || tokenStatus === 'invalid' || tokenStatus === 'missing') {
    const isUsed = tokenStatus === 'used';
    const isMissing = tokenStatus === 'missing';

    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto ring-8 ${
            isUsed ? 'bg-amber-500/20 text-amber-400 ring-amber-500/10' : 'bg-red-500/20 text-red-400 ring-red-500/10'
          }`}>
            {isUsed ? '🔒' : isMissing ? '📋' : '⚠️'}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {isUsed
                ? 'Invitation Already Used'
                : isMissing
                ? 'Personalized Invite Required'
                : 'Invitation Link Expired'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {isUsed
                ? 'This personalized intake link has already been submitted and is now closed to prevent duplicate submissions and protect your data.'
                : isMissing
                ? 'Client intake is strictly invitation-only to ensure 1-on-1 personalized attention. Please contact Coach Dajish Mohan to receive your personal one-time link.'
                : tokenError || 'This invitation link is no longer valid or has passed its expiration date.'}
            </p>
          </div>

          <div className="p-3.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border)] text-left text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-200">Need a fresh invite link?</div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Message Coach Dajish Mohan directly and he will send you a brand new one-time link in seconds.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <a
              href="https://wa.me/919895568068?text=Hi%20Coach%20Dajish!%20Could%20you%20please%20send%20me%20a%20new%20diet%20intake%20invitation%20link%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full justify-center text-sm py-3 bg-emerald-600 hover:bg-emerald-500 font-bold"
            >
              💬 Request Link on WhatsApp (+91 98955 68068)
            </a>

            <a
              href={instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full justify-center text-xs py-2.5 border-pink-500/30 text-pink-400 hover:bg-pink-500/10 font-semibold"
            >
              📸 Message on Instagram (@dajishmohan)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Submitted Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 md:p-8 text-center space-y-6 shadow-2xl animate-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl mx-auto ring-8 ring-emerald-500/10">
            ✓
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
              Assessment Submitted!
            </h2>
            <p className="text-emerald-400 font-medium">
              Thank you, {name}! 🎉
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Coach <strong className="text-slate-200">Dajish Mohan</strong> has received your fitness metrics and dietary preferences. He is now calculating your macros and crafting your personalized diet plan.
            </p>
          </div>

          <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border)] text-left text-xs text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>Primary Goal:</span>
              <span className="font-semibold text-slate-200 uppercase">{fitnessGoal.replace('_', ' ')}</span>
            </div>
            {bmiInfo && (
              <div className="flex justify-between">
                <span>Calculated BMI:</span>
                <span className="font-semibold text-emerald-400">{bmiInfo.val} ({bmiInfo.category})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Standard Plan Fee:</span>
              <span className="font-semibold text-slate-200">₹{customRate}</span>
            </div>
            <div className="flex justify-between">
              <span>Invitation Status:</span>
              <span className="text-emerald-400 font-semibold">✓ Completed &amp; Closed</span>
            </div>
            <div className="flex justify-between">
              <span>Next Step:</span>
              <span className="text-slate-300">Coach review &amp; WhatsApp contact</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <a
              href={thankYouWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full justify-center text-base py-3.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 font-bold"
            >
              💬 Ping Coach Dajish on WhatsApp
            </a>

            <a
              href={instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full justify-center text-sm py-3 border-pink-500/30 text-pink-400 hover:bg-pink-500/10 font-semibold"
            >
              📸 Message on Instagram (@dajishmohan)
            </a>

            <p className="text-[11px] text-slate-500 pt-1">
              Coach Dajish Mohan will reach out to you within a few hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Valid Invitation Form Screen
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <span>⚡ FitTrack</span>
            <span className="text-slate-500">•</span>
            <span>By Dajish Mohan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Personalized Diet &amp; Fitness Intake
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Fill in your details below so Coach <span className="text-slate-200 font-semibold">Dajish Mohan</span> can formulate your 100% custom diet plan tailored to your lifestyle and metabolism.
          </p>

          {/* Invitation Security Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium">
            <span>🔒 Single-Use VIP Invitation Verified</span>
          </div>

          {/* Direct Coach Contact Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
            <a
              href="https://wa.me/919895568068"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors"
            >
              <span>💬 WhatsApp:</span>
              <span className="font-bold">+91 98955 68068</span>
            </a>
            <a
              href="https://www.instagram.com/dajishmohan/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-400 hover:bg-pink-500/20 font-medium transition-colors"
            >
              <span>📸 Instagram:</span>
              <span className="font-bold">@dajishmohan</span>
            </a>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* The Intake Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Contact Details */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h2 className="text-base font-semibold text-slate-200">
                Your Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp Number <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Coach Dajish will send your plan here
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Instagram Handle <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@your_username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="90"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input w-full"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Body Stats & Live BMI */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h2 className="text-base font-semibold text-slate-200">
                  Body Measurements &amp; Health Stats
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Weight (kg) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 74.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Height (cm) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="input w-full"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">5&apos;8&quot; ≈ 173cm | 5&apos;10&quot; ≈ 178cm</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68.0"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Live BMI Preview Card */}
            {bmiInfo && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${bmiInfo.colorClass} transition-all animate-in`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <div className="text-xs font-semibold">
                      Calculated BMI: {bmiInfo.val} ({bmiInfo.category})
                    </div>
                    <div className="text-[11px] opacity-80">
                      Coach Dajish Mohan will calibrate your caloric deficit or surplus accordingly.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Primary Fitness Goal */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h2 className="text-base font-semibold text-slate-200">
                Your Primary Fitness Goal
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'fat_loss', icon: '🔻', title: 'Fat Loss', desc: 'Drop body fat & lean down' },
                { id: 'muscle_gain', icon: '💪', title: 'Muscle Gain', desc: 'Build size & strength' },
                { id: 'recomposition', icon: '⚡', title: 'Recomp', desc: 'Tone up & build muscle' },
                { id: 'general_health', icon: '🥗', title: 'Health', desc: 'Energy, fitness & stamina' },
              ].map((goal) => (
                <button
                  type="button"
                  key={goal.id}
                  onClick={() => setFitnessGoal(goal.id as FitnessGoal)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    fitnessGoal === goal.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/20'
                      : 'border-[var(--border)] bg-[var(--bg-tertiary)] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1.5">{goal.icon}</div>
                  <div>
                    <div className="text-xs font-bold">{goal.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{goal.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Specific goal or deadline in mind?
              </label>
              <input
                type="text"
                placeholder="e.g. Lose 5kg in 60 days, wedding coming up, fit into old clothes..."
                value={goalDetails}
                onChange={(e) => setGoalDetails(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          {/* Section 4: Diet & Lifestyle */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h2 className="text-base font-semibold text-slate-200">
                Dietary Preferences &amp; Routine
              </h2>
            </div>

            {/* Diet type pills */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Diet Type Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'non_veg', icon: '🍗', label: 'Non-Veg' },
                  { id: 'veg', icon: '🥦', label: 'Vegetarian' },
                  { id: 'eggetarian', icon: '🥚', label: 'Eggetarian' },
                  { id: 'vegan', icon: '🌱', label: 'Vegan' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setDietType(item.id as DietType)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                      dietType === item.id
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold'
                        : 'border-[var(--border)] bg-[var(--bg-tertiary)] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Daily Activity &amp; Workout Routine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'sedentary', label: 'Desk Job / Sedentary', desc: 'Little to no daily exercise' },
                  { id: 'light', label: 'Lightly Active', desc: 'Walking / workout 1-2 times/week' },
                  { id: 'moderate', label: 'Moderately Active', desc: 'Gym / training 3-4 times/week' },
                  { id: 'very_active', label: 'Very Active / Athlete', desc: 'Heavy training 5-6+ times/week' },
                ].map((act) => (
                  <button
                    type="button"
                    key={act.id}
                    onClick={() => setActivityLevel(act.id as ActivityLevel)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activityLevel === act.id
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'border-[var(--border)] bg-[var(--bg-tertiary)] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold">{act.label}</div>
                    <div className="text-[10px] text-slate-400">{act.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Meals Per Day
                </label>
                <select
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(e.target.value)}
                  className="input w-full"
                >
                  <option value="2">2 Meals (Intermittent Fasting)</option>
                  <option value="3">3 Meals (Breakfast, Lunch, Dinner)</option>
                  <option value="4">4 Meals (with pre/post workout snack)</option>
                  <option value="5+">5+ Small Meals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preferred Contact
                </label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as 'whatsapp' | 'instagram')}
                  className="input w-full"
                >
                  <option value="whatsapp">WhatsApp (Recommended)</option>
                  <option value="instagram">Instagram DM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Food Allergies or Dislikes
              </label>
              <input
                type="text"
                placeholder="e.g. Allergic to peanuts, dislike mushrooms/paneer, lactose sensitive..."
                value={allergiesDislikes}
                onChange={(e) => setAllergiesDislikes(e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Medical Conditions or Injuries
              </label>
              <input
                type="text"
                placeholder="e.g. Thyroid, PCOD, lower back pain, knee issues, none..."
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Any specific notes or questions for Coach Dajish?
              </label>
              <textarea
                rows={2}
                placeholder="Anything else you would like Coach Dajish to know..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          {/* Pricing & Transparency Notice */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-200">
                1-on-1 Customized Diet Transformation
              </div>
              <div className="text-[11px] text-slate-400">
                Personalized macros, meal timing, and weekly WhatsApp check-ins.
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-extrabold text-emerald-400">₹{customRate}</div>
              <div className="text-[10px] text-slate-500">Agreed Plan Fee</div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center text-base py-4 font-bold bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Your Assessment...
              </span>
            ) : (
              <span>🚀 Submit Assessment to Coach Dajish</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pb-8 space-y-2">
          <p>FitTrack By Dajish Mohan • Your information is strictly private and kept confidential.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
            <a
              href="https://wa.me/919895568068"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              💬 WhatsApp: +91 98955 68068
            </a>
            <span>•</span>
            <a
              href="https://www.instagram.com/dajishmohan/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors"
            >
              📸 Instagram: @dajishmohan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientOnboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading intake assessment...</div>}>
      <OnboardContent />
    </Suspense>
  );
}

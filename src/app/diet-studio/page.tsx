'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import nutritionData from '@/lib/nutrition-data.json';
import { toPng } from 'html-to-image';

interface FoodItem {
  id: string;
  name: string;
  portion: number;
  carbs_cal: number;
  protein_cal: number;
  fat_cal: number;
}

interface MealSection {
  title: 'Breakfast' | 'Mid-Day' | 'Lunch' | 'Mid-Afternoon' | 'Dinner';
  items: FoodItem[];
}

interface ClientOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
  instagram_handle?: string;
  custom_rate?: number;
}

const defaultVeenaMeals: MealSection[] = [
  {
    title: 'Breakfast',
    items: [
      { id: '1', name: 'Vegetable Curry 1 Cup', portion: 0.25, carbs_cal: 24, protein_cal: 5.4, fat_cal: 19.8 },
      { id: '2', name: 'Ragi Dosa (1 Qty)', portion: 1, carbs_cal: 58.8, protein_cal: 11.2, fat_cal: 36 },
      { id: '3', name: 'Egg - Whole (1 Qty)', portion: 3, carbs_cal: 7.2, protein_cal: 72, fat_cal: 135 },
      { id: '4', name: 'Egg  - White (1 Qty)', portion: 3, carbs_cal: 2.4, protein_cal: 43.2, fat_cal: 2.7 },
    ],
  },
  {
    title: 'Mid-Day',
    items: [
      { id: '5', name: 'Chiya Seed (10 gms)', portion: 1, carbs_cal: 15, protein_cal: 10.8, fat_cal: 29.25 },
      { id: '6', name: 'Whey Protein (1 Scoop/32gms)', portion: 1, carbs_cal: 8, protein_cal: 88, fat_cal: 4.5 },
    ],
  },
  {
    title: 'Lunch',
    items: [
      { id: '7', name: 'Brown rice 100 Gm', portion: 1, carbs_cal: 92, protein_cal: 9.2, fat_cal: 7.2 },
      { id: '8', name: 'Fish Curry 1 Bowl', portion: 0.5, carbs_cal: 9.14, protein_cal: 59, fat_cal: 49.59 },
      { id: '9', name: 'Leafy Greans 2 Cup', portion: 1, carbs_cal: 12.4, protein_cal: 4.8, fat_cal: 2.7 },
      { id: '10', name: 'Milk Yoghurt 1 Cup', portion: 1, carbs_cal: 29.6, protein_cal: 30.4, fat_cal: 88.2 },
      { id: '11', name: 'Egg Omlette (1 Egg)', portion: 1, carbs_cal: 4, protein_cal: 24, fat_cal: 45 },
    ],
  },
  {
    title: 'Mid-Afternoon',
    items: [
      { id: '12', name: 'Apple (1 Qty)', portion: 1, carbs_cal: 100, protein_cal: 0, fat_cal: 0 },
      { id: '13', name: 'Almonds (10 Nos)', portion: 1, carbs_cal: 12, protein_cal: 12, fat_cal: 54 },
    ],
  },
  {
    title: 'Dinner',
    items: [
      { id: '14', name: 'Baked Chicken 100Gm', portion: 2, carbs_cal: 0, protein_cal: 248, fat_cal: 64.8 },
      { id: '15', name: 'Salad (1 Cup/74 gms)', portion: 3, carbs_cal: 27.6, protein_cal: 7.2, fat_cal: 2.7 },
    ],
  },
];

function DietStudioContent() {
  const searchParams = useSearchParams();
  const posterRef = useRef<HTMLDivElement>(null);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Client profile & metrics
  const [clientName, setClientName] = useState('Veena MG');
  const [clientPhone, setClientPhone] = useState('+919845011223');
  const [age, setAge] = useState(41);
  const [heightCm, setHeightCm] = useState(155);
  const [weightKg, setWeightKg] = useState(100);
  const [sex, setSex] = useState<'Female' | 'Male'>('Female');
  const [activityLevel, setActivityLevel] = useState('Lightly Active (light exercise 1-3 days / week)');
  const [activityFactor, setActivityFactor] = useState(1.375);
  const [activityType, setActivityType] = useState('gym');
  const [medicalCondition, setMedicalCondition] = useState('insulin resistance');
  const [targetWeight, setTargetWeight] = useState(60);
  const [timeFrameDays, setTimeFrameDays] = useState(500);

  // Meals
  const [meals, setMeals] = useState<MealSection[]>(defaultVeenaMeals);

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'builder'>('preview');

  // Load clients
  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
          const qId = searchParams.get('clientId');
          if (qId) {
            const found = data.find((c: ClientOption) => c.id === qId);
            if (found) {
              setSelectedClientId(found.id);
              setClientName(found.name);
              setClientPhone(found.phone || '');
            }
          }
        }
      })
      .catch((err) => console.error(err));
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Select client from dropdown
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone || '');
      showToast(`Selected client: ${found.name}`);
    }
  };

  // Live Calculations (Formulas matched 1:1 with veena mg diet.xlsm)
  const stats = useMemo(() => {
    const hM = heightCm / 100;
    const bmi = parseFloat((weightKg / (hM * hM)).toFixed(2));

    // BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (sex === 'Female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }
    bmr = parseFloat(bmr.toFixed(2));

    // TDEE
    const tdee = parseFloat((bmr * activityFactor).toFixed(2));

    // Rate of loss
    const totalLossKg = Math.max(0, weightKg - targetWeight);
    const rateLossPerDay = timeFrameDays > 0 ? parseFloat((totalLossKg / timeFrameDays).toFixed(2)) : 0;
    const calLossReqd = parseFloat((rateLossPerDay * 7700).toFixed(2));

    // Category
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else if (bmi < 35) category = 'Obese 1';
    else if (bmi < 40) category = 'Obese 2';
    else category = 'Obese 3';

    // Meal totals
    let totalCarbCal = 0;
    let totalProtCal = 0;
    let totalFatCal = 0;

    meals.forEach((m) => {
      m.items.forEach((it) => {
        totalCarbCal += (it.carbs_cal || 0);
        totalProtCal += (it.protein_cal || 0);
        totalFatCal += (it.fat_cal || 0);
      });
    });

    const totalCal = parseFloat((totalCarbCal + totalProtCal + totalFatCal).toFixed(2));
    const carbGrams = parseFloat((totalCarbCal / 4).toFixed(2));
    const protGrams = parseFloat((totalProtCal / 4).toFixed(2));
    const fatGrams = parseFloat((totalFatCal / 9).toFixed(2));

    const carbPct = totalCal > 0 ? Math.round((totalCarbCal / totalCal) * 100) : 0;
    const protPct = totalCal > 0 ? Math.round((totalProtCal / totalCal) * 100) : 0;
    const fatPct = totalCal > 0 ? Math.round((totalFatCal / totalCal) * 100) : 0;

    return {
      bmi,
      bmr,
      tdee,
      rateLossPerDay,
      calLossReqd,
      category,
      totalCal,
      totalCarbCal: parseFloat(totalCarbCal.toFixed(2)),
      totalProtCal: parseFloat(totalProtCal.toFixed(2)),
      totalFatCal: parseFloat(totalFatCal.toFixed(2)),
      carbGrams,
      protGrams,
      fatGrams,
      carbPct,
      protPct,
      fatPct,
    };
  }, [heightCm, weightKg, sex, age, activityFactor, targetWeight, timeFrameDays, meals]);

  // Load Veena MG preset
  const loadVeenaPreset = () => {
    setClientName('Veena MG');
    setClientPhone('+919845011223');
    setAge(41);
    setHeightCm(155);
    setWeightKg(100);
    setSex('Female');
    setActivityLevel('Lightly Active (light exercise 1-3 days / week)');
    setActivityFactor(1.375);
    setActivityType('gym');
    setMedicalCondition('insulin resistance');
    setTargetWeight(60);
    setTimeFrameDays(500);
    setMeals(defaultVeenaMeals);
    showToast('Loaded Veena MG Diet Plan Template ✓');
  };

  // Add food item to a meal
  const addFoodItem = (mealIndex: number, foodName: string) => {
    const found = nutritionData.find((n) => n.name === foodName);
    if (!found) return;

    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex].items.push({
        id: `food_${Date.now()}_${Math.random()}`,
        name: found.name,
        portion: 1,
        carbs_cal: found.carbs_cal,
        protein_cal: found.protein_cal,
        fat_cal: found.fat_cal,
      });
      return copy;
    });
    showToast(`Added ${found.name}`);
  };

  // Update food portion
  const updatePortion = (mealIndex: number, itemIndex: number, newPortion: number) => {
    setMeals((prev) => {
      const copy = [...prev];
      const it = copy[mealIndex].items[itemIndex];
      const found = nutritionData.find((n) => n.name === it.name);
      if (found) {
        it.portion = newPortion;
        it.carbs_cal = parseFloat((found.carbs_cal * newPortion).toFixed(2));
        it.protein_cal = parseFloat((found.protein_cal * newPortion).toFixed(2));
        it.fat_cal = parseFloat((found.fat_cal * newPortion).toFixed(2));
      }
      return copy;
    });
  };

  // Remove food item
  const removeFoodItem = (mealIndex: number, itemIndex: number) => {
    setMeals((prev) => {
      const copy = [...prev];
      copy[mealIndex].items.splice(itemIndex, 1);
      return copy;
    });
  };

  // Download HD Poster Image (PNG)
  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setGeneratingImg(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 2, // 2x Retina resolution for razor-sharp text
      });
      const link = document.createElement('a');
      link.download = `Diet_Plan_${clientName.replace(/\s+/g, '_')}_Dajish_Mohan.png`;
      link.href = dataUrl;
      link.click();
      showToast('Downloaded High-Resolution Diet Poster! 📸');
    } catch (err) {
      console.error('Image export failed:', err);
      showToast('Failed to export image. Try browser Print.');
    } finally {
      setGeneratingImg(false);
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    const text = `Hi ${clientName}! 🏋️‍♂️ Coach Dajish Mohan here. Your personalized Diet Plan is ready! Total: ${stats.totalCal} kcal (${stats.protGrams}g Protein, ${stats.carbGrams}g Carbs, ${stats.fatGrams}g Fat). Let me know when you receive it!`;
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 animate-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <h1 className="text-2xl font-bold text-slate-100">
              Diet Studio &amp; Poster Generator
            </h1>
            <span className="badge bg-emerald-500/20 text-emerald-400 font-semibold text-xs">
              1-Click Infographic
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Replace Excel &amp; ChatGPT: Build macro plans and export identical, pixel-perfect posters in seconds.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadVeenaPreset}
            className="btn btn-sm btn-secondary text-xs"
            title="Load Veena MG plan from Excel"
          >
            ⚡ Load Veena MG Plan
          </button>

          <button
            onClick={downloadPoster}
            disabled={generatingImg}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
          >
            <span>{generatingImg ? '⏳ Generating...' : '📸 Download HD Poster'}</span>
          </button>

          <button
            onClick={shareWhatsApp}
            className="btn btn-sm text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 flex items-center gap-1.5"
          >
            <span>💬 Send to Client</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel (Left) & Live Poster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Client Selector & Quick Presets */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                1. Select Client
              </span>
              <span className="text-[11px] text-slate-500">
                Auto-fills metrics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="input text-xs w-full sm:col-span-2"
              >
                <option value="">-- Choose Existing Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">WhatsApp Phone</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
            </div>
          </div>

          {/* Body Stats & Goal (Excel Sheet 2 Data) */}
          <div className="card space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
              2. Profile &amp; Body Analysis
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Age (yrs)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="input text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="input text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Female' | 'Male')}
                  className="input text-xs w-full"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Activity Level</label>
                <select
                  value={activityFactor}
                  onChange={(e) => {
                    const factor = parseFloat(e.target.value);
                    setActivityFactor(factor);
                    if (factor === 1.2) setActivityLevel('Sedentary (desk job)');
                    else if (factor === 1.375) setActivityLevel('Lightly Active (light exercise 1-3 days / week)');
                    else if (factor === 1.55) setActivityLevel('Moderately Active (moderate exercise 3-5 days / week)');
                    else setActivityLevel('Very Active (heavy exercise 6-7 days / week)');
                  }}
                  className="input text-xs w-full"
                >
                  <option value={1.2}>Sedentary (1.2)</option>
                  <option value={1.375}>Lightly Active (1.375)</option>
                  <option value={1.55}>Moderately Active (1.55)</option>
                  <option value={1.725}>Very Active (1.725)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Weight (kg)</label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                  className="input text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Time Frame (Days)</label>
                <input
                  type="number"
                  value={timeFrameDays}
                  onChange={(e) => setTimeFrameDays(parseInt(e.target.value) || 1)}
                  className="input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Physical Activity</label>
                <input
                  type="text"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="input text-xs w-full"
                  placeholder="e.g. gym"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Medical Conditions</label>
                <input
                  type="text"
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  className="input text-xs w-full"
                  placeholder="e.g. insulin resistance"
                />
              </div>
            </div>

            {/* Auto-calc summary pill */}
            <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>BMI: <strong className="text-emerald-400">{stats.bmi}</strong> ({stats.category})</span>
                <span>BMR: <strong>{stats.bmr}</strong> kcal</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>TDEE: <strong>{stats.tdee}</strong> kcal</span>
                <span>Calorie Deficit: <strong className="text-amber-400">-{stats.calLossReqd}</strong> kcal</span>
              </div>
            </div>
          </div>

          {/* Meals Manager */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                3. Meal Plans ({stats.totalCal} kcal)
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                P: {stats.protPct}% • C: {stats.carbPct}% • F: {stats.fatPct}%
              </span>
            </div>

            <div className="space-y-3">
              {meals.map((meal, mIdx) => (
                <div key={meal.title} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {meal.title} ({meal.items.length})
                    </span>

                    {/* Quick Add Dropdown */}
                    <select
                      className="input py-0.5 px-2 text-[11px] max-w-[160px]"
                      onChange={(e) => {
                        if (e.target.value) {
                          addFoodItem(mIdx, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">+ Add Food...</option>
                      {nutritionData.slice(0, 100).map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Food Items List */}
                  <div className="space-y-1.5">
                    {meal.items.map((it, iIdx) => (
                      <div key={it.id} className="flex items-center justify-between gap-1 text-[11px] bg-[var(--bg-secondary)] px-2 py-1 rounded-lg">
                        <span className="truncate flex-1 text-slate-300">{it.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            value={it.portion}
                            onChange={(e) => updatePortion(mIdx, iIdx, parseFloat(e.target.value) || 1)}
                            className="w-12 text-center text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-1 py-0.5"
                          />
                          <button
                            onClick={() => removeFoodItem(mIdx, iIdx)}
                            className="text-red-400 hover:text-red-300 px-1 text-xs"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster View (Exact match to ChatGPT image) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>🖼️</span> Generated Infographic Poster
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadPoster}
                disabled={generatingImg}
                className="btn btn-sm btn-primary text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-500"
              >
                {generatingImg ? '⏳ Generating...' : '📸 Save as PNG'}
              </button>
            </div>
          </div>

          {/* The Poster Container (Rendered to PNG via html-to-image) */}
          <div className="w-full overflow-x-auto p-1 bg-slate-900 rounded-2xl flex justify-center border border-[var(--border)]">
            <div
              ref={posterRef}
              id="diet-poster"
              style={{ width: '680px', minHeight: '980px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              className="bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl relative select-none"
            >
              {/* ─── Header ─── */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3.5">
                  {/* Portrait photo of Coach Dajish Mohan */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/coach-dajish.png"
                      alt="Dajish Mohan"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-[#0f2a4a] tracking-tight leading-none mb-1">
                      Dajish Mohan
                    </h1>
                    <p className="text-[12px] font-bold text-slate-800 leading-tight">
                      International Certified Personal Trainer
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight">
                      Weight Loss Expert | Transformation Coach
                    </p>

                    {/* 4 Feature Badges */}
                    <div className="flex items-center gap-2.5 mt-2 text-[9px] text-slate-700 font-medium">
                      <span className="flex items-center gap-1">
                        <span>🏋️</span> Sustainable Weight Loss
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🍏</span> Personalized Nutrition
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🏃</span> Lifestyle Guidance
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💙</span> Healthier Happier You
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slogan Top-Right */}
                <div className="text-right">
                  <div className="italic font-serif text-lg text-slate-700 leading-tight">
                    Fit<br />
                    <span className="font-bold">Stronger</span><br />
                    Healthier<br />
                    <span className="text-emerald-600 font-black">You</span>
                  </div>
                  <div className="w-10 h-1 bg-emerald-500 rounded-full ml-auto mt-0.5"></div>
                </div>
              </div>

              {/* ─── Title Bar ─── */}
              <div className="mt-3 bg-[#e6f4f8] rounded-xl px-4 py-2.5 flex items-center justify-between border border-[#c4e5ef]">
                <div>
                  <span className="text-[10px] tracking-widest uppercase font-black text-slate-600 block">
                    Personalized
                  </span>
                  <span className="text-2xl font-black text-[#0f2a4a] tracking-tight leading-none">
                    DIET PLAN
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs">
                    👤
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Client Name</span>
                    <span className="text-base font-bold text-slate-900 leading-none">{clientName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end font-semibold">
                    <span>🎯</span> Target Weight
                  </div>
                  <div className="text-base font-black text-[#0f2a4a]">
                    {targetWeight} kg
                  </div>
                  <div className="text-[9px] text-slate-600">in {timeFrameDays} Days</div>
                </div>
              </div>

              {/* ─── 3 Analysis Columns ─── */}
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                {/* Box 1: Client Profile */}
                <div className="bg-[#f0f8fd] border border-[#d6ecfa] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#0f2a4a] uppercase tracking-wider flex items-center gap-1 border-b border-blue-200/60 pb-1 text-[10px]">
                    <span>👤</span> CLIENT PROFILE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Age</span>
                    <span className="font-semibold text-slate-900">{age} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Height (cm)</span>
                    <span className="font-semibold text-slate-900">{heightCm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Weight (kg)</span>
                    <span className="font-semibold text-slate-900">{weightKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sex</span>
                    <span className="font-semibold text-slate-900">{sex}</span>
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-slate-600">Activity Level</span>
                    <span className="font-medium text-slate-800 text-[9px] leading-tight mt-0.5">
                      {activityLevel}
                    </span>
                  </div>
                </div>

                {/* Box 2: Body Analysis */}
                <div className="bg-[#f0f8fd] border border-[#d6ecfa] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#0f2a4a] uppercase tracking-wider flex items-center gap-1 border-b border-blue-200/60 pb-1 text-[10px]">
                    <span>📊</span> BODY ANALYSIS
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">BMI</span>
                    <span className="font-semibold text-slate-900">{stats.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">BMR (kcal)</span>
                    <span className="font-semibold text-slate-900">{stats.bmr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TDEE (kcal)</span>
                    <span className="font-semibold text-slate-900">{stats.tdee}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-600">Category</span>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold">
                      {stats.category}
                    </span>
                  </div>
                </div>

                {/* Box 3: Goal & Plan */}
                <div className="bg-[#fef2f2] border border-[#fbd5d5] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#991b1b] uppercase tracking-wider flex items-center gap-1 border-b border-red-200 pb-1 text-[10px]">
                    <span>🎯</span> GOAL &amp; PLAN
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Target Weight</span>
                    <span className="font-semibold text-slate-900">{targetWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time Frame (Days)</span>
                    <span className="font-semibold text-slate-900">{timeFrameDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rate of Loss/Day</span>
                    <span className="font-semibold text-slate-900">{stats.rateLossPerDay} Kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Calorie Deficit/Day</span>
                    <span className="font-black text-red-600">{stats.calLossReqd} kcal</span>
                  </div>
                </div>
              </div>

              {/* ─── Activity & Medical Condition Banner ─── */}
              <div className="flex items-center gap-3 mt-2.5 text-[10px]">
                <div className="flex-1 bg-[#f4f7fa] border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span>🏋️</span>
                  <span className="text-slate-600">Type of Physical Activity:</span>
                  <span className="font-bold text-slate-900 capitalize">{activityType}</span>
                </div>

                <div className="flex-1 bg-[#fff5f5] border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span>🩺</span>
                  <span className="text-slate-600">Medical Condition:</span>
                  <span className="font-bold text-red-700 capitalize">{medicalCondition}</span>
                </div>
              </div>

              {/* ─── Proposed Meal Plan Summary ─── */}
              <div className="mt-3 bg-[#edf7f0] border border-[#cbe9d3] rounded-xl p-3">
                <div className="font-black text-emerald-950 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <span>📊</span> PROPOSED MEAL PLAN SUMMARY
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 shadow-xs border border-emerald-100">
                    <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                      <span>🔥</span> Total Calories
                    </div>
                    <div className="text-base font-black text-[#0f2a4a] mt-0.5">
                      {stats.totalCal}
                    </div>
                    <div className="text-[9px] text-slate-500">kcal</div>
                  </div>

                  <div className="bg-white rounded-lg p-2 shadow-xs border border-emerald-100">
                    <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                      <span>🌾</span> Carbohydrates
                    </div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      {stats.totalCarbCal} kcal
                    </div>
                    <div className="text-[9px] text-slate-600 font-medium">
                      {stats.carbGrams} g ({stats.carbPct}%)
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-2 shadow-xs border border-emerald-100">
                    <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                      <span>💪</span> Protein
                    </div>
                    <div className="text-base font-black text-blue-700 mt-0.5">
                      {stats.totalProtCal} kcal
                    </div>
                    <div className="text-[9px] text-slate-600 font-medium">
                      {stats.protGrams} g ({stats.protPct}%)
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-2 shadow-xs border border-emerald-100">
                    <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                      <span>💧</span> Fat
                    </div>
                    <div className="text-base font-black text-amber-700 mt-0.5">
                      {stats.totalFatCal} kcal
                    </div>
                    <div className="text-[9px] text-slate-600 font-medium">
                      {stats.fatGrams} g ({stats.fatPct}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Detailed Meal Plan Table ─── */}
              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#eaf4fb] px-3 py-1.5 border-b border-slate-200 flex items-center gap-1.5 font-black text-[#0f2a4a] text-[10px] uppercase tracking-wider">
                  <span>🍽️</span> DETAILED MEAL PLAN
                </div>

                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1 px-2.5 w-24">Time of Day</th>
                      <th className="py-1 px-2">Food Consumed</th>
                      <th className="py-1 px-2 text-center w-14">Portion</th>
                      <th className="py-1 px-2 text-right w-16">Carb (Cal)</th>
                      <th className="py-1 px-2 text-right w-16">Protein (Cal)</th>
                      <th className="py-1 px-2 text-right w-14">Fat (Cal)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meals.map((meal) => (
                      meal.items.map((it, idx) => (
                        <tr
                          key={`${meal.title}_${it.id}`}
                          className={`border-b border-slate-100 hover:bg-slate-50/60 ${
                            idx === 0 ? 'border-t border-slate-200' : ''
                          }`}
                        >
                          {idx === 0 ? (
                            <td
                              rowSpan={meal.items.length}
                              className="py-1.5 px-2.5 font-bold text-[#0f2a4a] align-top bg-[#f8fbfe] border-r border-slate-200"
                            >
                              {meal.title}
                            </td>
                          ) : null}
                          <td className="py-1 px-2 font-medium text-slate-800">{it.name}</td>
                          <td className="py-1 px-2 text-center text-slate-600 font-mono">{it.portion}</td>
                          <td className="py-1 px-2 text-right text-slate-700 font-mono">{it.carbs_cal}</td>
                          <td className="py-1 px-2 text-right text-slate-700 font-mono">{it.protein_cal}</td>
                          <td className="py-1 px-2 text-right text-slate-700 font-mono">{it.fat_cal}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ─── Common Instructions ─── */}
              <div className="mt-3 bg-[#fefce8] border border-[#fef08a] rounded-xl p-2.5 text-[8.5px]">
                <div className="font-bold text-amber-950 uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
                  <span>📋</span> COMMON INSTRUCTIONS
                </div>

                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-slate-700 leading-tight">
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">💧</span>
                    <span>Drink water according to your individual needs.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">🚫</span>
                    <span>Limit sugary foods, bakery items and deep fried foods.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">🩺</span>
                    <span>Follow medical advice for insulin resistance and any conditions.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">🥗</span>
                    <span>Include more vegetables and leafy greens in meals.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">🏃</span>
                    <span>Do exercise as per your medical condition and fitness level.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">💊</span>
                    <span>Do not change prescribed medication without doctor guidance.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">⏰</span>
                    <span>Keep regular meal timings.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">🛏️</span>
                    <span>Aim for 7–8 hours of quality sleep daily.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="shrink-0">ℹ️</span>
                    <span>This is a general guide customized for your current phase.</span>
                  </div>
                </div>
              </div>

              {/* ─── Footer Quote ─── */}
              <div className="mt-3 text-center pt-2 border-t border-slate-200">
                <p className="text-[10px] italic text-[#0f2a4a] font-medium tracking-wide">
                  &ldquo;Consistency in Nutrition and Lifestyle Today Builds a Healthier, Happier You Tomorrow.&rdquo;
                </p>
                <div className="w-16 h-0.5 bg-emerald-500 mx-auto mt-0.5 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default function DietStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Diet Studio...</div>}>
      <DietStudioContent />
    </Suspense>
  );
}

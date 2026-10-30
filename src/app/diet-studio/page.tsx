'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import nutritionDataRaw from '@/lib/nutrition-data.json';
import { toPng } from 'html-to-image';

export interface FoodItem {
  id: string;
  name: string;
  portion: number;
  carbs_cal: number;
  protein_cal: number;
  fat_cal: number;
  base_carbs_cal?: number;
  base_protein_cal?: number;
  base_fat_cal?: number;
}

export interface MealSection {
  title: string;
  items: FoodItem[];
}

export interface InstructionItem {
  icon: string;
  text: string;
}

interface ClientOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
  instagram_handle?: string;
  custom_rate?: number;
  notes?: string;
}

// Clean duplicate-free nutrition data
const nutritionData = Array.from(
  new Map((nutritionDataRaw as Array<{ name: string; carbs_cal: number; protein_cal: number; fat_cal: number }>).map((item) => [item.name, item])).values()
);

const defaultInstructions: InstructionItem[] = [
  { icon: '💧', text: 'Drink 3-4 liters of water daily according to your activity level.' },
  { icon: '🚫', text: 'Strictly avoid refined sugars, processed bakery snacks & deep-fried foods.' },
  { icon: '🩺', text: 'Follow medical advice for insulin resistance or any pre-existing health conditions.' },
  { icon: '🥗', text: 'Include raw vegetable salads & fiber-rich greens with lunch & dinner.' },
  { icon: '🏃', text: 'Perform regular strength and cardiovascular exercises as advised.' },
  { icon: '💊', text: 'Do not modify any prescribed medications without your physician’s approval.' },
  { icon: '⏰', text: 'Maintain consistent meal timings with at least 3-4 hours between meals.' },
  { icon: '🛏️', text: 'Ensure 7 to 8 hours of deep, quality sleep every night for recovery.' },
  { icon: 'ℹ️', text: 'Personalized protocol designed specifically for your current fitness phase.' },
];

// Presets
const balancedTemplate: MealSection[] = [
  {
    title: 'Breakfast',
    items: [
      { id: 'b1', name: 'Ragi Dosa (1 Qty)', portion: 2, carbs_cal: 117.6, protein_cal: 22.4, fat_cal: 72, base_carbs_cal: 58.8, base_protein_cal: 11.2, base_fat_cal: 36 },
      { id: 'b2', name: 'Egg - White (1 Qty)', portion: 3, carbs_cal: 2.4, protein_cal: 43.2, fat_cal: 2.7, base_carbs_cal: 0.8, base_protein_cal: 14.4, base_fat_cal: 0.9 },
      { id: 'b3', name: 'Vegetable Curry 1 Cup', portion: 0.5, carbs_cal: 48, protein_cal: 10.8, fat_cal: 39.6, base_carbs_cal: 96, base_protein_cal: 21.6, base_fat_cal: 79.2 },
    ],
  },
  {
    title: 'Mid-Morning',
    items: [
      { id: 'mm1', name: 'Green Apple', portion: 1, carbs_cal: 100, protein_cal: 0, fat_cal: 0, base_carbs_cal: 100, base_protein_cal: 0, base_fat_cal: 0 },
      { id: 'mm2', name: 'Almonds (10 Nos)', portion: 1, carbs_cal: 12, protein_cal: 12, fat_cal: 54, base_carbs_cal: 12, base_protein_cal: 12, base_fat_cal: 54 },
      { id: 'mm3', name: 'Chiya Seed (10 gms)', portion: 1, carbs_cal: 15, protein_cal: 10.8, fat_cal: 29.25, base_carbs_cal: 15, base_protein_cal: 10.8, base_fat_cal: 29.25 },
    ],
  },
  {
    title: 'Lunch',
    items: [
      { id: 'l1', name: 'Brown rice 100 Gm', portion: 1, carbs_cal: 92, protein_cal: 9.2, fat_cal: 7.2, base_carbs_cal: 92, base_protein_cal: 9.2, base_fat_cal: 7.2 },
      { id: 'l2', name: 'Fish Curry 1 Bowl', portion: 0.5, carbs_cal: 9.14, protein_cal: 59, fat_cal: 49.59, base_carbs_cal: 18.28, base_protein_cal: 118, base_fat_cal: 99.18 },
      { id: 'l3', name: 'Leafy Greens 2 Cup', portion: 1, carbs_cal: 12.4, protein_cal: 4.8, fat_cal: 2.7, base_carbs_cal: 12.4, base_protein_cal: 4.8, base_fat_cal: 2.7 },
      { id: 'l4', name: 'Milk Yoghurt 1 Cup', portion: 1, carbs_cal: 29.6, protein_cal: 30.4, fat_cal: 88.2, base_carbs_cal: 29.6, base_protein_cal: 30.4, base_fat_cal: 88.2 },
    ],
  },
  {
    title: 'Evening Snack',
    items: [
      { id: 'es1', name: 'Whey Protein (1 Scoop/32gms)', portion: 1, carbs_cal: 8, protein_cal: 88, fat_cal: 4.5, base_carbs_cal: 8, base_protein_cal: 88, base_fat_cal: 4.5 },
    ],
  },
  {
    title: 'Dinner',
    items: [
      { id: 'd1', name: 'Chicken Breast (100 g)', portion: 1.5, carbs_cal: 0, protein_cal: 186, fat_cal: 48.6, base_carbs_cal: 0, base_protein_cal: 124, base_fat_cal: 32.4 },
      { id: 'd2', name: 'Salad (1 Cup/74 gms)', portion: 2, carbs_cal: 18.4, protein_cal: 4.8, fat_cal: 1.8, base_carbs_cal: 9.2, base_protein_cal: 2.4, base_fat_cal: 0.9 },
    ],
  },
];

const vegetarianTemplate: MealSection[] = [
  {
    title: 'Breakfast',
    items: [
      { id: 'vb1', name: 'Ragi Dosa (1 Qty)', portion: 2, carbs_cal: 117.6, protein_cal: 22.4, fat_cal: 72, base_carbs_cal: 58.8, base_protein_cal: 11.2, base_fat_cal: 36 },
      { id: 'vb2', name: 'Vegetable Curry 1 Cup', portion: 1, carbs_cal: 96, protein_cal: 21.6, fat_cal: 79.2, base_carbs_cal: 96, base_protein_cal: 21.6, base_fat_cal: 79.2 },
    ],
  },
  {
    title: 'Mid-Morning',
    items: [
      { id: 'vmm1', name: 'Green Apple', portion: 1, carbs_cal: 100, protein_cal: 0, fat_cal: 0, base_carbs_cal: 100, base_protein_cal: 0, base_fat_cal: 0 },
      { id: 'vmm2', name: 'Almonds (10 Nos)', portion: 1, carbs_cal: 12, protein_cal: 12, fat_cal: 54, base_carbs_cal: 12, base_protein_cal: 12, base_fat_cal: 54 },
      { id: 'vmm3', name: 'Chiya Seed (10 gms)', portion: 1, carbs_cal: 15, protein_cal: 10.8, fat_cal: 29.25, base_carbs_cal: 15, base_protein_cal: 10.8, base_fat_cal: 29.25 },
    ],
  },
  {
    title: 'Lunch',
    items: [
      { id: 'vl1', name: 'Brown rice 100 Gm', portion: 1, carbs_cal: 92, protein_cal: 9.2, fat_cal: 7.2, base_carbs_cal: 92, base_protein_cal: 9.2, base_fat_cal: 7.2 },
      { id: 'vl2', name: 'Milk Yoghurt 1 Cup', portion: 1, carbs_cal: 29.6, protein_cal: 30.4, fat_cal: 88.2, base_carbs_cal: 29.6, base_protein_cal: 30.4, base_fat_cal: 88.2 },
      { id: 'vl3', name: 'Leafy Greens 2 Cup', portion: 1, carbs_cal: 12.4, protein_cal: 4.8, fat_cal: 2.7, base_carbs_cal: 12.4, base_protein_cal: 4.8, base_fat_cal: 2.7 },
      { id: 'vl4', name: 'Salad (1 Cup/74 gms)', portion: 2, carbs_cal: 18.4, protein_cal: 4.8, fat_cal: 1.8, base_carbs_cal: 9.2, base_protein_cal: 2.4, base_fat_cal: 0.9 },
    ],
  },
  {
    title: 'Evening Snack',
    items: [
      { id: 'ves1', name: 'Whey Protein (1 Scoop/32gms)', portion: 1, carbs_cal: 8, protein_cal: 88, fat_cal: 4.5, base_carbs_cal: 8, base_protein_cal: 88, base_fat_cal: 4.5 },
    ],
  },
  {
    title: 'Dinner',
    items: [
      { id: 'vd1', name: 'Vegetable Curry 1 Cup', portion: 0.75, carbs_cal: 72, protein_cal: 16.2, fat_cal: 59.4, base_carbs_cal: 96, base_protein_cal: 21.6, base_fat_cal: 79.2 },
      { id: 'vd2', name: 'Salad (1 Cup/74 gms)', portion: 2, carbs_cal: 18.4, protein_cal: 4.8, fat_cal: 1.8, base_carbs_cal: 9.2, base_protein_cal: 2.4, base_fat_cal: 0.9 },
    ],
  },
];

const highProteinTemplate: MealSection[] = [
  {
    title: 'Breakfast',
    items: [
      { id: 'hp1', name: 'Egg - Whole (1 Qty)', portion: 3, carbs_cal: 7.2, protein_cal: 72, fat_cal: 135, base_carbs_cal: 2.4, base_protein_cal: 24, base_fat_cal: 45 },
      { id: 'hp2', name: 'Egg - White (1 Qty)', portion: 4, carbs_cal: 3.2, protein_cal: 57.6, fat_cal: 3.6, base_carbs_cal: 0.8, base_protein_cal: 14.4, base_fat_cal: 0.9 },
      { id: 'hp3', name: 'Brown rice 100 Gm', portion: 0.5, carbs_cal: 46, protein_cal: 4.6, fat_cal: 3.6, base_carbs_cal: 92, base_protein_cal: 9.2, base_fat_cal: 7.2 },
    ],
  },
  {
    title: 'Mid-Morning',
    items: [
      { id: 'hp4', name: 'Whey Protein (1 Scoop/32gms)', portion: 1, carbs_cal: 8, protein_cal: 88, fat_cal: 4.5, base_carbs_cal: 8, base_protein_cal: 88, base_fat_cal: 4.5 },
      { id: 'hp5', name: 'Almonds (10 Nos)', portion: 1, carbs_cal: 12, protein_cal: 12, fat_cal: 54, base_carbs_cal: 12, base_protein_cal: 12, base_fat_cal: 54 },
    ],
  },
  {
    title: 'Lunch',
    items: [
      { id: 'hp6', name: 'Chicken Breast (100 g)', portion: 2, carbs_cal: 0, protein_cal: 248, fat_cal: 64.8, base_carbs_cal: 0, base_protein_cal: 124, base_fat_cal: 32.4 },
      { id: 'hp7', name: 'Brown rice 100 Gm', portion: 1, carbs_cal: 92, protein_cal: 9.2, fat_cal: 7.2, base_carbs_cal: 92, base_protein_cal: 9.2, base_fat_cal: 7.2 },
      { id: 'hp8', name: 'Leafy Greens 2 Cup', portion: 1, carbs_cal: 12.4, protein_cal: 4.8, fat_cal: 2.7, base_carbs_cal: 12.4, base_protein_cal: 4.8, base_fat_cal: 2.7 },
    ],
  },
  {
    title: 'Post-Workout',
    items: [
      { id: 'hp9', name: 'Whey Protein (1 Scoop/32gms)', portion: 1, carbs_cal: 8, protein_cal: 88, fat_cal: 4.5, base_carbs_cal: 8, base_protein_cal: 88, base_fat_cal: 4.5 },
    ],
  },
  {
    title: 'Dinner',
    items: [
      { id: 'hp10', name: 'Fish Curry 1 Bowl', portion: 1, carbs_cal: 18.28, protein_cal: 118, fat_cal: 99.18, base_carbs_cal: 18.28, base_protein_cal: 118, base_fat_cal: 99.18 },
      { id: 'hp11', name: 'Salad (1 Cup/74 gms)', portion: 2, carbs_cal: 18.4, protein_cal: 4.8, fat_cal: 1.8, base_carbs_cal: 9.2, base_protein_cal: 2.4, base_fat_cal: 0.9 },
    ],
  },
];

function DietStudioContent() {
  const searchParams = useSearchParams();
  const posterRef = useRef<HTMLDivElement>(null);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Client profile & metrics
  const [clientName, setClientName] = useState('Client Name');
  const [clientPhone, setClientPhone] = useState('');
  const [age, setAge] = useState<number | string>(28);
  const [heightCm, setHeightCm] = useState<number | string>(170);
  const [weightKg, setWeightKg] = useState<number | string>(75);
  const [sex, setSex] = useState<'Female' | 'Male'>('Male');
  const [activityLevel, setActivityLevel] = useState('Moderately Active (moderate exercise 3-5 days / week)');
  const [activityFactor, setActivityFactor] = useState(1.55);
  const [activityType, setActivityType] = useState('Gym & Resistance Training');
  const [medicalCondition, setMedicalCondition] = useState('None');
  const [targetWeight, setTargetWeight] = useState<number | string>(70);
  const [timeFrameDays, setTimeFrameDays] = useState<number | string>(90);

  // Meals & Instructions & Quote
  const [meals, setMeals] = useState<MealSection[]>(balancedTemplate);
  const [instructions, setInstructions] = useState<InstructionItem[]>(defaultInstructions);
  const [quote, setQuote] = useState('Consistency in Nutrition and Lifestyle Today Builds a Healthier, Happier You Tomorrow.');

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load clients list
  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
          const qId = searchParams.get('clientId');
          if (qId) {
            handleClientSelect(qId, data);
          } else {
            // Auto-select first active client
            handleClientSelect(data[0].id, data);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [searchParams]);

  // Load client profile & existing diet plan
  const handleClientSelect = async (clientId: string, clientList: ClientOption[] = clients) => {
    if (!clientId) {
      setSelectedClientId('');
      setClientName('');
      setClientPhone('');
      return;
    }

    setSelectedClientId(clientId);
    const found = clientList.find((c) => c.id === clientId);
    if (!found) return;

    setClientName(found.name);
    setClientPhone(found.phone || '');

    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const fullClient = await res.json();

        // 1. Load latest health metrics
        if (fullClient.health_metrics && fullClient.health_metrics.length > 0) {
          const latestMetric = fullClient.health_metrics[0];
          if (latestMetric.weight_kg) setWeightKg(latestMetric.weight_kg);
          if (latestMetric.height_cm) setHeightCm(latestMetric.height_cm);
        }

        // 2. Parse intake form notes if present
        if (fullClient.notes) {
          const notesText = fullClient.notes;
          const twMatch = notesText.match(/Target Weight:\s*([\d.]+)/i);
          if (twMatch) setTargetWeight(parseFloat(twMatch[1]));

          const agMatch = notesText.match(/Age\s*\/\s*Gender:\s*(\d+)?\s*(?:yrs)?\s*\/\s*([a-zA-Z]+)?/i);
          if (agMatch) {
            if (agMatch[1]) setAge(parseInt(agMatch[1]));
            if (agMatch[2]) {
              const g = agMatch[2].toLowerCase();
              if (g.includes('female')) setSex('Female');
              else if (g.includes('male')) setSex('Male');
            }
          }

          const actMatch = notesText.match(/Activity Level:\s*([^\n]+)/i);
          if (actMatch) {
            const act = actMatch[1].trim().toLowerCase();
            if (act.includes('sedentary')) {
              setActivityFactor(1.2);
              setActivityLevel('Sedentary (desk job)');
            } else if (act.includes('moderate')) {
              setActivityFactor(1.55);
              setActivityLevel('Moderately Active (moderate exercise 3-5 days / week)');
            } else if (act.includes('very') || act.includes('high')) {
              setActivityFactor(1.725);
              setActivityLevel('Very Active (heavy exercise 6-7 days / week)');
            } else {
              setActivityFactor(1.375);
              setActivityLevel('Lightly Active (light exercise 1-3 days / week)');
            }
          }

          const medMatch = notesText.match(/Medical\s*\/\s*Injuries:\s*([^\n]+)/i);
          if (medMatch && medMatch[1].trim() && medMatch[1].trim() !== 'None') {
            setMedicalCondition(medMatch[1].trim());
          }

          const dietMatch = notesText.match(/Diet Preference:\s*([^\n]+)/i);
          if (dietMatch && (!fullClient.diet_plans || fullClient.diet_plans.length === 0)) {
            const dpref = dietMatch[1].trim().toLowerCase();
            if (dpref.includes('veg') && !dpref.includes('non')) {
              setMeals(vegetarianTemplate);
            }
          }
        }

        // 3. Load latest diet plan if saved
        if (fullClient.diet_plans && fullClient.diet_plans.length > 0) {
          const activePlan = fullClient.diet_plans[0];
          try {
            const parsed = typeof activePlan.plan_details === 'string'
              ? JSON.parse(activePlan.plan_details)
              : activePlan.plan_details;

            if (parsed.meals && Array.isArray(parsed.meals)) {
              setMeals(parsed.meals);
            }
            if (parsed.profile) {
              if (parsed.profile.age) setAge(parsed.profile.age);
              if (parsed.profile.sex) setSex(parsed.profile.sex);
              if (parsed.profile.activity_level) setActivityLevel(parsed.profile.activity_level);
              if (parsed.profile.activity_factor) setActivityFactor(parsed.profile.activity_factor);
              if (parsed.profile.activity_type) setActivityType(parsed.profile.activity_type);
              if (parsed.profile.medical_condition) setMedicalCondition(parsed.profile.medical_condition);
              if (parsed.profile.target_weight) setTargetWeight(parsed.profile.target_weight);
              if (parsed.profile.time_frame_days) setTimeFrameDays(parsed.profile.time_frame_days);
            }
            if (parsed.instructions && Array.isArray(parsed.instructions)) {
              setInstructions(parsed.instructions);
            }
            if (parsed.quote) {
              setQuote(parsed.quote);
            }
            showToast(`Loaded saved diet plan for ${found.name} ✓`);
            return;
          } catch (e) {
            console.error('Failed to parse diet plan JSON', e);
          }
        }

        showToast(`Loaded profile for ${found.name} ✓`);
      }
    } catch (err) {
      console.error('Failed to load client details', err);
    }
  };

  // Calculations
  const stats = useMemo(() => {
    const w = parseFloat(String(weightKg)) || 0;
    const h = parseFloat(String(heightCm)) || 0;
    const a = parseFloat(String(age)) || 0;
    const targetW = parseFloat(String(targetWeight)) || 0;
    const days = parseFloat(String(timeFrameDays)) || 1;

    const hM = h > 0 ? h / 100 : 1;
    const bmi = h > 0 && w > 0 ? parseFloat((w / (hM * hM)).toFixed(1)) : 0;

    // BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (sex === 'Female') {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    }
    bmr = bmr > 0 ? parseFloat(bmr.toFixed(0)) : 0;

    // TDEE
    const tdee = parseFloat((bmr * activityFactor).toFixed(0));

    // Rate of loss
    const totalLossKg = Math.max(0, w - targetW);
    const rateLossPerDay = days > 0 ? parseFloat((totalLossKg / days).toFixed(2)) : 0;
    const calLossReqd = parseFloat((rateLossPerDay * 7700).toFixed(0));

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
        totalCarbCal += parseFloat(String(it.carbs_cal)) || 0;
        totalProtCal += parseFloat(String(it.protein_cal)) || 0;
        totalFatCal += parseFloat(String(it.fat_cal)) || 0;
      });
    });

    const totalCal = parseFloat((totalCarbCal + totalProtCal + totalFatCal).toFixed(0));
    const carbGrams = parseFloat((totalCarbCal / 4).toFixed(1));
    const protGrams = parseFloat((totalProtCal / 4).toFixed(1));
    const fatGrams = parseFloat((totalFatCal / 9).toFixed(1));

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
      totalCarbCal: parseFloat(totalCarbCal.toFixed(1)),
      totalProtCal: parseFloat(totalProtCal.toFixed(1)),
      totalFatCal: parseFloat(totalFatCal.toFixed(1)),
      carbGrams,
      protGrams,
      fatGrams,
      carbPct,
      protPct,
      fatPct,
    };
  }, [heightCm, weightKg, sex, age, activityFactor, targetWeight, timeFrameDays, meals]);

  // Load Template preset
  const loadPreset = (type: 'balanced' | 'vegetarian' | 'high_protein' | 'blank') => {
    if (type === 'balanced') {
      setMeals(balancedTemplate);
      showToast('Loaded Balanced Weight Loss Template ✓');
    } else if (type === 'vegetarian') {
      setMeals(vegetarianTemplate);
      showToast('Loaded Pure Vegetarian Template ✓');
    } else if (type === 'high_protein') {
      setMeals(highProteinTemplate);
      showToast('Loaded High-Protein Transformation Template ✓');
    } else {
      setMeals([
        { title: 'Breakfast', items: [] },
        { title: 'Lunch', items: [] },
        { title: 'Dinner', items: [] },
      ]);
      showToast('Started Clean Blank Plan ✓');
    }
  };

  // Add meal section
  const addMealSection = () => {
    if (!newSectionTitle.trim()) return;
    setMeals((prev) => [...prev, { title: newSectionTitle.trim(), items: [] }]);
    setNewSectionTitle('');
    showToast(`Added meal section "${newSectionTitle.trim()}" ✓`);
  };

  // Remove meal section
  const removeMealSection = (index: number) => {
    setMeals((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Meal section removed');
  };

  // Add food item to a meal
  const addFoodItem = (mealIndex: number, foodName: string) => {
    const found = nutritionData.find((n) => n.name === foodName);
    if (!found) return;

    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[mealIndex].items.push({
        id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: found.name,
        portion: 1,
        carbs_cal: found.carbs_cal,
        protein_cal: found.protein_cal,
        fat_cal: found.fat_cal,
        base_carbs_cal: found.carbs_cal,
        base_protein_cal: found.protein_cal,
        base_fat_cal: found.fat_cal,
      });
      return copy;
    });
    showToast(`Added ${found.name} ✓`);
  };

  // Add custom manual food item
  const addCustomFoodItem = (mealIndex: number) => {
    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[mealIndex].items.push({
        id: `food_custom_${Date.now()}`,
        name: 'Custom Food Item',
        portion: 1,
        carbs_cal: 50,
        protein_cal: 20,
        fat_cal: 15,
        base_carbs_cal: 50,
        base_protein_cal: 20,
        base_fat_cal: 15,
      });
      return copy;
    });
    showToast('Added custom food item (edit macros inline) ✓');
  };

  // Edit food item name directly
  const updateFoodName = (mealIndex: number, itemIndex: number, newName: string) => {
    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[mealIndex].items[itemIndex].name = newName;
      return copy;
    });
  };

  // Update food portion
  const updatePortion = (mealIndex: number, itemIndex: number, newPortion: number) => {
    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const it = copy[mealIndex].items[itemIndex];
      const portion = Math.max(0.1, newPortion);

      let baseCarb = it.base_carbs_cal;
      let baseProt = it.base_protein_cal;
      let baseFat = it.base_fat_cal;

      if (baseCarb === undefined || baseProt === undefined || baseFat === undefined) {
        const found = nutritionData.find((n) => n.name.toLowerCase() === it.name.toLowerCase());
        if (found) {
          baseCarb = found.carbs_cal;
          baseProt = found.protein_cal;
          baseFat = found.fat_cal;
        } else {
          baseCarb = it.portion > 0 ? it.carbs_cal / it.portion : it.carbs_cal;
          baseProt = it.portion > 0 ? it.protein_cal / it.portion : it.protein_cal;
          baseFat = it.portion > 0 ? it.fat_cal / it.portion : it.fat_cal;
        }
        it.base_carbs_cal = baseCarb;
        it.base_protein_cal = baseProt;
        it.base_fat_cal = baseFat;
      }

      it.portion = portion;
      it.carbs_cal = parseFloat((baseCarb * portion).toFixed(1));
      it.protein_cal = parseFloat((baseProt * portion).toFixed(1));
      it.fat_cal = parseFloat((baseFat * portion).toFixed(1));

      return copy;
    });
  };

  // Update food calories directly
  const updateCalories = (mealIndex: number, itemIndex: number, field: 'carbs_cal' | 'protein_cal' | 'fat_cal', value: number) => {
    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[mealIndex].items[itemIndex][field] = value;
      return copy;
    });
  };

  // Remove food item
  const removeFoodItem = (mealIndex: number, itemIndex: number) => {
    setMeals((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[mealIndex].items.splice(itemIndex, 1);
      return copy;
    });
  };

  // Update instruction text
  const updateInstructionText = (index: number, newText: string) => {
    setInstructions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text: newText };
      return copy;
    });
  };

  // Save changes to client profile & active diet plan in database
  const saveToClientProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/diet-studio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          client_name: clientName,
          client_phone: clientPhone,
          age: parseInt(String(age)) || 0,
          sex,
          height_cm: parseFloat(String(heightCm)) || 0,
          weight_kg: parseFloat(String(weightKg)) || 0,
          activity_level: activityLevel,
          activity_factor: activityFactor,
          activity_type: activityType,
          medical_condition: medicalCondition,
          target_weight: parseFloat(String(targetWeight)) || 0,
          time_frame_days: parseInt(String(timeFrameDays)) || 0,
          meals,
          stats,
          instructions,
          quote,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await res.json();
      if (data.client_id && !selectedClientId) {
        setSelectedClientId(data.client_id);
      }
      setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      showToast(`Saved to ${clientName}'s profile and active diet plan! ✓`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving to profile';
      showToast(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Download HD Poster Image (PNG) with Print/PDF Fallback
  const downloadPoster = async () => {
    if (!posterRef.current) return;
    setGeneratingImg(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: false,
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.download = `Diet_Plan_${clientName.replace(/\s+/g, '_')}_Dajish_Mohan.png`;
      link.href = dataUrl;
      link.click();
      showToast('Downloaded High-Resolution Diet Poster! 📸');
    } catch (err) {
      console.error('Image export failed:', err);
      showToast('Opening Print / PDF export dialog...');
      window.print();
    } finally {
      setGeneratingImg(false);
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    const text = `Hi ${clientName}! 🏋️‍♂️ Coach Dajish Mohan here. Your personalized Diet Plan is ready!\n\nDaily Target: ${stats.totalCal} kcal (${stats.protGrams}g Protein, ${stats.carbGrams}g Carbs, ${stats.fatGrams}g Fat).\n\nTarget Goal: ${targetWeight} kg in ${timeFrameDays} Days.\n\nLet me know once you review this!`;
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtered foods for quick search
  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return nutritionData.slice(0, 80);
    const q = foodSearchQuery.toLowerCase();
    return nutritionData.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 50);
  }, [foodSearchQuery]);

  return (
    <div className="space-y-6 pb-20 animate-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Diet Studio &amp; Poster Generator
            </h1>
            <span className="badge bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-xs">
              Live Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Build and adjust meals in real-time. Changes mirror instantly onto the high-resolution poster below.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="dropdown relative">
            <button
              type="button"
              className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => {
                const el = document.getElementById('template-menu');
                if (el) el.classList.toggle('hidden');
              }}
            >
              <span>📋 Diet Templates ▾</span>
            </button>
            <div
              id="template-menu"
              className="hidden absolute right-0 mt-1 w-56 rounded-xl shadow-xl z-50 p-1.5 border border-[var(--border)] bg-[var(--bg-secondary)] text-xs space-y-1"
            >
              <button
                onClick={() => {
                  loadPreset('balanced');
                  document.getElementById('template-menu')?.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <span>🥗</span> Balanced Weight Loss (1,500 kcal)
              </button>
              <button
                onClick={() => {
                  loadPreset('high_protein');
                  document.getElementById('template-menu')?.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <span>🥩</span> High-Protein Muscle Gain
              </button>
              <button
                onClick={() => {
                  loadPreset('vegetarian');
                  document.getElementById('template-menu')?.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <span>🌱</span> Pure Vegetarian Transformation
              </button>
              <div className="border-t border-[var(--border)] my-1"></div>
              <button
                onClick={() => {
                  loadPreset('blank');
                  document.getElementById('template-menu')?.classList.add('hidden');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] flex items-center gap-2 text-slate-400"
              >
                <span>➕</span> Clear / Blank Plan
              </button>
            </div>
          </div>

          <button
            onClick={saveToClientProfile}
            disabled={savingProfile}
            className="btn btn-sm text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
          >
            <span>{savingProfile ? '⏳ Saving...' : '💾 Save to Profile'}</span>
          </button>

          <button
            onClick={downloadPoster}
            disabled={generatingImg}
            className="btn btn-sm text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
          >
            <span>{generatingImg ? '⏳ Exporting...' : '📸 Download Poster'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-sm btn-secondary text-xs flex items-center gap-1.5"
            title="Print or Save as PDF"
          >
            <span>🖨️ PDF / Print</span>
          </button>

          <button
            onClick={shareWhatsApp}
            className="btn btn-sm text-xs bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-500/30 flex items-center gap-1.5 font-semibold"
          >
            <span>💬 WhatsApp</span>
          </button>
        </div>
      </div>

      {lastSaved && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 flex items-center justify-between">
          <span>✓ Profile &amp; diet plan synced at {lastSaved}</span>
          {selectedClientId && (
            <Link href={`/clients/${selectedClientId}`} className="underline font-semibold hover:text-[var(--text-primary)]">
              View {clientName}&apos;s Profile →
            </Link>
          )}
        </div>
      )}

      {/* Main Grid: Control Panel (Left) & Live Poster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section 1: Client Selector & Profile */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                1. Client Selection &amp; Profile
              </span>
              <span className="text-[11px] text-emerald-500 font-medium">
                Live sync
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="">-- Choose Existing Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Sanjith"
                    className="input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91..."
                    className="input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Time Frame (Days)</label>
                  <input
                    type="number"
                    value={timeFrameDays}
                    onChange={(e) => setTimeFrameDays(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Body Stats & Analysis */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                2. Body Stats &amp; Analysis
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Formula-calculated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Gender / Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Female' | 'Male')}
                  className="input text-xs w-full"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Activity Multiplier</label>
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

              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Physical Activity</label>
                <input
                  type="text"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="input text-xs w-full"
                  placeholder="e.g. Gym & Cardio"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Medical Condition</label>
              <input
                type="text"
                value={medicalCondition}
                onChange={(e) => setMedicalCondition(e.target.value)}
                className="input text-xs w-full"
                placeholder="e.g. None / insulin resistance"
              />
            </div>

            {/* Calculations preview card */}
            <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-[var(--text-primary)]">
                <span>BMI: <strong className="text-emerald-500">{stats.bmi}</strong> ({stats.category})</span>
                <span>BMR: <strong>{stats.bmr}</strong> kcal</span>
              </div>
              <div className="flex justify-between text-[var(--text-primary)]">
                <span>TDEE: <strong>{stats.tdee}</strong> kcal</span>
                <span>Deficit: <strong className="text-red-500">-{stats.calLossReqd}</strong> kcal</span>
              </div>
            </div>
          </div>

          {/* Section 3: Meal Plan Builder */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                3. Meal Plan Foods ({stats.totalCal} kcal)
              </span>
              <span className="text-[11px] text-emerald-500 font-bold">
                P: {stats.protPct}% • C: {stats.carbPct}% • F: {stats.fatPct}%
              </span>
            </div>

            {/* Food Library Search */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] space-y-2">
              <label className="text-[10px] text-[var(--text-secondary)] block font-semibold">
                Quick Food Search &amp; Add:
              </label>
              <input
                type="text"
                placeholder="Search food library (e.g. egg, chicken, oats, paneer, rice)..."
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                className="input text-xs w-full"
              />
            </div>

            <div className="space-y-3">
              {meals.map((meal, mIdx) => (
                <div key={meal.title + mIdx} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {meal.title} ({meal.items.length})
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Food dropdown from search */}
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
                        {filteredFoods.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => addCustomFoodItem(mIdx)}
                        className="btn btn-sm btn-secondary text-[10px] py-0.5 px-1.5"
                        title="Add custom food item"
                      >
                        + Custom
                      </button>

                      {meals.length > 1 && (
                        <button
                          onClick={() => removeMealSection(mIdx)}
                          className="text-red-400 hover:text-red-500 p-1 text-xs"
                          title="Delete meal section"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Food Items */}
                  <div className="space-y-1.5">
                    {meal.items.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic py-1 text-center">
                        No food items added to this meal yet.
                      </p>
                    ) : (
                      meal.items.map((it, iIdx) => (
                        <div key={it.id} className="p-1.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={it.name}
                              onChange={(e) => updateFoodName(mIdx, iIdx, e.target.value)}
                              className="input py-0.5 px-2 text-[11px] flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                              placeholder="Food name"
                            />

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-[var(--text-secondary)]">Portion:</span>
                              <input
                                type="number"
                                step="0.25"
                                min="0.1"
                                max="10"
                                value={it.portion}
                                onChange={(e) => updatePortion(mIdx, iIdx, parseFloat(e.target.value) || 1)}
                                className="w-14 text-center text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-1 py-0.5"
                              />
                              <button
                                onClick={() => removeFoodItem(mIdx, iIdx)}
                                className="text-red-400 hover:text-red-500 px-1 text-sm font-bold"
                                title="Delete food item"
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {/* Calories details (editable) */}
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-[var(--text-secondary)] pt-0.5">
                            <div className="flex items-center gap-1">
                              <span>Carb:</span>
                              <input
                                type="number"
                                step="0.1"
                                value={it.carbs_cal}
                                onChange={(e) => updateCalories(mIdx, iIdx, 'carbs_cal', parseFloat(e.target.value) || 0)}
                                className="w-12 text-center text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded py-0.5"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Prot:</span>
                              <input
                                type="number"
                                step="0.1"
                                value={it.protein_cal}
                                onChange={(e) => updateCalories(mIdx, iIdx, 'protein_cal', parseFloat(e.target.value) || 0)}
                                className="w-12 text-center text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded py-0.5"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Fat:</span>
                              <input
                                type="number"
                                step="0.1"
                                value={it.fat_cal}
                                onChange={(e) => updateCalories(mIdx, iIdx, 'fat_cal', parseFloat(e.target.value) || 0)}
                                className="w-12 text-center text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded py-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Section */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="New Section Name (e.g. Pre-Workout, Evening Snack)..."
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="input text-xs flex-1"
                />
                <button
                  onClick={addMealSection}
                  className="btn btn-sm btn-secondary text-xs shrink-0"
                >
                  + Add Section
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Instructions & Quote */}
          <div className="card space-y-3">
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide block border-b border-[var(--border)] pb-2">
              4. Instructions &amp; Motivational Quote
            </span>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--text-secondary)] block">Common Instructions on Poster</label>
              {instructions.map((ins, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs">
                  <span className="w-5 text-center shrink-0">{ins.icon}</span>
                  <input
                    type="text"
                    value={ins.text}
                    onChange={(e) => updateInstructionText(idx, e.target.value)}
                    className="input text-[11px] py-1 px-2 flex-1 text-[var(--text-primary)]"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-secondary)] block mb-1">Bottom Quote</label>
              <textarea
                rows={2}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="input text-xs w-full text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster View */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <span>🖼️</span> Generated Infographic Poster
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ⚡ Live Mirror
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={saveToClientProfile}
                disabled={savingProfile}
                className="btn btn-sm text-xs py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                {savingProfile ? '⏳ Saving...' : '💾 Save Changes'}
              </button>

              <button
                onClick={downloadPoster}
                disabled={generatingImg}
                className="btn btn-sm text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {generatingImg ? '⏳ Exporting...' : '📸 Save PNG'}
              </button>
            </div>
          </div>

          {/* The Poster Container (Rendered to PNG via html-to-image or printed) */}
          <div className="w-full overflow-x-auto p-2 bg-[var(--bg-tertiary)] rounded-2xl flex justify-center border border-[var(--border)]">
            <div
              ref={posterRef}
              id="diet-poster"
              style={{ width: '680px', minHeight: '980px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              className="bg-white text-slate-900 p-6 flex flex-col justify-between shadow-2xl relative select-none rounded-xl"
            >
              {/* ─── Header ─── */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3.5">
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

                    <div className="flex items-center gap-2 mt-1 text-[9.5px] font-bold text-slate-700">
                      <span className="text-emerald-700">💬 +91 98955 68068</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-pink-700">📸 @dajishmohan</span>
                    </div>

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
                    <span className="text-base font-bold text-slate-900 leading-none">{clientName || 'Valued Client'}</span>
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
                <div className="bg-[#f0f8fd] border border-[#d6ecfa] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#0f2a4a] uppercase tracking-wider flex items-center gap-1 border-b border-blue-200/60 pb-1 text-[10px]">
                    <span>👤</span> CLIENT PROFILE
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Age</span>
                    <span className="font-semibold text-slate-900">{age} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Height</span>
                    <span className="font-semibold text-slate-900">{heightCm} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Weight</span>
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

                <div className="bg-[#f0f8fd] border border-[#d6ecfa] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#0f2a4a] uppercase tracking-wider flex items-center gap-1 border-b border-blue-200/60 pb-1 text-[10px]">
                    <span>📊</span> BODY ANALYSIS
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">BMI</span>
                    <span className="font-semibold text-slate-900">{stats.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">BMR</span>
                    <span className="font-semibold text-slate-900">{stats.bmr} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TDEE</span>
                    <span className="font-semibold text-slate-900">{stats.tdee} kcal</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-600">Category</span>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold">
                      {stats.category}
                    </span>
                  </div>
                </div>

                <div className="bg-[#fef2f2] border border-[#fbd5d5] rounded-xl p-2.5 text-[10px] space-y-1.5">
                  <div className="font-black text-[#991b1b] uppercase tracking-wider flex items-center gap-1 border-b border-red-200 pb-1 text-[10px]">
                    <span>🎯</span> GOAL &amp; PLAN
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Target Weight</span>
                    <span className="font-semibold text-slate-900">{targetWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time Frame</span>
                    <span className="font-semibold text-slate-900">{timeFrameDays} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rate of Loss</span>
                    <span className="font-semibold text-slate-900">{stats.rateLossPerDay} kg/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Deficit</span>
                    <span className="font-black text-red-600">-{stats.calLossReqd} kcal</span>
                  </div>
                </div>
              </div>

              {/* ─── Activity & Medical Condition Banner ─── */}
              <div className="flex items-center gap-3 mt-2.5 text-[10px]">
                <div className="flex-1 bg-[#f4f7fa] border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span>🏋️</span>
                  <span className="text-slate-600">Physical Activity:</span>
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
                      meal.items.length === 0 ? (
                        <tr key={meal.title} className="border-b border-slate-100">
                          <td className="py-1.5 px-2.5 font-bold text-[#0f2a4a] bg-[#f8fbfe] border-r border-slate-200">
                            {meal.title}
                          </td>
                          <td colSpan={5} className="py-1.5 px-2 text-slate-400 italic">
                            No foods logged
                          </td>
                        </tr>
                      ) : (
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
                      )
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
                  {instructions.map((ins, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="shrink-0">{ins.icon}</span>
                      <span>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Footer Quote ─── */}
              <div className="mt-3 text-center pt-2 border-t border-slate-200">
                <p className="text-[10px] italic text-[#0f2a4a] font-medium tracking-wide">
                  &ldquo;{quote}&rdquo;
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

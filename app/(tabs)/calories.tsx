// @ts-nocheck
// calories page — lets users track daily food intake.
// supports barcode scanning, manual entry, a food library, and a plan/tdee fetcher.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useAuth } from "../../components/AuthContext";
type Mode = "scan" | "manual" | "library" | "plan";
type Meal = "breakfast" | "lunch" | "dinner" | "snack";

// constants 
const getFoodEmoji = (name: string = "") => {
  const n = name.toLowerCase();

  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("rice")) return "🍚";
  if (n.includes("egg")) return "🥚";
  if (n.includes("milk")) return "🥛";
  if (n.includes("coffee")) return "☕";
  if (n.includes("apple")) return "🍎";
  if (n.includes("banana")) return "🍌";
  if (n.includes("bread")) return "🍞";
  if (n.includes("pasta")) return "🍝";
  if (n.includes("salad")) return "🥗";
  if (n.includes("fish")) return "🐟";
  if (n.includes("beef") || n.includes("steak")) return "🥩";
  if (n.includes("fries")) return "🍟";
  if (n.includes("ice cream")) return "🍨";
  if (n.includes("cake")) return "🍰";
  if (n.includes("cookie")) return "🍪";

  return "🍽️"; // fallback
};
const COLORS = {
  primary: "#42564F",
};

// animated svg ring
// wraps a circle in an animated component so strokeDashoffset can be driven by Animated.Value

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({ progress }) => {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const animated = React.useRef(new Animated.Value(0)).current;

  // animate the ring fill whenever progress changes
  useEffect(() => {
    animated.stopAnimation(); // stop any in-flight animation before starting a new one

    Animated.timing(animated, {
      toValue: progress,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // maps 0–1 progress to stroke offset (full gap -> no gap)
  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={100} height={100}>
      {/* background track circle */}
      <Circle
        stroke="#E5E7EB"
        fill="none"
        cx="50"
        cy="50"
        r={radius}
        strokeWidth={strokeWidth}
      />

      {/* animated fill circle */}
      <AnimatedCircle
        stroke="#3B82F6"
        fill="none"
        cx="50"
        cy="50"
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

// component 
export default function CaloriesPage() {
  const [permission, requestPermission] = useCameraPermissions();

  // ui mode — controls which panel is visible: scan | manual | library | plan
  const [mode, setMode] = useState<Mode>("scan");

  // loading / scan state
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false); // prevents duplicate scans within 3s

  // date selection
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const getTodayIndex = () => 6;
  const [selectedIndex, setSelectedIndex] = useState(getTodayIndex());

  // food logs
  const [dailyLogs, setDailyLogs] = useState<any>({}); // keyed by "YYYY-MM-DD"
  const [meal, setMeal] = useState<Meal>("breakfast"); // which meal slot to add into
  const [foodHistory, setFoodHistory] = useState<any[]>([]); // saved food library

  // manual entry fields
  const [name, setName]           = useState("");
  const [brand, setBrand]         = useState("");
  const [calories, setCalories]   = useState("");
  const [carbs, setCarbs]         = useState("");
  const [protein, setProtein]     = useState("");
  const [fat, setFat]             = useState("");
  const [manualCalories, setManualCalories] = useState(false); // true when user typed calories directly

  // plan / tdee
  const { user } = useAuth();
  const username = user?.name || "guest";
  const [bmr, setBmr]             = useState<number | null>(null);
  const [tdee, setTdee]           = useState<number | null>(null);
  const [goal, setGoal]           = useState<"cut" | "maintain" | "bulk">("maintain");
  const [planUsername, setPlanUsername] = useState("");
  // streak — number of consecutive days with at least one food logged
  const [streak, setStreak] = useState(0);

  // on mount — request camera permission and load all stored data
  useEffect(() => {
    requestPermission();
    loadFoods();
    loadDailyLogs();
    loadTargets();
  }, [username]);
    //interactive chart
  useEffect(() => {
    setSelectedIndex(6);
  }, [selectedDate]);

  // recalculate streak any time the logs change
  useEffect(() => {
    calculateStreak();
  }, [dailyLogs]);

  //storage helpers
  // load cached bmr/tdee so the user doesn't have to re-fetch every session
  const loadTargets = async () => {
    const saved = await AsyncStorage.getItem("calorieTargets");
    if (saved) {
      const parsed = JSON.parse(saved);
      setBmr(parsed.bmr);
      setTdee(parsed.tdee);
    }
  };

  // load the saved food library (previously scanned or manually entered foods)
  const loadFoods = async () => {
    const data = await AsyncStorage.getItem("library");
    setFoodHistory(data ? JSON.parse(data) : []);
  };

  // add a food to the library and prepend it to the in-memory list
  const saveFood = async (food: any) => {
    const existing = await AsyncStorage.getItem("library");
    const foods = existing ? JSON.parse(existing) : [];
    foods.unshift(food);
    await AsyncStorage.setItem("library", JSON.stringify(foods));
    setFoodHistory(foods);
  };

  // load this user's daily logs (falls back to "guest" if no username set)
  const loadDailyLogs = async () => {
    const data = await AsyncStorage.getItem(`dailyLogs_${username || "guest"}`);
    if (data) {
      const parsed = JSON.parse(data);
  
      //
      Object.keys(parsed).forEach((date) => {
        parsed[date] = parsed[date].map((item: any) => ({
          ...item,
          id: item.id ?? Date.now() + Math.random(),
        }));
      });
  
      setDailyLogs(parsed);
    }
  };
  // persist daily logs to storage and sync state
  const saveDailyLogs = async (logs: any) => {
    setDailyLogs(logs);
    await AsyncStorage.setItem(
      `dailyLogs_${username || "guest"}`,
      JSON.stringify(logs)
    );
  };

  // api
  // fetch bmr/tdee from the backend by username
  const fetchCaloriesInfo = async () => {
    if (!planUsername.trim()) {
      Alert.alert("Missing info", "Please enter your username.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http:/:8080/api/getCaloriesInfo?username=${planUsername}`
      );
      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Not found", "No calorie data found.");
        return;
      }

      const newBmr  = Math.round(data.bmr);
      const newTdee = Math.round(data.tdee);

      setBmr(newBmr);
      setTdee(newTdee);

      // cache locally so the user doesn't need to re-fetch next session
      await AsyncStorage.setItem(
        "calorieTargets",
        JSON.stringify({ bmr: newBmr, tdee: newTdee })
      );
    } catch {
      Alert.alert("Server Error", "Could not connect.");
    } finally {
      setLoading(false);
    }
  };

  //food logic

  // add a food item to the selected date under the active meal slot
  const addToDay = (food: any) => {
    const updated = {
      ...dailyLogs,
      [selectedDate]: [
        {
          ...food,
          meal,
          id: food.id ?? Date.now() + Math.random(),
        },
        ...(dailyLogs[selectedDate] || []),
      ],
    };
  
    saveDailyLogs(updated);
  
    setTimeout(() => {
      setDailyLogs({ ...updated });
      calculateStreak();
    }, 50);
  };

  // remove a single food entry from the selected date by its id
  const removeFromDay = (id: number) => {
    const updated = {
      ...dailyLogs,
      [selectedDate]: (dailyLogs[selectedDate] || []).filter(
        (item: any) => item.id !== id
      ),
    };

    saveDailyLogs(updated);
  };

  // returns the log array for the currently selected date
  const getTodayLog = () => dailyLogs[selectedDate] || [];

  // auto-calculates calories from macros unless the user has typed calories manually
  const calculateCaloriesFromMacros = (p: string, c: string, f: string) => {
    if (manualCalories) return;

    const proteinVal = Number(p) || 0;
    const carbsVal   = Number(c) || 0;
    const fatVal     = Number(f) || 0;

    // protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g
    const total = proteinVal * 4 + carbsVal * 4 + fatVal * 9;

    setCalories(total ? String(total) : "");
  };

  // sums calories, protein, carbs, and fat across all items in today's log
  const getTotals = () => {
    return getTodayLog().reduce(
      (acc, item) => {
        acc.calories += Number(item.calories) || 0;
        acc.protein  += Number(item.protein)  || 0;
        acc.carbs    += Number(item.carbs)    || 0;
        acc.fat      += Number(item.fat)      || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // derives macro gram targets from tdee using a 30/40/30 (p/c/f) split
  const getMacroTargets = () => {
    if (!tdee) return { protein: 0, carbs: 0, fat: 0 };

    return {
      protein: Math.round((tdee * 0.3) / 4),
      carbs:   Math.round((tdee * 0.4) / 4),
      fat:     Math.round((tdee * 0.3) / 9),
    };
  };

  // adjusts tdee by goal: cut = -500 kcal, bulk = +300 kcal, maintain = no change
  const getTarget = () => {
    if (!tdee) return 0;
    if (goal === "cut")  return tdee - 500;
    if (goal === "bulk") return tdee + 300;
    return tdee;
  };

  // counts consecutive days (up to 30) that have at least one food logged
    const calculateStreak = () => {
    const dates = Object.keys(dailyLogs).sort().reverse(); // newest → oldest
  
    let count = 0;
  
    for (let i = 0; i < dates.length; i++) {
      const log = dailyLogs[dates[i]] || [];
  
      if (log.length > 0) {
        count++;
      } else {
        break;
      }
    }
  
    setStreak(count);
  };

  // builds the last 7 days of calorie totals for the mini bar chart
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const log = dailyLogs[key] || [];

      const cals = log.reduce(
        (sum, item) => sum + (Number(item.calories) || 0),
        0
      );

      days.push({
        date:     key.slice(5), // "MM-DD" for display
        calories: Number(cals.toFixed(1)),
      });
    }
    return days;
  };

  // derived values used in render

  const totals          = getTotals();
  const progressPercent = getTarget() > 0
    ? Math.min((totals.calories / getTarget()) * 100, 100)
    : 0;
  const weekly          = getLast7Days();
  const maxCal          = Math.max(...weekly.map((d) => d.calories), 1); // used to scale mini bars
  const macroTargets    = getMacroTargets();

  // barcode scanner 

  const handleScan = async ({ data }: any) => {
    if (scanned) return; // debounce — ignore scans within the cooldown window
    setScanned(true);

    try {
      setLoading(true);

      // fetch product info from open food facts by barcode
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await res.json();
      const p    = json.product;

      if (!p) return;

      const food = {
        name:     p.product_name || "Unknown",
        brand:    p.brands       || "",
        calories: p.nutriments?.["energy-kcal_100g"] || 0,
        protein:  p.nutriments?.proteins_100g        || 0,
        carbs:    p.nutriments?.carbohydrates_100g   || 0,
        fat:      p.nutriments?.fat_100g             || 0,
      };

      saveFood(food);
      addToDay(food);

      Alert.alert("Added", food.name);
    } catch {
      Alert.alert("Scan error");
    } finally {
      setLoading(false);
      setTimeout(() => setScanned(false), 3000); // allow next scan after 3s
    }
  };

  // step the selected date forward or backward by `offset` days
  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // round to 1 decimal, returns 0 for non-numbers
  const formatNum = (n: number) =>
    typeof n === "number" ? Number(n.toFixed(1)) : 0;

  if (!permission?.granted) {
    return <Text>No camera access</Text>;
  }

  //render 

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 14 }}>

          {/* header — title, streak badge */}
          <View style={styles.hero}>
            <Text style={styles.title}>Calories Tracker</Text>

            {/* streak display — only shown when the user has at least 1 logged day */}
            <View style={styles.streakBadge}>
        <Text style={styles.streakText}>
         🔥 {streak > 0 ? `${streak} day streak` : "Start your streak"}
      </Text>
      </View>

            <Image source={require("../../assets/panda.png")} style={styles.panda} />
          </View>

          {/* 7-day week strip — tap a day to change the selected date */}
          <View style={styles.weekRow}>
            {weekly.map((d, i) => {
              const isActive = i === selectedIndex;

              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSelectedIndex(i);
                  
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    d.setDate(d.getDate() - (6 - i));
                  
                    setSelectedDate(d.toISOString().split("T")[0]);
                  }}
                  style={[styles.dayPill, isActive && styles.activeDay]}
                >
                  <Text style={[styles.dayText, isActive && { color: "#fff" }]}>
                    {["S","M","T","W","T","F","S"][i]}
                  </Text>

                  <Text style={[styles.dayNumber, isActive && { color: "#fff" }]}>
                    {d.date.split("-")[1]}
                  </Text>

                  {/* mini calorie bar scaled to the week's max */}
                  <View style={styles.miniBar}>
                    <View
                      style={{
                        height: `${Math.min((d.calories / maxCal) * 100, 100)}%`,
                        backgroundColor: isActive ? "#fff" : COLORS.primary,
                        borderRadius: 4,
                        width: "100%",
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* calorie summary card with progress ring */}
          <View style={styles.calorieCard}>
            <Text style={styles.cardTitle}>Calories</Text>

            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <ProgressRing progress={Math.min(progressPercent / 100, 1)} />

              {/* percentage label centered over the ring */}
              <Text
                style={{
                  position: "absolute",
                  fontWeight: "900",
                  fontSize: 18,
                  color: "#111827",
                }}
              >
                {Math.round(progressPercent)}%
              </Text>
            </View>

            <Text style={styles.calorieBig}>{formatNum(totals.calories)} cal</Text>
            <Text style={styles.calorieSub}>/ {formatNum(getTarget())}</Text>
            <Text style={styles.remaining}>{formatNum(getTarget() - totals.calories)} left</Text>

            {tdee && (
              <Text style={{ marginTop: 6, color: "#6B7280" }}>TDEE: {tdee} kcal</Text>
            )}
          </View>

          {/* macro breakdown bars — carbs, fat, protein */}
          <View style={styles.macroCard}>
            {[
              { label: "Carbs",   value: totals.carbs,   goal: macroTargets.carbs,   color: "#10B981" },
              { label: "Fat",     value: totals.fat,     goal: macroTargets.fat,     color: "#7C3AED" },
              { label: "Protein", value: totals.protein, goal: macroTargets.protein, color: "#F59E0B" },
            ].map((m, i) => (
              <View key={i} style={{ flex: 1 }}>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <Text style={styles.macroValue}>{formatNum(m.value)}g / {m.goal}</Text>

                <View style={styles.macroBar}>
                  <View
                    style={{
                      height: "100%",
                      width: `${m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0}%`,
                      backgroundColor: m.color,
                      borderRadius: 10,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* food diary — one card per meal slot */}
          <Text style={styles.sectionTitle}>Diary</Text>
          {["breakfast", "lunch", "dinner", "snack"].map((m) => {
            const items = getTodayLog().filter((f) => f.meal === m);

            return (
              <View key={m} style={styles.mealCard}>
                <Text style={styles.mealTitle}>
                  {m === "breakfast" && "🍳 "}
                  {m === "lunch" && "🥪 "}
                  {m === "dinner" && "🍝 "}
                  {m === "snack" && "🍿 "}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>

                {items.length === 0 ? (
                  <Text style={styles.emptyMeal}>No foods added</Text>
                ) : (
                  items.map((item) => (
                    <View key={item.id ?? `${item.name}-${Math.random()}`} style={styles.foodRow}>
                      <View style={{ flex: 1 }}>
                      <Text style={styles.foodName}>
                        {getFoodEmoji(item.name)} {item.name}
                      </Text>
                        {/* show brand if it exists */}
                        {item.brand ? (
                          <Text style={styles.foodBrand}>{item.brand}</Text>
                        ) : null}
                      </View>

                      <Text style={styles.foodCalories}>{formatNum(item.calories)} cal</Text>

                      {/* delete button — removes this item from today's log */}
                      <Pressable
                        onPress={() => removeFromDay(item.id)}
                        style={styles.deleteBtn}
                        hitSlop={8}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  ))
                )}

                {/* tapping sets the active meal then opens the library */}
                <Pressable
                  style={styles.addMealBtn}
                  onPress={() => {
                    setMeal(m as Meal);
                    setMode("library");
                  }}
                >
                  <Text style={styles.addMealText}>➕ Add Food</Text>
                </Pressable>
              </View>
            );
          })}

          {/* mode switcher buttons */}
          <View style={styles.quickActions}>
            <Pressable style={styles.quickBtn} onPress={() => setMode("scan")}>
            <Text style={styles.quickText}>📷 Scan</Text>
            </Pressable>

            <Pressable style={styles.quickBtn} onPress={() => setMode("manual")}>
            <Text style={styles.quickText}>✍️ Manual</Text>
            </Pressable>

            <Pressable style={styles.quickBtn} onPress={() => setMode("library")}>
            <Text style={styles.quickText}>📚 Library</Text>
            </Pressable>

            <Pressable style={styles.quickBtn} onPress={() => setMode("plan")}>
            <Text style={styles.quickText}>📊 Plan</Text>
            </Pressable>
          </View>

          {/* scan mode — live camera with barcode handler */}
          {mode === "scan" && (
            <CameraView style={styles.camera} onBarcodeScanned={handleScan} />
          )}

          {/* manual entry — type name, brand, macros, and optionally override calories */}
          {mode === "manual" && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Food name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />

              {/* brand is now saved into the food object */}
              <TextInput
                style={styles.input}
                placeholder="Brand (optional)"
                placeholderTextColor="#9CA3AF"
                value={brand}
                onChangeText={setBrand}
              />

              <TextInput
                style={styles.input}
                placeholder="Calories"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={calories}
                onChangeText={(text) => {
                  setCalories(text);
                  setManualCalories(true); // lock calories field — no longer auto-calculated
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Protein (g)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={protein}
                onChangeText={(text) => {
                  setProtein(text);
                  calculateCaloriesFromMacros(text, carbs, fat);
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Carbs (g)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={carbs}
                onChangeText={(text) => {
                  setCarbs(text);
                  calculateCaloriesFromMacros(protein, text, fat);
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Fat (g)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={fat}
                onChangeText={(text) => {
                  setFat(text);
                  calculateCaloriesFromMacros(protein, carbs, text);
                }}
              />

              <Pressable
                style={styles.button}
                onPress={() => {
                  const food = {
                    name,
                    brand,       // brand is now included
                    calories: Number(calories),
                    protein:  Number(protein),
                    carbs:    Number(carbs),
                    fat:      Number(fat),
                  };
                  saveFood(food);
                  addToDay(food);

                  // clear all fields after saving
                  setName("");
                  setBrand("");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFat("");
                  setManualCalories(false); // reset the manual override flag
                }}
              >
                <Text style={styles.buttonText}>Save Food</Text>
              </Pressable>
            </View>
          )}

          {/* plan mode — fetch bmr/tdee from the backend by username */}
          {mode === "plan" && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={planUsername}
                onChangeText={setPlanUsername}
              />

              <Pressable style={styles.button} onPress={fetchCaloriesInfo}>
                <Text style={styles.buttonText}>Fetch Info</Text>
              </Pressable>

              {/* show results once loaded */}
              {(bmr !== null || tdee !== null) && (
                <View style={styles.infoCard}>
                  <Text>BMR: {bmr}</Text>
                  <Text>TDEE: {tdee}</Text>
                </View>
              )}
            </View>
          )}

          {/* library mode — list of previously saved foods with a quick-add button */}
          {mode === "library" && (
            <View>
              {foodHistory.map((item, i) => (
                <View key={i} style={styles.foodCard}>
                  <Text>
                   {getFoodEmoji(item.name)} {item.name}
                  </Text>
                  {item.brand ? (
                    <Text style={styles.foodBrand}>{item.brand}</Text>
                  ) : null}
                  <Pressable style={styles.button} onPress={() => addToDay(item)}>
                    <Text style={styles.buttonText}>Add to Today</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* global loading spinner */}
          <View>
            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

//  styles 
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#DDECC8",
  },

  // centered header with title, streak badge, and panda image
  hero: {
    alignItems: "center",
    paddingTop: 30,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  // streak badge shown below the title
  streakBadge: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },

  streakText: {
    fontWeight: "700",
    color: "#2F4F3E",
    fontSize: 14,
  },

  panda: {
    width: 120,
    height: 120,
    marginTop: 8,
  },

  // 7-day strip at the top
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  dayPill: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 3,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
  },

  activeDay: {
    backgroundColor: "#42564F",
  },

  dayText: {
    fontSize: 10,
    color: "#6B7280",
  },

  dayNumber: {
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },

  miniBar: {
    height: 30,
    width: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },

  // calorie summary card
  calorieCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },

  cardTitle: {
    color: "#6B7280",
    marginBottom: 4,
  },

  calorieBig: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },

  calorieSub: {
    color: "#6B7280",
    marginBottom: 10,
  },

  remaining: {
    marginTop: 6,
    color: "#6B7280",
  },

  // macro bars card
  macroCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  macroLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  macroValue: {
    fontWeight: "700",
    marginBottom: 6,
  },

  macroBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    color: "#111827",
  },

  // per-meal diary card
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  mealTitle: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
    color: "#2F4F3E",
  },

  emptyMeal: {
    color: "#6B7280",
    marginBottom: 6,
  },

  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  foodName: {
    color: "#2F4F3E",
    fontWeight: "600",
  },

  // brand displayed below food name in a lighter style
  foodBrand: {
    color: "#6B7280",
    fontSize: 12,
  },

  foodCalories: {
    fontWeight: "600",
    marginHorizontal: 8,
  },

  // small × button to delete a logged food item
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  deleteBtnText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 13,
  },

  addMealBtn: {
    marginTop: 6,
  },

  addMealText: {
    color: "#42564F",
    fontWeight: "700",
  },

  // mode switcher row
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  quickBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 14,
    alignItems: "center",
  },

  quickText: {
    fontWeight: "700",
    color: "#2F4F3E",
  },

  // shared input field style
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    color: "#111827",
  },

  // shared action button style
  button: {
    backgroundColor: "#42564F",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  camera: {
    height: 400,
    borderRadius: 16,
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  foodCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
});
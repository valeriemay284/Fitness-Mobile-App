// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "../constants/colors";
import formStyles from "../constants/formStyles";

import { useAuth } from "../components/AuthContext";

// Build options like 4'0" ... 7'11" with a single numeric value (total inches)
const buildHeightOptions = (minFeet = 4, maxFeet = 7) => {
  const opts = [];
  for (let f = minFeet; f <= maxFeet; f++) {
    for (let i = 0; i <= 11; i++) {
      opts.push({ label: `${f}'${i}"`, value: f * 12 + i });
    }
  }
  return opts;
};

export default function UserInfoScreen() {
  // get id(email) + username passed from Register.tsx
  const { id, username } = useLocalSearchParams();
  const { setUser } = useAuth() as any;
  const router = useRouter(); 

  // keep ONE numeric height value (total inches) for backend
  const [heightInInches, setHeightInInches] = useState(66); // default 5'6"
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("");
  const [description, setDescription] = useState(""); // NEW!!!!
  const [name, setName] = useState("")
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false)

  const heightOptions = useMemo(() => buildHeightOptions(4, 7), []);

  const REGISTER_URL = 'http://10.41.218.153:8080/api/signup';

  const onSaveInfo = async () => {
    console.log("onSaveInfo triggered");
    setServerMessage("");
    const w = parseFloat(weight);

    console.log("Form data before submit:", {
      id,
      username,
      heightInInches,
      weight,
      parsedWeight: w,
      sex,
      description,
      name,
    });
    
    if (!heightInInches || heightInInches <= 0) {
      setServerMessage("Please select a valid height.");
      return;
    }
    if (Number.isNaN(w) || w <= 0) {
      setServerMessage("Please enter a valid weight.");
      return;
    }
    if (!sex) {
      setServerMessage("Please select male or female.");
      return;
    }
    if (!description) {
      setServerMessage("Please pick a fitness goal.");
      return;
    }
    if (isSubmitting) return; 
    setSubmitting(true);
    try {
      console.log("Sending POST request to backend:", REGISTER_URL);

      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: String(id), 
          height: heightInInches, // single variable
          weight: w,
          sex,
          description, // NEW
          name, 
        })
      });

      console.log("Response status:", response.status);

      let data = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        setServerMessage(( data && data.message) || "User info failed to save");
        console.log("Response not OK:", data);
        return; 
      } 
        
      setServerMessage("User info saved");
      console.log("User info saved successfully!");

      // save user globally for logged-in session
      const user = {
        id: String(id), 
        username: String(username ?? ""),
        height: heightInInches, 
        weight: w, 
        sex, 
        description, 
        name,
      };

      console.log("Calling setUser with:", user);
      await setUser(user); 

      console.log("Routing to /Dashboard...");
      router.replace("/Dashboard");
      } catch (err) {
      setServerMessage(err instanceof Error ? err.message : "An unexpected error occurred");
      console.error("Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    heightInInches > 0 &&
    weight.trim() !== "" &&
    parseFloat(weight) > 0 &&
    (sex === "male" || sex === "female") &&
    description !== "" &&
    !isSubmitting;

  // fitness goals chips
  const goals = [
    { label: "Lose Weight", value: "lose_weight", icon: "flame-outline" },
    { label: "Build Muscle", value: "build_muscle", icon: "barbell-outline" },
    { label: "Stay Healthy", value: "stay_healthy", icon: "leaf-outline" },
    { label: "Endurance", value: "endurance", icon: "bicycle-outline" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1, padding: 16 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View>
          <Text style={styles.title}>Let's personalize your experience!</Text>
        </View>

        {/* Name */}
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="barbell-outline" size={18} color={colors.primaryDark} style={styles.labelIcon} />
            <Text style={styles.label}>Your Name</Text>
          </View>

          <View style={formStyles.inputWrap}>
            <Ionicons name="barbell-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
            />
          </View>
        </View>


        {/* Height */}
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="resize-outline" size={18} color={colors.primaryDark} style={styles.labelIcon} />
            <Text style={styles.label}>Height</Text>
          </View>

          {Platform.OS === "ios" ? (
            // iOS wheel picker (needs vertical room to scroll)
            <View style={styles.pickerIOSWrap} pointerEvents="auto">
              <Picker
                selectedValue={heightInInches}
                onValueChange={(v) => setHeightInInches(v)}
                itemStyle={styles.pickerIOSItem}
              >
                {heightOptions.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          ) : (
            // Android + Web: compact dropdown
            <View style={[formStyles.inputWrap, styles.dropWrap]}>
              <Ionicons name="resize-outline" size={18} style={styles.inputIcon} />
              <Picker
                selectedValue={heightInInches}
                onValueChange={(v) => setHeightInInches(v)}
                style={styles.dropPicker}
                dropdownIconColor={colors.primaryDark}
              >
                {heightOptions.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Weight */}
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="barbell-outline" size={18} color={colors.primaryDark} style={styles.labelIcon} />
            <Text style={styles.label}>Weight</Text>
          </View>

          <View style={formStyles.inputWrap}>
            <Ionicons name="barbell-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={formStyles.input}
              placeholder="e.g. 135 (lbs)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Sex */}
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="person-outline" size={18} color={colors.primaryDark} style={styles.labelIcon} />
            <Text style={styles.label}>Sex</Text>
          </View>

          {Platform.OS === "ios" ? (
            <View style={styles.pickerIOSWrap} pointerEvents="auto">
              <Picker
                selectedValue={sex}
                onValueChange={(v) => setSex(v)}
                itemStyle={styles.pickerIOSItem}
              >
                <Picker.Item label="Select..." value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>
          ) : (
            <View style={[formStyles.inputWrap, styles.dropWrap]}>
              <Ionicons name="person-outline" size={18} style={styles.inputIcon} />
              <Picker
                selectedValue={sex}
                onValueChange={(v) => setSex(v)}
                style={styles.dropPicker}
                dropdownIconColor={colors.primaryDark}
              >
                <Picker.Item label="Select..." value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
              </Picker>
            </View>
          )}
        </View>

        {/* Fitness goals (chips) */}
        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Ionicons name="flag-outline" size={18} color={colors.primaryDark} style={styles.labelIcon} />
            <Text style={styles.label}>What is your fitness goal?</Text>
          </View>

          <View style={styles.goalWrap}>
            {goals.map((g) => {
              const active = description === g.value;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => setDescription(g.value)}
                  style={[styles.goalChip, active && styles.goalChipActive]}
                >
                  <Ionicons
                    name={g.icon}
                    size={16}
                    color={active ? "#fff" : colors.primaryDark}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.goalText, active && { color: "#fff" }]}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {serverMessage ? <Text style={styles.message}>{serverMessage}</Text> : null}

        {/* Confirm button */}
        <Pressable
          onPress={onSaveInfo}
          disabled={!isValid}
          style={({ pressed }) => [
            formStyles.button,
            !isValid && formStyles.buttonDisabled,
            pressed && { transform: [{ scale: 0.995 }] },
          ]}
        >
          <Text style={formStyles.buttonText}>Confirm</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  title: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 25,
  },

  block: { gap: 5, marginBottom: 25 },

  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  labelIcon: { marginTop: 1 },
  label: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 16,
  },

  // Android + Web dropdown
  dropWrap: { zIndex: 10 },
  dropPicker: {
    height: Platform.select({ ios: 44, android: 52, web: 44 }),
    color: "#111827",
    width: "100%",
  },

  // iOS wheel container
  pickerIOSWrap: {
    borderWidth: 1,
    borderColor: "#E3E6EB",
    backgroundColor: "#FDFDFE",
    borderRadius: 14,
    overflow: "hidden",
    height: 100,
    justifyContent: "center",
  },
  pickerIOSItem: { color: colors.primaryDark, fontSize: 18 },

  // Icons inside inputWrap rows
  inputIcon: { position: "absolute", left: 14, top: 16, opacity: 0.8 },

  // Fitness goals chips
  goalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: colors.cardBg,
  },
  goalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalText: { fontSize: 14, color: colors.primaryDark, fontWeight: "600" },

  message: { textAlign: "center", marginVertical: 8, color: colors.primaryDark },
});


// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Progress from 'react-native-progress';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../components/AuthContext";

const MOCKUP_GREEN = "#63BC6F"; 

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
  const { id, username } = useLocalSearchParams();
  const { setUser } = useAuth() as any;
  const router = useRouter(); 

  const [heightInInches, setHeightInInches] = useState(66);
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState(""); 
  const [sex, setSex] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [goals, setGoals] = useState(""); 
  const [activity_Level, setActivityLevel] = useState("sedentary");
  const [step, setStep] = useState(1);

  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const heightOptions = useMemo(() => buildHeightOptions(4, 7), []);
  const REGISTER_URL = 'http:/:8080/api/signup';

  const isPage1Valid = name.trim() !== "" && age.trim() !== "" && sex !== "";
  const isPage2Valid = weight.trim() !== "" && targetWeight.trim() !== "" && activity_Level !== "";
  const isPage3Valid = goals !== "" && !isSubmitting;

  const onSaveInfo = async () => {
    Keyboard.dismiss();
    setServerMessage("");
    if (isSubmitting) return; 
    setSubmitting(true);

    try {
      const user = {
        id: String(id), 
        username,
        height: heightInInches,
        weight: parseFloat(weight),
        targetWeight: parseFloat(targetWeight),
        sex,
        goals,
        name,
        age: parseInt(age),
        activity_Level
      };
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (!response.ok) {
        setServerMessage("User info failed to save");
        return; 
      } 
      await setUser(user); 
      router.replace("/(tabs)");
    } catch (err) {
      setServerMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Progress Header */}
          <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <Pressable onPress={() => step > 1 && setStep(step - 1)} style={{ width: 30 }}>
                    {step > 1 && <Ionicons name="chevron-back" size={24} color="#1A261D" />}
                </Pressable>
                <View style={styles.progressWrapper}>
                    <Progress.Bar
                      progress={step / 3}
                      width={null}
                      color={MOCKUP_GREEN}
                      unfilledColor='#E3E6EB'
                      borderWidth={0}
                      height={8}
                      borderRadius={4}
                    />
                </View>
                <Text style={styles.stepText}>{step}/3</Text>
              </View>
          </View>

          <View style={styles.contentBody}>
            {step === 1 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Tell us about{"\n"}yourself!</Text>
                
                <View style={styles.inputCard}>
                  <Text style={styles.cardLabel}>Name</Text>
                  <TextInput
                      style={styles.cardInput}
                      placeholder="Enter name"
                      placeholderTextColor="#BDC3C7"
                      value={name}
                      onChangeText={setName}
                      returnKeyType="done"
                  />
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.cardLabel}>Age</Text>
                  <TextInput
                      style={styles.cardInput}
                      placeholder="25"
                      placeholderTextColor="#BDC3C7"
                      keyboardType="number-pad"
                      value={age}
                      onChangeText={setAge}
                      returnKeyType="done"
                  />
                </View>

                <View style={styles.wheelBlock}>
                  <Text style={styles.cardLabel}>Biological Sex</Text>
                  <View style={styles.wheelContainer}>
                    <Picker
                      selectedValue={sex}
                      onValueChange={(v) => { Keyboard.dismiss(); setSex(v); }}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Select..." value="" />
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                    </Picker>
                  </View>
                </View>

                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => { Keyboard.dismiss(); setStep(2); }}
                  disabled={!isPage1Valid}
                  style={[styles.primaryButton, !isPage1Valid && styles.buttonDisabled]}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </Pressable>
              </View>
            )}

            {step === 2 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Nice to meet you, {name}!</Text>
                <Text style={styles.subtitle}>Help me personalize your experience</Text>

                <View style={styles.wheelBlock}>
                  <Text style={styles.cardLabel}>Height</Text>
                  <View style={styles.wheelContainer}>
                    <Picker
                      selectedValue={heightInInches}
                      onValueChange={(v) => { Keyboard.dismiss(); setHeightInInches(v); }}
                      itemStyle={styles.pickerItem}
                    >
                      {heightOptions.map((opt) => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.cardLabel}>Current Weight</Text>
                  <TextInput
                      style={styles.cardInput}
                      placeholder="lbs"
                      placeholderTextColor="#BDC3C7"
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
                  />
                </View>

                <View style={styles.inputCard}>
                  <View>
                    <Text style={styles.cardLabel}>Goal Weight</Text>
                    <Pressable onPress={() => { Keyboard.dismiss(); setTargetWeight(weight); }}>
                      <Text style={styles.maintainLabel}>
                        {weight && targetWeight === weight ? "✓ Maintaining!" : "I'm staying here"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                      style={styles.cardInput}
                      placeholder="lbs"
                      placeholderTextColor="#BDC3C7"
                      keyboardType="decimal-pad"
                      value={targetWeight}
                      onChangeText={(t) => setTargetWeight(t.replace(/[^0-9.]/g, ""))}
                  />
                </View>

                <Text style={styles.sectionTitle}>How much do you move?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityScroll}>
                  {[
                    { id: 'sedentary', label: 'Sedentary', sub: 'Little exercise', icon: 'bed-outline' },
                    { id: 'lightly', label: 'Lightly', sub: '1-2 days / wk', icon: 'walk-outline' },
                    { id: 'moderate', label: 'Moderate', sub: '3-5 days / wk', icon: 'fitness-outline' },
                    { id: 'active', label: 'Active', sub: '6-7 days / wk', icon: 'bicycle-outline' },
                  ].map((lvl) => (
                    <Pressable
                      key={lvl.id}
                      onPress={() => { Keyboard.dismiss(); setActivityLevel(lvl.id); }}
                      style={[styles.levelCard, activity_Level === lvl.id && styles.levelCardActive]}
                    >
                      <Ionicons name={lvl.icon} size={26} color={activity_Level === lvl.id ? "#fff" : "#1A261D"} />
                      <Text style={[styles.levelCardText, activity_Level === lvl.id && { color: '#fff' }]}>{lvl.label}</Text>
                      <Text style={[styles.levelCardSub, activity_Level === lvl.id && { color: 'rgba(255,255,255,0.8)' }]}>{lvl.sub}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => { Keyboard.dismiss(); setStep(3); }}
                  disabled={!isPage2Valid}
                  style={[styles.primaryButton, !isPage2Valid && styles.buttonDisabled]}
                >
                  <Text style={styles.buttonText}>Almost there</Text>
                </Pressable>
              </View>
            )}

            {step === 3 && (
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>The final step!</Text>
                <Text style={styles.subtitle}>What should we focus on first?</Text>

                <View style={styles.goalWrap}>
                  {[
                    { label: "Lose Weight", value: "lose_weight", icon: "flame-outline", desc: "Burn fat and get leaner" },
                    { label: "Build Muscle", value: "build_muscle", icon: "barbell-outline", desc: "Gain strength and mass" },
                    { label: "Improve Endurance", value: "endurance", icon: "heart-outline", desc: "Boost your stamina and energy" }, // NEW
                    { label: "Stay Healthy", value: "stay_healthy", icon: "leaf-outline", desc: "Maintain energy and health" },
                  ].map((g) => (
                    <Pressable
                      key={g.value}
                      onPress={() => { Keyboard.dismiss(); setGoals(g.value); }}
                      style={[styles.goalChip, goals === g.value && styles.goalChipActive]}
                    >
                      <Ionicons name={g.icon} size={28} color={goals === g.value ? "#fff" : "#1A261D"} style={{ marginRight: 15 }} />
                      <View>
                          <Text style={[styles.goalText, goals === g.value && { color: "#fff" }]}>{g.label}</Text>
                          <Text style={[styles.goalDesc, goals === g.value && { color: "#E3E6EB" }]}>{g.desc}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                {serverMessage ? <Text style={styles.message}>{serverMessage}</Text> : null}

                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={onSaveInfo}
                  disabled={!isPage3Valid}
                  style={[styles.primaryButton, !isPage3Valid && styles.buttonDisabled, { marginBottom: 40 }]}
                >
                  <Text style={styles.buttonText}>{isSubmitting ? "Saving..." : "Finish"}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F5F3' },
  headerContainer: { paddingHorizontal: 20, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressWrapper: { flex: 1, marginHorizontal: 20 },
  stepText: { fontSize: 14, fontWeight: '700', color: '#1A261D', opacity: 0.5 },
  contentBody: { flex: 1, paddingHorizontal: 25 },
  title: { fontSize: 30, fontWeight: '800', color: '#1A261D', marginTop: 25, marginBottom:10 },
  subtitle: { fontSize: 16, color: '#7F8C8D', marginBottom: 15, fontWeight: '500' },
  inputCard: { 
    backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 15, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, 
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: {width:0, height:4} 
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1A261D' },
  maintainLabel: { fontSize: 12, color: MOCKUP_GREEN, fontWeight: '800', marginTop: 4 },
  cardInput: { textAlign: 'right', fontWeight: '600', color: MOCKUP_GREEN, fontSize: 16, flex: 1, marginLeft: 10 },
  wheelBlock: { marginBottom: 20 },
  wheelContainer: { backgroundColor: 'white', borderRadius: 24, marginTop: 10, height: 90, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#E8E8E8' },
  pickerItem: { fontSize: 18, color: '#1A261D' },
  sectionTitle: { fontWeight: '800', fontSize: 18, color: '#1A261D', marginTop: 10, marginBottom: 15 },
  activityScroll: { gap: 12, paddingRight: 20 },
  levelCard: { width: 130, height: 115, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  levelCardActive: { backgroundColor: MOCKUP_GREEN, borderColor: MOCKUP_GREEN },
  levelCardText: { marginTop: 8, fontSize: 14, fontWeight: '800', textAlign: 'center', color: '#1A261D' },
  levelCardSub: { marginTop: 2, fontSize: 11, fontWeight: '500', textAlign: 'center', color: '#95A5A6' },
  goalWrap: { gap: 15 },
  goalChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 18 },
  goalChipActive: { backgroundColor: MOCKUP_GREEN, borderColor: MOCKUP_GREEN },
  goalText: { fontSize: 18, fontWeight: "700", color: "#1A261D" },
  goalDesc: { fontSize: 13, color: "#95A5A6", marginTop: 2 },
  primaryButton: { 
    backgroundColor: MOCKUP_GREEN, paddingVertical: 20, borderRadius: 22, alignItems: 'center', 
    shadowColor: MOCKUP_GREEN, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width:0, height:5},
    marginBottom: 20
  },
  buttonDisabled: { opacity: 0.5, backgroundColor: '#BDC3C7', shadowOpacity: 0 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 18 },
  message: { color: '#EF4444', textAlign: 'center', marginTop: 10, fontWeight: '600' }
});
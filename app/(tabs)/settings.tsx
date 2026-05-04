/**
 * Module: Settings Screen
 * Date: 2026-04-17
 * Programmer: Group 5
 *
 * Description:
 *   The Settings screen allows authenticated users to view and update
 *   personal details, physical metrics, and fitness goals. It manages
 *   edit state for three sections and persists updates through API calls.
 *
 * Important data structures:
 *   - user: authenticated user profile object from AuthContext
 *   - heightOptions: array of { label, value } entries for height selection
 *   - edit state values: local state values used for inline forms
 *
 * Algorithm note:
 *   The module uses React hooks and memoization (useMemo) to build a stable
 *   height dropdown list only once. This avoids recomputing 48 height options
 *   on every render, which is appropriate for a settings screen.
 */
// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/AuthContext";
import colors from "../../constants/colors";

export default function Settings() {
  const { user, signOut, setUser } = useAuth() as any;
  const router = useRouter();

  // Edit modal state
  const [isEditingPhysical, setIsEditingPhysical] = useState(false);
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || "66");
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || "");
  const [editTargetWeight, setEditTargetWeight] = useState(user?.targetWeight?.toString() || "");
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAge, setEditAge] = useState(user?.age?.toString() || "");
  const [editSex, setEditSex] = useState(user?.sex || "");
  
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editGoals, setEditGoals] = useState(user?.goals || "");
  const [editActivityLevel, setEditActivityLevel] = useState(user?.activity_Level || "sedentary");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [editSection, setEditSection] = useState("");
  const [profilePictureUri, setProfilePictureUri] = useState(user?.profilePictureUri || "");

  const heightOptions = useMemo(() => {
    const opts = [];
    for (let f = 4; f <= 7; f++) {
      for (let i = 0; i <= 11; i++) {
        opts.push({ label: `${f}'${i}"`, value: (f * 12 + i).toString() });
      }
    }
    return opts;
  }, []);

  /**
   * Convert height in inches to a human-readable feet/inches string.
   * @param inches Number of inches.
   * @returns Formatted height string like "5'11\"".
   */
  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  // Format activity level for display
  /**
   * Map a stored activity level code to a user-friendly label.
   * @param level Storage value like "sedentary", "lightly", "moderate", or "active".
   * @returns A descriptive activity level string for display.
   */
  const formatActivityLevel = (level: string) => {
    const levels = {
      sedentary: "Sedentary (Little exercise)",
      lightly: "Lightly Active (1-2 days/week)",
      moderate: "Moderately Active (3-5 days/week)",
      active: "Very Active (6-7 days/week)",
    };
    return levels[level as keyof typeof levels] || level;
  };

  /**
   * Map a stored fitness goal code to a readable label.
   * @param goal Storage value like "lose_weight" or "build_muscle".
   * @returns A descriptive goal string for display.
   */
  const formatGoals = (goal: string) => {
    const goals = {
      lose_weight: "Lose Weight",
      build_muscle: "Build Muscle",
      endurance: "Improve Endurance",
      stay_healthy: "Stay Healthy",
    };
    return goals[goal as keyof typeof goals] || goal;
  };

  /**
   * Ask the user to confirm sign out and navigate to login on approval.
   * No inputs. Uses AuthContext signOut and Expo Router replace.
   */
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace("/login");
          },
        },
      ]
    );
  };

  /**
   * Open the physical stats edit modal and initialize fields from user state.
   */
  const openEditPhysical = () => {
    setEditHeight(user?.height?.toString() || "66");
    setEditWeight(user?.weight?.toString() || "");
    setEditTargetWeight(user?.targetWeight?.toString() || "");
    setServerMessage("");
    setIsEditingPhysical(true);
  };

  /**
   * Close the physical stats modal and clear any status message.
   */
  const closeEditPhysical = () => {
    setIsEditingPhysical(false);
    setServerMessage("");
  };

  /**
   * Validate and persist updated physical stats to the backend.
   * @returns Promise<void>
   */
  const savePhysicalStats = async () => {
    if (!editHeight || !editWeight || !editTargetWeight) {
      setServerMessage("Please fill in all fields");
      return;
    }

    const weight = parseFloat(editWeight);
    const targetWeight = parseFloat(editTargetWeight);

    if (isNaN(weight) || isNaN(targetWeight) || weight <= 0 || targetWeight <= 0) {
      setServerMessage("Please enter valid numbers for weight");
      return;
    }

    setIsSubmitting(true);
    setServerMessage("");

    try {
      const updatedUser = {
        ...user,
        height: parseInt(editHeight),
        weight,
        targetWeight,
      };

      // Assuming an update endpoint exists, or use the same endpoint with a different method
      const response = await fetch("http://192.168.1.20:8080/api/updatePhysicalStats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          height: parseInt(editHeight),
          weight,
          targetWeight,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setServerMessage(data?.message || "Failed to update physical stats");
        return;
      }

      await setUser(updatedUser);
      closeEditPhysical();
      Alert.alert("Success", "Physical stats updated successfully!");
    } catch (err) {
      console.error("Error updating physical stats:", err);
      setServerMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open the personal details edit modal and populate form fields.
   */
  const openEditPersonal = () => {
    setEditName(user?.name || "");
    setEditAge(user?.age?.toString() || "");
    setEditSex(user?.sex || "");
    setServerMessage("");
    setEditSection("personal");
    setIsEditingPersonal(true);
  };

  /**
   * Close the personal info modal and reset the edit section state.
   */
  const closeEditPersonal = () => {
    setIsEditingPersonal(false);
    setServerMessage("");
    setEditSection("");
  };

  /**
   * Validate and persist the user's personal profile updates to the backend.
   * @returns Promise<void>
   */
  const savePersonalInfo = async () => {
    if (!editName.trim() || !editAge.trim() || !editSex) {
      setServerMessage("Please fill in all fields");
      return;
    }

    const age = parseInt(editAge);
    if (isNaN(age) || age <= 0 || age > 150) {
      setServerMessage("Please enter a valid age");
      return;
    }

    setIsSubmitting(true);
    setServerMessage("");

    try {
      const updatedUser = {
        ...user,
        name: editName.trim(),
        age,
        sex: editSex,
      };

      const response = await fetch("http://192.168.1.20:8080/api/updatePersonalInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: editName.trim(),
          age,
          sex: editSex,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setServerMessage(data?.message || "Failed to update personal info");
        return;
      }

      await setUser(updatedUser);
      closeEditPersonal();
      Alert.alert("Success", "Personal info updated successfully!");
    } catch (err) {
      console.error("Error updating personal info:", err);
      setServerMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open the fitness goals edit modal and initialize goal fields from user state.
   */
  const openEditGoals = () => {
    setEditGoals(user?.goals || "");
    setEditActivityLevel(user?.activity_Level || "sedentary");
    setServerMessage("");
    setEditSection("goals");
    setIsEditingGoals(true);
  };

  /**
   * Close the goals edit modal and reset the active edit section.
   */
  const closeEditGoals = () => {
    setIsEditingGoals(false);
    setServerMessage("");
    setEditSection("");
  };

  /**
   * Validate and persist updated fitness goals and activity level to the backend.
   * @returns Promise<void>
   */
  const saveGoalsInfo = async () => {
    if (!editGoals || !editActivityLevel) {
      setServerMessage("Please select both goal and activity level");
      return;
    }

    setIsSubmitting(true);
    setServerMessage("");

    try {
      const updatedUser = {
        ...user,
        goals: editGoals,
        activity_Level: editActivityLevel,
      };

      const response = await fetch("http://192.168.1.20:8080/api/updateGoals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          goals: editGoals,
          activity_Level: editActivityLevel,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setServerMessage(data?.message || "Failed to update goals");
        return;
      }

      await setUser(updatedUser);
      closeEditGoals();
      Alert.alert("Success", "Goals updated successfully!");
    } catch (err) {
      console.error("Error updating goals:", err);
      setServerMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No user data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Placeholder */}
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePicturePlaceholder}>
            <Ionicons name="camera-outline" size={48} color={colors.primary} />
            <Text style={styles.placeholderText}>Add Photo</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Your fitness journey stats</Text>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Personal Information</Text>
            <Pressable
              style={styles.editButton}
              onPress={openEditPersonal}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Name</Text>
            <Text style={styles.statValue}>{user.name || "Not set"}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{user.age || "Not set"} years</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Biological Sex</Text>
            <Text style={styles.statValue}>
              {user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : "Not set"}
            </Text>
          </View>
        </View>

        {/* Physical Stats Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="body-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Physical Stats</Text>
            <Pressable
              style={styles.editButton}
              onPress={openEditPhysical}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>
              {user.height ? formatHeight(user.height) : "Not set"}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Weight</Text>
            <Text style={styles.statValue}>
              {user.weight ? `${user.weight} lbs` : "Not set"}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Target Weight</Text>
            <Text style={styles.statValue}>
              {user.targetWeight ? `${user.targetWeight} lbs` : "Not set"}
            </Text>
          </View>
        </View>

        {/* Fitness Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Fitness Goals</Text>
            <Pressable
              style={styles.editButton}
              onPress={openEditGoals}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Primary Goal</Text>
            <Text style={styles.statValue}>
              {user.goals ? formatGoals(user.goals) : "Not set"}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Activity Level</Text>
            <Text style={styles.statValue}>
              {user.activity_Level ? formatActivityLevel(user.activity_Level) : "Not set"}
            </Text>
          </View>
        </View>

        {/* Account Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Account Information</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Username</Text>
            <Text style={styles.statValue}>{user.username || "Not set"}</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Physical Stats Modal */}
      <Modal
        visible={isEditingPhysical}
        transparent
        animationType="slide"
        onRequestClose={closeEditPhysical}
      >
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={closeEditPhysical}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Edit Physical Stats</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Error Message */}
            {serverMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverMessage}</Text>
              </View>
            )}

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Height Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Height</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editHeight}
                    onValueChange={(value) => setEditHeight(value)}
                    style={styles.picker}
                  >
                    {heightOptions.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Current Weight Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current weight"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={editWeight}
                  onChangeText={setEditWeight}
                  editable={!isSubmitting}
                />
              </View>

              {/* Target Weight Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter target weight"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={editTargetWeight}
                  onChangeText={setEditTargetWeight}
                  editable={!isSubmitting}
                />
              </View>

              {/* Save Button */}
              <Pressable
                style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
                onPress={savePhysicalStats}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Personal Info Modal */}
      <Modal
        visible={isEditingPersonal}
        transparent
        animationType="slide"
        onRequestClose={closeEditPersonal}
      >
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={closeEditPersonal}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Edit Personal Information</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Error Message */}
            {serverMessage && editSection === "personal" && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverMessage}</Text>
              </View>
            )}

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={editName}
                  onChangeText={setEditName}
                  editable={!isSubmitting}
                />
              </View>

              {/* Age Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={editAge}
                  onChangeText={setEditAge}
                  editable={!isSubmitting}
                />
              </View>

              {/* Sex Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Biological Sex</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editSex}
                    onValueChange={(value) => setEditSex(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select sex" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>

              {/* Save Button */}
              <Pressable
                style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
                onPress={savePersonalInfo}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Fitness Goals Modal */}
      <Modal
        visible={isEditingGoals}
        transparent
        animationType="slide"
        onRequestClose={closeEditGoals}
      >
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={closeEditGoals}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Edit Fitness Goals</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Error Message */}
            {serverMessage && editSection === "goals" && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverMessage}</Text>
              </View>
            )}

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Primary Goal Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Primary Goal</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editGoals}
                    onValueChange={(value) => setEditGoals(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your goal" value="" />
                    <Picker.Item label="Lose Weight" value="lose_weight" />
                    <Picker.Item label="Build Muscle" value="build_muscle" />
                    <Picker.Item label="Improve Endurance" value="endurance" />
                    <Picker.Item label="Stay Healthy" value="stay_healthy" />
                  </Picker>
                </View>
              </View>

              {/* Activity Level Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Level</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editActivityLevel}
                    onValueChange={(value) => setEditActivityLevel(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Sedentary (Little exercise)" value="sedentary" />
                    <Picker.Item label="Lightly Active (1-2 days/week)" value="lightly" />
                    <Picker.Item label="Moderately Active (3-5 days/week)" value="moderate" />
                    <Picker.Item label="Very Active (6-7 days/week)" value="active" />
                  </Picker>
                </View>
              </View>

              {/* Save Button */}
              <Pressable
                style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
                onPress={saveGoalsInfo}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statLabel: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#DC3545",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: colors.textMuted,
    textAlign: "center",
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  errorBanner: {
    backgroundColor: "#FFE5E5",
    borderLeftWidth: 4,
    borderLeftColor: "#DC3545",
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
  },
  formContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: "#FAFAFA",
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  
  picker: {
    height: 50,
    width: "100%",
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  editButton: {
    marginLeft: "auto",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
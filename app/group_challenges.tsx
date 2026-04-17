// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pedometer } from "expo-sensors";
import { useAuth } from "../components/AuthContext";

const API_BASE_URL = "http://10.41.218.23:8080/api";

const GROUP_CHALLENGE = {
  id: "group-steps-100k",
  title: "100,000 Step Community Challenge",
  subtitle: "Everyone who joins contributes their tracked steps.",
  goal: 100000,
  description:
    "Join the community challenge and help everyone reach 100,000 total steps. Your contribution is tracked from your device pedometer after you join.",
};

const STORAGE_KEYS = {
  joined: "group_challenge_joined",
  baselineSteps: "group_challenge_baseline_steps",
  lastSyncedContribution: "group_challenge_last_synced_contribution",
  totalGroupSteps: "group_challenge_total_steps_backend_cache",
  participantCount: "group_challenge_participants_backend_cache",
  lastUpdated: "group_challenge_last_updated_backend_cache",
};

export default function GroupChallengesScreen() {
  const { user } = useAuth();

  const username = useMemo(() => {
    if (!user) return "";
    return user.username || user.userName || user.name || user.email || "";
  }, [user]);

  const [isJoined, setIsJoined] = useState(false);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [baselineSteps, setBaselineSteps] = useState(0);
  const [myContribution, setMyContribution] = useState(0);

  const [groupTotalSteps, setGroupTotalSteps] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const pedometerSub = useRef(null);

  useEffect(() => {
    loadStoredState();
  }, []);

  useEffect(() => {
    setupPedometer();

    return () => {
      pedometerSub.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!isJoined) {
      setMyContribution(0);
      return;
    }

    const contribution = Math.max(todaySteps - baselineSteps, 0);
    setMyContribution(contribution);
  }, [todaySteps, baselineSteps, isJoined]);

  useEffect(() => {
    if (!username) return;

    fetchGroupChallengeProgress();

    const interval = setInterval(() => {
      syncGroupProgress(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [username, isJoined, myContribution]);

  const loadStoredState = async () => {
    try {
      const userKey = username || "guest";

      const [
        storedJoined,
        storedBaseline,
        storedLastSynced,
        storedGroupTotal,
        storedParticipants,
        storedLastUpdated,
      ] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.joined}_${userKey}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.baselineSteps}_${userKey}`),
        AsyncStorage.getItem(
          `${STORAGE_KEYS.lastSyncedContribution}_${userKey}`
        ),
        AsyncStorage.getItem(STORAGE_KEYS.totalGroupSteps),
        AsyncStorage.getItem(STORAGE_KEYS.participantCount),
        AsyncStorage.getItem(STORAGE_KEYS.lastUpdated),
      ]);

      if (storedJoined) {
        setIsJoined(storedJoined === "true");
      }

      if (storedBaseline) {
        setBaselineSteps(Number(storedBaseline));
      }

      if (storedGroupTotal) {
        setGroupTotalSteps(Number(storedGroupTotal));
      }

      if (storedParticipants) {
        setParticipantCount(Number(storedParticipants));
      }

      if (storedLastUpdated) {
        setLastUpdated(storedLastUpdated);
      }
    } catch (error) {
      console.log("Error loading group challenge state:", error);
    }
  };

  const setupPedometer = async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      setPedometerAvailable(available);

      if (!available) return;

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const result = await Pedometer.getStepCountAsync(start, new Date());
      setTodaySteps(result.steps || 0);

      pedometerSub.current = Pedometer.watchStepCount((result) => {
        setTodaySteps((prev) => prev + (result.steps || 0));
      });
    } catch (error) {
      console.log("Pedometer error:", error);
      setPedometerAvailable(false);
    }
  };

  const getUserKey = () => username || "guest";

  const updateLastUpdatedTime = async () => {
    const now = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setLastUpdated(now);
    await AsyncStorage.setItem(STORAGE_KEYS.lastUpdated, now);
  };

  const cacheGroupProgress = async (totalSteps, participants) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.totalGroupSteps, String(totalSteps)),
        AsyncStorage.setItem(
          STORAGE_KEYS.participantCount,
          String(participants)
        ),
      ]);
    } catch (error) {
      console.log("Error caching group progress:", error);
    }
  };

  const fetchGroupChallengeProgress = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/groupChallenge/progress?groupChallengeId=${encodeURIComponent(
          GROUP_CHALLENGE.id
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch group challenge progress");
      }

      const data = await response.json();

      const totalSteps = Number(data.totalSteps || 0);
      const participants = Number(data.participantCount || 0);

      setGroupTotalSteps(totalSteps);
      setParticipantCount(participants);

      await cacheGroupProgress(totalSteps, participants);
      await updateLastUpdatedTime();
    } catch (error) {
      console.log("fetchGroupChallengeProgress error:", error);
    }
  };

  const joinGroupChallenge = async () => {
    const payload = {
      username: String(username),
      groupChallengeId: GROUP_CHALLENGE.id,
    };

    const response = await fetch(`${API_BASE_URL}/groupChallenge/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to join group challenge");
    }

    return response.json().catch(() => null);
  };

  const syncStepsToBackend = async (newContributionToAdd) => {
    const payload = {
      username: String(username),
      groupChallengeId: GROUP_CHALLENGE.id,
      steps: Number(newContributionToAdd),
      totalContribution: Number(myContribution),
    };

    const response = await fetch(`${API_BASE_URL}/groupChallenge/updateSteps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to sync group steps");
    }

    return response.json().catch(() => null);
  };

  const handleJoin = async () => {
    if (!username) {
      Alert.alert("Error", "No user found.");
      return;
    }

    if (!pedometerAvailable) {
      Alert.alert(
        "Pedometer unavailable",
        "This group challenge needs step tracking from your device."
      );
      return;
    }

    try {
      const userKey = getUserKey();

      await joinGroupChallenge();

      setIsJoined(true);
      setBaselineSteps(todaySteps);

      await Promise.all([
        AsyncStorage.setItem(`${STORAGE_KEYS.joined}_${userKey}`, "true"),
        AsyncStorage.setItem(
          `${STORAGE_KEYS.baselineSteps}_${userKey}`,
          String(todaySteps)
        ),
        AsyncStorage.setItem(
          `${STORAGE_KEYS.lastSyncedContribution}_${userKey}`,
          "0"
        ),
      ]);

      await fetchGroupChallengeProgress();

      Alert.alert(
        "Joined!",
        "Your steps from this point forward will count toward the 100,000 step group challenge."
      );
    } catch (error) {
      console.log("Join error:", error);
      Alert.alert("Error", "Could not join the group challenge.");
    }
  };

  const syncGroupProgress = async (manual = true) => {
    try {
      if (manual) setRefreshing(true);

      if (!username) {
        throw new Error("No user found.");
      }

      const userKey = getUserKey();

      const storedLastSynced = await AsyncStorage.getItem(
        `${STORAGE_KEYS.lastSyncedContribution}_${userKey}`
      );

      const lastSyncedContribution = storedLastSynced
        ? Number(storedLastSynced)
        : 0;

      const newContributionToAdd = Math.max(
        myContribution - lastSyncedContribution,
        0
      );

      if (isJoined && newContributionToAdd > 0) {
        const syncResponse = await syncStepsToBackend(newContributionToAdd);

        if (syncResponse) {
          const totalSteps = Number(syncResponse.totalSteps || groupTotalSteps);
          const participants = Number(
            syncResponse.participantCount || participantCount
          );

          setGroupTotalSteps(totalSteps);
          setParticipantCount(participants);

          await cacheGroupProgress(totalSteps, participants);
        }

        await AsyncStorage.setItem(
          `${STORAGE_KEYS.lastSyncedContribution}_${userKey}`,
          String(myContribution)
        );
      }

      await fetchGroupChallengeProgress();
    } catch (error) {
      console.log("Sync error:", error);
      if (manual) {
        Alert.alert("Error", "Could not sync group challenge progress.");
      }
    } finally {
      if (manual) setRefreshing(false);
    }
  };

  const progressPercent = Math.min(groupTotalSteps / GROUP_CHALLENGE.goal, 1);
  const stepsRemaining = Math.max(GROUP_CHALLENGE.goal - groupTotalSteps, 0);
  const challengeComplete = groupTotalSteps >= GROUP_CHALLENGE.goal;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#DDECC8" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => syncGroupProgress(true)}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Group Challenge</Text>
          <Text style={styles.heroTitle}>{GROUP_CHALLENGE.title}</Text>
          <Text style={styles.heroSubtitle}>{GROUP_CHALLENGE.description}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isJoined ? "Joined" : "Not Joined"}
              </Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>Refreshes every 5 min</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shared Progress</Text>

          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressMainText}>
              {groupTotalSteps.toLocaleString()} /{" "}
              {GROUP_CHALLENGE.goal.toLocaleString()} steps
            </Text>
            <Text style={styles.progressPercentText}>
              {Math.round(progressPercent * 100)}%
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.progressSubText}>
            {challengeComplete
              ? "Goal reached! The community completed the challenge."
              : `${stepsRemaining.toLocaleString()} steps remaining`}
          </Text>

          <Text style={styles.lastUpdated}>
            Last updated: {lastUpdated || "--"}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Participants</Text>
              <Text style={styles.infoValue}>
                {participantCount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Goal</Text>
              <Text style={styles.infoValue}>
                {GROUP_CHALLENGE.goal.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Contribution</Text>

          <View style={styles.infoBoxLarge}>
            <Text style={styles.infoLabel}>Tracked steps after joining</Text>
            <Text style={styles.contributionValue}>
              {myContribution.toLocaleString()}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Today’s Steps</Text>
              <Text style={styles.infoValue}>{todaySteps.toLocaleString()}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Baseline</Text>
              <Text style={styles.infoValue}>
                {baselineSteps.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Once you join, only the steps you take after joining are counted for
            your contribution. Every 5 minutes, the app sends only your new
            unsynced steps to the backend and then refreshes the shared total.
          </Text>

          {!isJoined ? (
            <Pressable style={styles.primaryButton} onPress={handleJoin}>
              <Text style={styles.primaryButtonText}>Join Challenge</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.primaryButton}
              onPress={() => syncGroupProgress(true)}
            >
              <Text style={styles.primaryButtonText}>Sync My Steps</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F6E7",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },

  hero: {
    backgroundColor: "#DDECC8",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },

  heroEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B6354",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 15,
    color: "#4B6354",
    lineHeight: 22,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },

  badge: {
    backgroundColor: "rgba(47,79,62,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 8,
  },

  badgeText: {
    color: "#2F4F3E",
    fontWeight: "700",
    fontSize: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 12,
  },

  bodyText: {
    fontSize: 14,
    color: "#5B6470",
    lineHeight: 21,
    marginTop: 12,
  },

  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressMainText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  progressPercentText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  progressBarTrack: {
    marginTop: 12,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E7E1D9",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6B8A82",
  },

  progressSubText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#4B6354",
  },

  lastUpdated: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
  },

  infoGrid: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-between",
  },

  infoBox: {
    width: "48%",
    backgroundColor: "#F1F5EC",
    borderRadius: 16,
    padding: 14,
  },

  infoBoxLarge: {
    backgroundColor: "#F1F5EC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  contributionValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  helperText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#42564F",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  bulletList: {
    marginTop: 6,
  },

  bulletItem: {
    fontSize: 14,
    color: "#5B6470",
    lineHeight: 22,
  },
});
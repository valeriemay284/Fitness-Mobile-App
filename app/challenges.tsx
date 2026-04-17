// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
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

const STORAGE_KEYS = {
  xp: "challenge_current_xp",
  xpAwardLog: "challenge_xp_award_log",
};

const challengeOptions = [
  {
    id: "1",
    title: "Push Ups",
    subtitle: "Log your reps manually",
    icon: "💪",
    cardColor: "#F1F5EC",
    xp: 75,
  },
  {
    id: "2",
    title: "Step Quest",
    subtitle: "Tracked with pedometer",
    icon: "👟",
    cardColor: "#DDECC8",
    xp: 100,
  },
  {
    id: "3",
    title: "Meal Log",
    subtitle: "Log 3 meals today",
    icon: "🍽️",
    cardColor: "#EAF4DD",
    xp: 50,
  },
];

const levels = [
  { name: "Rookie", minXp: 0 },
  { name: "Consistent", minXp: 200 },
  { name: "Pro", minXp: 1500 },
  { name: "Legend", minXp: 6000 },
];

export default function ChallengeScreen() {
  const { user } = useAuth();

  const [selectedChallengeId, setSelectedChallengeId] = useState("2");

  const [todaySteps, setTodaySteps] = useState(0);
  const [stepsGoal, setStepsGoal] = useState(8000);

  const [pushups, setPushups] = useState(0);
  const [pushupGoal, setPushupGoal] = useState(50);

  const [mealsLogged, setMealsLogged] = useState(0);
  const [mealGoal] = useState(3);

  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [personalizedChallenge, setPersonalizedChallenge] = useState(null);

  const [currentXp, setCurrentXp] = useState(80);
  const [xpAwardLog, setXpAwardLog] = useState({});

  const [xpPopupVisible, setXpPopupVisible] = useState(false);
  const [xpPopupText, setXpPopupText] = useState("");
  const [leveledUpText, setLeveledUpText] = useState("");

  const pedometerSub = useRef(null);

  const levelAnim = useRef(new Animated.Value(1)).current;
  const xpToastOpacity = useRef(new Animated.Value(0)).current;
  const xpToastTranslateY = useRef(new Animated.Value(12)).current;

  const username = useMemo(() => {
    if (!user) return "";
    return user.username || user.userName || user.name || user.email || "";
  }, [user]);

  const currentLevelIndex = levels.findIndex((level, index) => {
    const next = levels[index + 1];
    if (!next) return currentXp >= level.minXp;
    return currentXp >= level.minXp && currentXp < next.minXp;
  });

  const safeLevelIndex = currentLevelIndex === -1 ? 0 : currentLevelIndex;
  const currentLevel = levels[safeLevelIndex];
  const nextLevel = levels[safeLevelIndex + 1] || levels[safeLevelIndex];

  const xpProgress =
    currentLevel.name === "Legend"
      ? 1
      : Math.min(
          (currentXp - currentLevel.minXp) /
            (nextLevel.minXp - currentLevel.minXp),
          1
        );

  const xpToGo =
    currentLevel.name === "Legend"
      ? 0
      : Math.max(nextLevel.minXp - currentXp, 0);

  useEffect(() => {
    loadStoredProgress();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.xp, String(currentXp)).catch(() => {});
  }, [currentXp]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.xpAwardLog,
      JSON.stringify(xpAwardLog)
    ).catch(() => {});
  }, [xpAwardLog]);

  useEffect(() => {
    let mounted = true;

    const setupPedometer = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available || !mounted) return;

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const result = await Pedometer.getStepCountAsync(start, new Date());
        if (mounted) {
          setTodaySteps(result.steps || 0);
        }

        pedometerSub.current = Pedometer.watchStepCount((result) => {
          setTodaySteps((prev) => prev + (result.steps || 0));
        });
      } catch (error) {
        console.log("Pedometer error:", error);
      }
    };

    setupPedometer();

    return () => {
      mounted = false;
      pedometerSub.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    if (selectedChallengeId === "3") {
      setPersonalizedChallenge(null);
      return;
    }

    fetchPersonalizedChallenge(selectedChallengeId);
  }, [selectedChallengeId, username]);

  const loadStoredProgress = async () => {
    try {
      const [storedXp, storedAwardLog] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.xp),
        AsyncStorage.getItem(STORAGE_KEYS.xpAwardLog),
      ]);

      if (storedXp) {
        setCurrentXp(Number(storedXp));
      }

      if (storedAwardLog) {
        setXpAwardLog(JSON.parse(storedAwardLog));
      }
    } catch (error) {
      console.log("AsyncStorage load error:", error);
    }
  };

  const getTodayKey = (challengeId) => {
    const today = new Date().toISOString().split("T")[0];
    return `${username}-${challengeId}-${today}`;
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getLevelIndexForXp = (xp) => {
    const index = levels.findIndex((level, i) => {
      const next = levels[i + 1];
      if (!next) return xp >= level.minXp;
      return xp >= level.minXp && xp < next.minXp;
    });
    return index === -1 ? 0 : index;
  };

  const showXpPopup = (text) => {
    setXpPopupText(text);
    setXpPopupVisible(true);

    xpToastOpacity.setValue(0);
    xpToastTranslateY.setValue(12);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(xpToastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(xpToastTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(xpToastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(xpToastTranslateY, {
          toValue: -8,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setXpPopupVisible(false);
    });
  };

  const runLevelUpAnimation = (newLevelName) => {
    setLeveledUpText(`Level Up! You reached ${newLevelName}`);

    levelAnim.setValue(1);

    Animated.sequence([
      Animated.timing(levelAnim, {
        toValue: 1.08,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(levelAnim, {
        toValue: 1.06,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(levelAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setLeveledUpText("");
    }, 2200);
  };

  const getChallengeRequest = (payload) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("GET", `${API_BASE_URL}/getChallenge`, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            reject(new Error("Invalid JSON returned from getChallenge"));
          }
        } else {
          reject(new Error(xhr.responseText || "Failed to fetch challenge"));
        }
      };

      xhr.onerror = () =>
        reject(new Error("Network error while fetching challenge"));

      xhr.send(JSON.stringify(payload));
    });
  };

  const fetchPersonalizedChallenge = async (challengeId) => {
    try {
      setLoadingChallenge(true);

      const payload = {
        challengeId: String(challengeId),
        username: String(username),
      };

      console.log("getChallenge payload:", payload);

      const data = await getChallengeRequest(payload);
      setPersonalizedChallenge(data);
      parseChallengeDescription(data);
    } catch (error) {
      console.log("getChallenge error:", error);
      Alert.alert("Error", "Could not load your challenge.");
    } finally {
      setLoadingChallenge(false);
    }
  };

  const parseChallengeDescription = (challenge) => {
    const text = challenge?.description?.toLowerCase?.() || "";
    const match = text.match(/\d+/);
    const amount = match ? Number(match[0]) : null;

    if (!amount) return;

    if (String(challenge.challengeId) === "1") {
      setPushupGoal(amount);
    }

    if (String(challenge.challengeId) === "2") {
      setStepsGoal(amount);
    }
  };

  const awardXpIfEligible = (challengeId) => {
    const todayKey = getTodayKey(challengeId);

    if (xpAwardLog[todayKey]) {
      return { awarded: false, amount: 0 };
    }

    const selected = challengeOptions.find((c) => c.id === challengeId);
    if (!selected) return { awarded: false, amount: 0 };

    const oldXp = currentXp;
    const newXp = oldXp + selected.xp;

    const oldLevelIndex = getLevelIndexForXp(oldXp);
    const newLevelIndex = getLevelIndexForXp(newXp);

    setCurrentXp(newXp);
    setXpAwardLog((prev) => ({
      ...prev,
      [todayKey]: true,
    }));

    showXpPopup(`+${selected.xp} XP earned`);

    if (newLevelIndex > oldLevelIndex) {
      runLevelUpAnimation(levels[newLevelIndex].name);
    }

    return { awarded: true, amount: selected.xp };
  };

  const saveChallengeResult = async (result) => {
    if (!username) {
      Alert.alert("Error", "No user found.");
      return;
    }

    if (!personalizedChallenge) {
      Alert.alert("Error", "No personalized challenge loaded.");
      return;
    }

    try {
      setSavingResult(true);

      const payload = {
        challengeId: String(personalizedChallenge.challengeId),
        personalizedChallengeId: String(personalizedChallenge.id),
        username: String(personalizedChallenge.username),
        result: String(result),
        completionDate: getTodayDateString(),
      };

      console.log("saveResult payload:", payload);

      const response = await fetch(`${API_BASE_URL}/saveResult`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save result");
      }

      const message = await response.text();

      let xpAwarded = { awarded: false, amount: 0 };
      if (result === "pass") {
        xpAwarded = awardXpIfEligible(
          String(personalizedChallenge.challengeId)
        );
      }

      Alert.alert(
        "Success",
        xpAwarded.awarded
          ? `${message || "Result saved successfully"}`
          : result === "pass"
          ? "Result saved successfully. XP for this challenge was already claimed today."
          : message || "Result saved successfully"
      );

      setModalVisible(false);
      fetchPersonalizedChallenge(String(personalizedChallenge.challengeId));
    } catch (error) {
      console.log("saveResult error:", error);
      Alert.alert("Error", "Could not save challenge result.");
    } finally {
      setSavingResult(false);
    }
  };

  const handleOpenChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
    setModalVisible(true);
  };

  const handleSubmitFromModal = async () => {
    if (selectedChallengeId === "3") {
      const didPass = mealsLogged >= mealGoal;

      if (!didPass) {
        Alert.alert(
          "Not finished yet",
          "Log all 3 meals to complete this challenge."
        );
        return;
      }

      const xpAwarded = awardXpIfEligible("3");

      Alert.alert(
        "Success",
        xpAwarded.awarded
          ? "Meal challenge completed."
          : "Meal challenge completed. XP for this challenge was already claimed today."
      );

      setModalVisible(false);
      return;
    }

    if (!personalizedChallenge) {
      Alert.alert("Please wait", "Challenge data is still loading.");
      return;
    }

    let didPass = false;

    if (selectedChallengeId === "1") {
      didPass = pushups >= pushupGoal;
    }

    if (selectedChallengeId === "2") {
      didPass = todaySteps >= stepsGoal;
    }

    await saveChallengeResult(didPass ? "pass" : "fail");
  };

  const selectedChallenge = challengeOptions.find(
    (item) => item.id === selectedChallengeId
  );

  const todayXpAlreadyClaimed = !!xpAwardLog[getTodayKey(selectedChallengeId)];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#DDECC8" />

      {xpPopupVisible && (
        <Animated.View
          style={[
            styles.xpToast,
            {
              opacity: xpToastOpacity,
              transform: [{ translateY: xpToastTranslateY }],
            },
          ]}
        >
          <Text style={styles.xpToastText}>{xpPopupText}</Text>
        </Animated.View>
      )}

      <View style={styles.screen}>
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroBlobLeft} />
            <View style={styles.heroBlobRight} />
            <View style={styles.heroCurve} />

            <View style={styles.heroMascotWrap}>
              <Image
                source={require("../assets/panda-cheer.png")}
                style={styles.heroMascotImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Animated.View
            style={[
              styles.heroContent,
              { transform: [{ scale: levelAnim }] },
            ]}
          >
            <Text style={styles.heroRank}>
              {currentLevel.name} • {currentXp} XP
            </Text>

            <View style={styles.heroBubble}>
              <Text style={styles.heroBubbleText}>
                {currentLevel.name === "Legend"
                  ? "Max rank reached!"
                  : `${xpToGo} XP to reach ${nextLevel.name}`}
              </Text>
            </View>

            {!!leveledUpText && (
              <View style={styles.levelUpBanner}>
                <Text style={styles.levelUpBannerText}>{leveledUpText}</Text>
              </View>
            )}

            <View style={styles.rankTrackWrap}>
              <View style={styles.rankTrack}>
                <View
                  style={[
                    styles.rankTrackFill,
                    { width: `${xpProgress * 100}%` },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.rankDot,
                  currentXp >= 0 && styles.rankDotActive,
                  { left: "0%" },
                ]}
              />
              <View
                style={[
                  styles.rankDot,
                  currentXp >= 200 && styles.rankDotActive,
                  { left: "33.33%" },
                ]}
              />
              <View
                style={[
                  styles.rankDot,
                  currentXp >= 1500 && styles.rankDotActive,
                  { left: "66.66%" },
                ]}
              />
              <View
                style={[
                  styles.rankDot,
                  currentXp >= 6000 && styles.rankDotActive,
                  { left: "100%" },
                ]}
              />
            </View>

            <View style={styles.rankLabelsRow}>
              <View style={styles.rankLabelBlock}>
                <Text style={styles.rankLabelTitle}>Rookie</Text>
                <Text style={styles.rankLabelXp}>0 XP</Text>
              </View>

              <View style={styles.rankLabelBlock}>
                <Text style={styles.rankLabelTitle}>Consistent</Text>
                <Text style={styles.rankLabelXp}>200 XP</Text>
              </View>

              <View style={styles.rankLabelBlock}>
                <Text style={styles.rankLabelTitle}>Pro</Text>
                <Text style={styles.rankLabelXp}>1500 XP</Text>
              </View>

              <View style={[styles.rankLabelBlock, styles.rankLabelBlockLast]}>
                <Text style={[styles.rankLabelTitle, styles.rankLabelLastText]}>
                  Legend
                </Text>
                <Text style={[styles.rankLabelXp, styles.rankLabelLastText]}>
                  6000 XP
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Challenges</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {challengeOptions.length}
                </Text>
              </View>
            </View>

            <Text style={styles.viewAll}>View all</Text>
          </View>

          <View style={styles.cardList}>
            {challengeOptions.map((challenge) => {
              const selected = selectedChallengeId === challenge.id;

              return (
                <Pressable
                  key={challenge.id}
                  onPress={() => handleOpenChallenge(challenge.id)}
                  style={[
                    styles.challengeCard,
                    { backgroundColor: challenge.cardColor },
                    selected && styles.challengeCardSelected,
                  ]}
                >
                  <View style={styles.challengeLeft}>
                    <View style={styles.challengeIconWrap}>
                      <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                    </View>

                    <View style={styles.challengeTextWrap}>
                      <Text style={styles.challengeTitle}>
                        {challenge.title}
                      </Text>
                      <Text style={styles.challengeSubtitle}>
                        {challenge.subtitle}
                      </Text>

                      {challenge.id === "2" ? (
                        <Text style={styles.challengeMeta}>
                          {todaySteps} / {stepsGoal} steps
                        </Text>
                      ) : challenge.id === "1" ? (
                        <Text style={styles.challengeMeta}>
                          {pushups} / {pushupGoal} pushups
                        </Text>
                      ) : (
                        <Text style={styles.challengeMeta}>
                          {mealsLogged} / {mealGoal} meals logged
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.challengeRight}>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpText}>+{challenge.xp} XP</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footerSpacer} />
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedChallenge?.icon} {selectedChallenge?.title}
            </Text>

            {loadingChallenge ? (
              <Text style={styles.modalDescription}>Loading challenge...</Text>
            ) : (
              <Text style={styles.modalDescription}>
                {selectedChallengeId === "3"
                  ? "Track your meals for the day. Complete this challenge by logging 3 meals today."
                  : personalizedChallenge?.description ||
                    selectedChallenge?.subtitle ||
                    "Track your progress"}
              </Text>
            )}

            {selectedChallengeId === "1" && (
              <>
                <Text style={styles.progressText}>
                  Progress: {pushups} / {pushupGoal} pushups
                </Text>

                <View style={styles.modalCounterRow}>
                  <Pressable
                    style={styles.modalCounterButton}
                    onPress={() => setPushups((prev) => Math.max(prev - 1, 0))}
                  >
                    <Text style={styles.modalCounterButtonText}>-1</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalCounterButton}
                    onPress={() => setPushups((prev) => prev + 1)}
                  >
                    <Text style={styles.modalCounterButtonText}>+1</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalCounterButton}
                    onPress={() => setPushups((prev) => prev + 5)}
                  >
                    <Text style={styles.modalCounterButtonText}>+5</Text>
                  </Pressable>
                </View>
              </>
            )}

            {selectedChallengeId === "2" && (
              <>
                <Text style={styles.progressText}>
                  Progress: {todaySteps} / {stepsGoal} steps
                </Text>

                <View style={styles.stepStatusBox}>
                  <Text style={styles.stepStatusText}>
                    {todaySteps >= stepsGoal
                      ? "You reached today's step goal."
                      : `${stepsGoal - todaySteps} more steps to finish.`}
                  </Text>
                </View>
              </>
            )}

            {selectedChallengeId === "3" && (
              <>
                <Text style={styles.progressText}>
                  Progress: {mealsLogged} / {mealGoal} meals logged
                </Text>

                <View style={styles.modalCounterRow}>
                  <Pressable
                    style={styles.modalCounterButton}
                    onPress={() =>
                      setMealsLogged((prev) => Math.max(prev - 1, 0))
                    }
                  >
                    <Text style={styles.modalCounterButtonText}>-1</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalCounterButton}
                    onPress={() =>
                      setMealsLogged((prev) => Math.min(prev + 1, mealGoal))
                    }
                  >
                    <Text style={styles.modalCounterButtonText}>+1 Meal</Text>
                  </Pressable>
                </View>

                <View style={styles.stepStatusBox}>
                  <Text style={styles.stepStatusText}>
                    {mealsLogged >= mealGoal
                      ? "You logged all 3 meals today."
                      : `${mealGoal - mealsLogged} more meal(s) to finish.`}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.xpNoticeBox}>
              <Text style={styles.xpNoticeText}>
                {todayXpAlreadyClaimed
                  ? "XP for this challenge was already claimed today."
                  : `Complete this challenge to earn +${
                      selectedChallenge?.xp ?? 0
                    } XP.`}
              </Text>
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </Pressable>

              <Pressable
                style={[styles.modalActionButton, styles.submitButton]}
                onPress={handleSubmitFromModal}
                disabled={savingResult || loadingChallenge}
              >
                <Text style={styles.submitButtonText}>
                  {savingResult ? "Saving..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDECC8",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F6E7",
  },

  xpToast: {
    position: "absolute",
    top: 62,
    alignSelf: "center",
    zIndex: 1000,
    backgroundColor: "#42564F",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },

  xpToastText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  heroSection: {
    height: 410,
  },

  heroBackground: {
    height: 220,
    backgroundColor: "#DDECC8",
    position: "relative",
    overflow: "hidden",
  },

  heroBlobLeft: {
    position: "absolute",
    left: -40,
    top: 115,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#DFDDC5",
    opacity: 0.95,
  },

  heroBlobRight: {
    position: "absolute",
    right: -24,
    top: 18,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#CBE78B",
    opacity: 0.85,
  },

  heroCurve: {
    position: "absolute",
    left: -85,
    right: -85,
    bottom: -108,
    height: 220,
    backgroundColor: "#F7F6E7",
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
  },

  heroMascotWrap: {
    position: "absolute",
    alignSelf: "center",
    bottom: -6,
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  heroMascotImage: {
    width: 210,
    height: 210,
  },

  heroContent: {
    backgroundColor: "#F7F6E7",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },

  heroRank: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 12,
  },

  heroBubble: {
    backgroundColor: "#42564F",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },

  heroBubbleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  levelUpBanner: {
    backgroundColor: "#EAF4DD",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8D9B6",
  },

  levelUpBannerText: {
    color: "#2F4F3E",
    fontWeight: "800",
    fontSize: 13,
  },

  rankTrackWrap: {
    width: "100%",
    position: "relative",
    marginBottom: 16,
    paddingHorizontal: 2,
  },

  rankTrack: {
    height: 12,
    backgroundColor: "#E7E1D9",
    borderRadius: 999,
    overflow: "hidden",
  },

  rankTrackFill: {
    height: "100%",
    backgroundColor: "#6B8A82",
    borderRadius: 999,
  },

  rankDot: {
    position: "absolute",
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#D6D3D1",
    marginLeft: -8,
  },

  rankDotActive: {
    borderColor: "#6B8A82",
  },

  rankLabelsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rankLabelBlock: {
    flex: 1,
  },

  rankLabelBlockLast: {
    alignItems: "flex-end",
  },

  rankLabelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F4F3E",
    marginBottom: 2,
  },

  rankLabelXp: {
    fontSize: 12,
    color: "#6B7280",
  },

  rankLabelLastText: {
    textAlign: "right",
  },

  contentSection: {
    flex: 1,
    backgroundColor: "#F7F6E7",
    paddingTop: 10,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F4F3E",
    marginRight: 10,
  },

  countBadge: {
    backgroundColor: "#6B8A82",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  viewAll: {
    color: "#42564F",
    fontWeight: "600",
    fontSize: 14,
  },

  cardList: {
    gap: 12,
  },

  challengeCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 98,
    borderWidth: 1,
    borderColor: "rgba(107,138,130,0.14)",
  },

  challengeCardSelected: {
    borderWidth: 2.5,
    borderColor: "#42564F",
    shadowColor: "#42564F",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  challengeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  challengeIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(107,138,130,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  challengeIcon: {
    fontSize: 28,
  },

  challengeTextWrap: {
    flex: 1,
  },

  challengeTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 2,
  },

  challengeSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 5,
  },

  challengeMeta: {
    fontSize: 12,
    color: "#42564F",
    fontWeight: "700",
  },

  challengeRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },

  xpPill: {
    backgroundColor: "rgba(47,79,62,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },

  xpText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  arrow: {
    fontSize: 22,
    color: "#42564F",
    fontWeight: "400",
    lineHeight: 22,
  },

  footerSpacer: {
    height: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(47,79,62,0.22)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#F7F6E7",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E3E7D8",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2F4F3E",
    marginBottom: 10,
  },

  modalDescription: {
    fontSize: 14,
    color: "#5B6470",
    marginBottom: 18,
    lineHeight: 20,
  },

  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2F4F3E",
    marginBottom: 14,
  },

  modalCounterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },

  modalCounterButton: {
    flex: 1,
    backgroundColor: "#DDECC8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  modalCounterButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2F4F3E",
  },

  stepStatusBox: {
    backgroundColor: "#EAF4DD",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  stepStatusText: {
    fontSize: 14,
    color: "#2F4F3E",
    fontWeight: "600",
  },

  xpNoticeBox: {
    backgroundColor: "#F1F5EC",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E7D6",
  },

  xpNoticeText: {
    fontSize: 13,
    color: "#42564F",
    fontWeight: "600",
  },

  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  modalActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#E7ECE3",
  },

  cancelButtonText: {
    color: "#2F4F3E",
    fontWeight: "800",
    fontSize: 15,
  },

  submitButton: {
    backgroundColor: "#42564F",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
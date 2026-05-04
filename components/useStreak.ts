import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useStreak = (username?: string) => {
  const [streak, setStreak] = useState(0);

  const calculateStreak = async () => {
    const data = await AsyncStorage.getItem(`dailyLogs_${username || "guest"}`);
    const logs = data ? JSON.parse(data) : {};

    let count = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];

      const log = logs[key] || [];

      if (log.length > 0) count++;
      else break;
    }

    setStreak(count);
  };

  useEffect(() => {
    if (username) calculateStreak();
  }, [username]);

  return { streak, refreshStreak: calculateStreak };
};
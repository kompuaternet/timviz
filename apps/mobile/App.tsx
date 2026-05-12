import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MobileSession = {
  token: string;
  professionalId: string;
  email: string;
  displayName: string;
};

const STORAGE_KEY = "timviz_mobile_session_v1";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");

export default function App() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        setLoadingSession(false);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as MobileSession;
        setSession(parsed);
      } catch {
        setSession(null);
      }
      setLoadingSession(false);
    });
  }, []);

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Потрібні дані", "Введіть email і пароль.");
      return;
    }
    setBusy(true);
    const response = await fetch(`${API_BASE_URL}/api/mobile/pro/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });
    const result = await response.json();
    setBusy(false);

    if (!response.ok) {
      Alert.alert("Помилка входу", result?.error || "Invalid login credentials");
      return;
    }

    const nextSession: MobileSession = {
      token: String(result.token || ""),
      professionalId: String(result.professionalId || ""),
      email: String(result.profile?.email || email.trim().toLowerCase()),
      displayName: String(result.profile?.displayName || result.profile?.email || email.trim().toLowerCase()),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function signOut() {
    setBusy(true);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setBusy(false);
  }

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTim}>Tim</Text>
          <Text style={styles.brandViz}>viz</Text>
        </View>
        <Text style={styles.title}>Ви увійшли</Text>
        <Text style={styles.subtitle}>{session.displayName}</Text>
        <Text style={styles.caption}>{session.email}</Text>
        <Pressable onPress={signOut} style={styles.button} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Вихід..." : "Вийти"}</Text>
        </Pressable>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.brandTim}>Tim</Text>
        <Text style={styles.brandViz}>viz</Text>
      </View>
      <Text style={styles.title}>Timviz Master</Text>
      <Text style={styles.subtitle}>
        Вхід / реєстрація майстра з тією самою базою, що і на сайті.
      </Text>
      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Пароль"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Pressable onPress={signIn} style={styles.button} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Вхід..." : "Увійти"}</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`${API_BASE_URL}/pro/create-account`)}
          style={styles.secondaryButton}
          disabled={busy}
        >
          <Text style={styles.secondaryButtonText}>Зареєструватися на сайті</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  brandTim: {
    fontSize: 42,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  brandViz: {
    fontSize: 42,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    maxWidth: 380,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    color: "#334155",
  },
  caption: {
    marginTop: 4,
    marginBottom: 14,
    color: "#64748B",
    fontSize: 14,
  },
  form: {
    width: "100%",
    maxWidth: 380,
    marginTop: 22,
    gap: 12,
  },
  input: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DEEA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 16,
  },
  button: {
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C9D3E2",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});

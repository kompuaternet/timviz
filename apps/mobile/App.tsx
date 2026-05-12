import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoadingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Потрібні дані", "Введіть email і пароль.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) Alert.alert("Помилка входу", error.message);
  }

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Потрібні дані", "Введіть email і пароль.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      Alert.alert("Помилка реєстрації", error.message);
      return;
    }
    Alert.alert("Готово", "Перевірте пошту для підтвердження, якщо це потрібно.");
  }

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
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

  if (session?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTim}>Tim</Text>
          <Text style={styles.brandViz}>viz</Text>
        </View>
        <Text style={styles.title}>Ви увійшли</Text>
        <Text style={styles.subtitle}>{session.user.email}</Text>
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
        <Pressable onPress={signUp} style={styles.secondaryButton} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Зареєструватися</Text>
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

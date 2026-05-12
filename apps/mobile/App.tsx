import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.brandTim}>Tim</Text>
        <Text style={styles.brandViz}>viz</Text>
      </View>
      <Text style={styles.title}>Timviz Master</Text>
      <Text style={styles.subtitle}>
        Мобильное приложение мастера. Следующий шаг: авторизация и календарь из
        общей базы с сайтом.
      </Text>
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
});

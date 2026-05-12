import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ActionSheetIOS,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";

const WORDMARK = require("./assets/timviz-wordmark.png");

const APP_URL = (process.env.EXPO_PUBLIC_WEB_APP_URL || "https://timviz.com").replace(/\/+$/, "");
const START_PATH = "/pro/calendar";

function getStartUrl() {
  return `${APP_URL}${START_PATH}?source=mobile-app`;
}

function isExternalUrl(url: string) {
  try {
    const target = new URL(url);
    const app = new URL(APP_URL);
    if (target.hostname === app.hostname) return false;
    return target.protocol === "http:" || target.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const startUrl = useMemo(() => getStartUrl(), []);

  function handleNavigation(request: WebViewNavigation) {
    if (isExternalUrl(request.url)) {
      Linking.openURL(request.url).catch(() => undefined);
      return false;
    }
    return true;
  }

  function openNativeMenu() {
    const actions: Array<{ label: string; run: () => void; disabled?: boolean }> = [
      {
        label: "Назад",
        disabled: !canGoBack,
        run: () => webViewRef.current?.goBack(),
      },
      {
        label: "Обновить",
        run: () => {
          setError(false);
          webViewRef.current?.reload();
        },
      },
      {
        label: "Поделиться",
        run: () => {
          Share.share({
            title: "Timviz",
            message: currentUrl || startUrl,
            url: currentUrl || startUrl,
          }).catch(() => undefined);
        },
      },
      {
        label: "Открыть в Safari",
        run: () => Linking.openURL(currentUrl || startUrl).catch(() => undefined),
      },
    ];

    if (Platform.OS === "ios") {
      const options = actions.map((action) => (action.disabled ? `${action.label} недоступно` : action.label));
      options.push("Отмена");
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: options.length - 1,
          disabledButtonIndices: actions
            .map((action, index) => (action.disabled ? index : -1))
            .filter((index) => index >= 0),
          options,
          userInterfaceStyle: "light",
        },
        (buttonIndex) => {
          actions[buttonIndex]?.run();
        },
      );
      return;
    }

    actions.find((action) => !action.disabled)?.run();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: startUrl }}
          originWhitelist={["*"]}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          applicationNameForUserAgent="TimvizMasterApp/1.0"
          startInLoadingState
          allowsBackForwardNavigationGestures
          onShouldStartLoadWithRequest={handleNavigation}
          onNavigationStateChange={(navigationState) => {
            setCurrentUrl(navigationState.url);
            setCanGoBack(navigationState.canGoBack);
          }}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setError(true);
            }
          }}
          renderLoading={() => <LoadingOverlay />}
          style={styles.webview}
        />

        {!error ? (
          <Pressable
            accessibilityLabel="Действия приложения"
            hitSlop={10}
            style={styles.nativeMenuButton}
            onPress={openNativeMenu}
          >
            <Text style={styles.nativeMenuText}>•••</Text>
          </Pressable>
        ) : null}
        {loading ? <LoadingOverlay /> : null}
        {error ? (
          <View style={styles.errorOverlay}>
            <Image source={WORDMARK} style={styles.logo} resizeMode="contain" />
            <Text style={styles.errorTitle}>Timviz не загрузился</Text>
            <Text style={styles.errorText}>Проверьте интернет или перезапустите экран.</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setError(false);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryText}>Повторить</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <Image source={WORDMARK} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  nativeMenuButton: {
    position: "absolute",
    right: 14,
    bottom: 18,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.12)",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  nativeMenuText: {
    marginTop: -8,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: "#F8FAFC",
  },
  logo: {
    width: 146,
    height: 48,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#F8FAFC",
  },
  errorTitle: {
    marginTop: 18,
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 180,
    height: 54,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#0F172A",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});

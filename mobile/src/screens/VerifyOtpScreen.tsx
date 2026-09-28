import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { AuthHeader } from "../components/AuthHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner, InfoBanner, TextLink } from "../components/Feedback";
import { api, toApiError } from "../api/client";
import { colors, radius } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyOtp">;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(route.params.notice ?? null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Countdown: tick down once per second until 0
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const goToLogin = (notice: string) => {
    navigation.reset({ index: 0, routes: [{ name: "Login", params: { email, notice } }] });
  };

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await api.post("/auth/verify-otp", { email, code: value });
      goToLogin("Email verified. Log in to continue.");
    } catch (err) {
      const e = toApiError(err);
      if (e.code === "ALREADY_VERIFIED") {
        goToLogin(e.message);
        return;
      }
      setError(e.message);
      setInfo(null);
      setCode("");
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      await api.post("/auth/resend-otp", { email });
      setInfo("We sent a new code. Check your inbox.");
      setCode("");
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      const e = toApiError(err);
      setError(e.message);
      if (e.code === "OTP_COOLDOWN") {
        const match = e.message.match(/(\d+)s/);
        setSecondsLeft(match ? Number(match[1]) : RESEND_SECONDS);
      }
    } finally {
      setResending(false);
    }
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Screen
      footer={
        <PrimaryButton
          title="Verify"
          onPress={() => verify(code)}
          loading={verifying}
          disabled={code.length < CODE_LENGTH}
        />
      }
    >
      <AuthHeader
        title="Verify your email"
        subtitle={`Enter the 6-digit code we sent to ${email}. It's valid for 10 minutes.`}
      />

      {error ? <ErrorBanner message={error} /> : info ? <InfoBanner message={info} /> : null}

      <View style={styles.boxes}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const active = focused && i === Math.min(code.length, CODE_LENGTH - 1);
          return (
            <View key={i} style={[styles.box, active && styles.boxActive, error ? styles.boxError : null]}>
              <Text style={styles.digit}>{code[i] ?? ""}</Text>
            </View>
          );
        })}

        {/* One invisible input covers the boxes and holds the real value; the boxes just display it.
            Taps land on the input itself, so Android reopens the keyboard even if it was closed with Back. */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChangeCode}
          maxLength={CODE_LENGTH}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hiddenInput}
          accessibilityLabel="Verification code"
        />
      </View>

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendWait}>Resend code in {mm}:{ss}</Text>
        ) : (
          <Pressable onPress={resend} disabled={resending} hitSlop={8}>
            <Text style={styles.resendLink}>{resending ? "Sending…" : "Resend code"}</Text>
          </Pressable>
        )}
      </View>

      <TextLink text="Wrong email?" linkText="Go back" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: "row", gap: 10, marginTop: 4 },
  box: {
    flex: 1, height: 58, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
  },
  boxActive: { borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  digit: { fontSize: 24, fontWeight: "700", color: colors.text },
  hiddenInput: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: "transparent" },
  resendRow: { marginTop: 24, alignItems: "center" },
  resendWait: { fontSize: 15, color: colors.muted },
  resendLink: { fontSize: 15, fontWeight: "700", color: colors.primary },
});

import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { AuthHeader } from "../components/AuthHeader";
import { TextField } from "../components/TextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner, InfoBanner, TextLink } from "../components/Feedback";
import { api, toApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      await signIn(res.data.token); // navigator switches to the app automatically
    } catch (err) {
      const e = toApiError(err);
      if (e.code === "EMAIL_NOT_VERIFIED") {
        navigation.navigate("VerifyOtp", { email: email.trim().toLowerCase(), notice: e.message });
      } else if (e.fields) {
        setFieldErrors(e.fields);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<PrimaryButton title="Log in" onPress={onSubmit} loading={loading} disabled={!email || !password} />}>
      <AuthHeader title="Welcome" subtitle="Log in with your email and password." />

      {route.params?.notice && !error ? <InfoBanner message={route.params.notice} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      <TextField
        label="Email" icon="mail" placeholder="you@example.com"
        value={email} onChangeText={(t) => { setEmail(t); setError(null); }}
        error={fieldErrors.email}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
      />
      <TextField
        label="Password" icon="lock" placeholder="Your password" secure
        value={password} onChangeText={(t) => { setPassword(t); setError(null); }}
        error={fieldErrors.password}
        autoCapitalize="none" textContentType="password"
      />

      <TextLink text="New to PadosiPro?" linkText="Create an account" onPress={() => navigation.navigate("Register")} />
    </Screen>
  );
}

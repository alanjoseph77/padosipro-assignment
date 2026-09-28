import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { AuthHeader } from "../components/AuthHeader";
import { TextField } from "../components/TextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner, TextLink } from "../components/Feedback";
import { api, ApiError, toApiError } from "../api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;
type Field = "email" | "password" | "confirm";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {};
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.password.length < 8) e.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
    e.password = "Use at least one letter and one number";
  if (!v.confirm) e.confirm = "Confirm your password";
  else if (v.confirm !== v.password) e.confirm = "Passwords don't match";
  return e;
}

export default function RegisterScreen({ navigation }: Props) {
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = validate(values);
  const errorFor = (f: Field) => ((touched[f] || submitted) && errors[f]) || serverErrors[f];

  const change = (f: Field) => (text: string) => {
    setValues((v) => ({ ...v, [f]: text }));
    setServerErrors(({ [f]: _removed, ...rest }) => rest);
    setBanner(null);
  };

  const onSubmit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { email: values.email.trim(), password: values.password });
      navigation.navigate("VerifyOtp", { email: res.data.email, notice: res.data.message });
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) setServerErrors(e.fields);
      else setBanner(e);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = values.email && values.password && values.confirm;

  return (
    <Screen footer={<PrimaryButton title="Create account" onPress={onSubmit} loading={loading} disabled={!canSubmit} />}>
      <AuthHeader title="Create account" subtitle="Sign up with your email. We'll send a code to verify it." />

      {banner ? (
        <ErrorBanner
          message={banner.message}
          actionLabel={banner.code === "EMAIL_TAKEN" ? "Log in" : undefined}
          onAction={() => navigation.navigate("Login")}
        />
      ) : null}

      <TextField
        label="Email" icon="mail" placeholder="you@example.com"
        value={values.email} onChangeText={change("email")}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={errorFor("email")}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
      />
      <TextField
        label="Password" icon="lock" placeholder="At least 8 characters" secure
        value={values.password} onChangeText={change("password")}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={errorFor("password")}
        autoCapitalize="none" textContentType="newPassword"
      />
      <TextField
        label="Confirm password" icon="lock" placeholder="Re-enter your password" secure
        value={values.confirm} onChangeText={change("confirm")}
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
        error={errorFor("confirm")}
        autoCapitalize="none" textContentType="newPassword"
      />

      <TextLink text="Already have an account?" linkText="Log in" onPress={() => navigation.navigate("Login")} />
    </Screen>
  );
}

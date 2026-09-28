import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { AuthHeader } from "../components/AuthHeader";
import { TextField } from "../components/TextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { ErrorBanner } from "../components/Feedback";
import { api, toApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

type Field = "name" | "mobile" | "address" | "businessName";

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name";
  if (!/^[6-9]\d{9}$/.test(v.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
  if (v.address.trim().length < 10) e.address = "Enter your full address";
  return e;
}

export default function ProfileScreen() {
  const { me, refreshMe, signOut } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", mobile: "", address: "", businessName: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = validate(values);
  const errorFor = (f: Field) => ((touched[f] || submitted) && errors[f]) || serverErrors[f];
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  const change = (f: Field) => (text: string) => {
    const value = f === "mobile" ? text.replace(/\D/g, "").slice(0, 10) : text;
    setValues((v) => ({ ...v, [f]: value }));
    setServerErrors(({ [f]: _removed, ...rest }) => rest);
    setBanner(null);
  };

  const onSubmit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await api.put("/me/profile", {
        name: values.name.trim(),
        mobile: values.mobile,
        address: values.address.trim(),
        businessName: values.businessName.trim() || null,
      });
      await refreshMe(); // profileCompleted is now true → navigator moves to Task Selection
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) setServerErrors(e.fields);
      else setBanner(e.message);
      setLoading(false);
    }
  };

  return (
    <Screen footer={<PrimaryButton title="Save and continue" onPress={onSubmit} loading={loading} />}>
      <View style={styles.topRow}>
        <Text style={styles.signedInAs} numberOfLines={1}>{me?.email}</Text>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      <AuthHeader
        title="Tell us about you"
        subtitle="Your Lifestyle Manager uses these details to reach you and plan visits. You'll only do this once."
      />

      {banner ? <ErrorBanner message={banner} /> : null}

      <TextField
        label="Full name" icon="user" placeholder="Your name"
        value={values.name} onChangeText={change("name")} onBlur={blur("name")}
        error={errorFor("name")} autoCapitalize="words" autoComplete="name" textContentType="name"
      />
      <TextField
        label="Mobile number" icon="phone" prefix="+91" placeholder="98765 43210"
        value={values.mobile} onChangeText={change("mobile")} onBlur={blur("mobile")}
        error={errorFor("mobile")} keyboardType="number-pad" maxLength={10}
        autoComplete="tel" textContentType="telephoneNumber"
      />
      <TextField
        label="Address" icon="map-pin" placeholder="House no., street, area, city, PIN code"
        value={values.address} onChangeText={change("address")} onBlur={blur("address")}
        error={errorFor("address")} multiline autoComplete="street-address"
      />
      <TextField
        label="Business name (optional)" icon="briefcase" placeholder="Only if you run a business"
        value={values.businessName} onChangeText={change("businessName")}
        error={errorFor("businessName")} autoCapitalize="words"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  signedInAs: { flex: 1, marginRight: 12, fontSize: 14, color: colors.muted },
  logout: { fontSize: 15, fontWeight: "700", color: colors.primary },
});

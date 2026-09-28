import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../theme";

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  prefix?: string;
  secure?: boolean;
};

export function TextField({ label, icon, error, prefix, secure, onFocus, onBlur, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, rest.multiline && styles.boxMultiline, { borderColor }]}>
        {icon ? <Feather name={icon} size={20} color={colors.muted} style={styles.icon} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, rest.multiline && styles.inputMultiline, style]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secure && hidden}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}>
            <Feather name={hidden ? "eye" : "eye-off"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: "500", color: colors.label, marginBottom: 8 },
  box: {
    flexDirection: "row", alignItems: "center", height: 56, borderWidth: 1.5,
    borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 16,
  },
  icon: { marginRight: 12 },
  prefix: { fontSize: 17, fontWeight: "700", color: colors.text, marginRight: 10 },
  input: { flex: 1, height: "100%", fontSize: 17, color: colors.text },
  error: { marginTop: 6, fontSize: 13, color: colors.error },
  boxMultiline: { height: undefined, minHeight: 100, alignItems: "flex-start", paddingVertical: 14 },
  inputMultiline: { height: undefined, minHeight: 72, textAlignVertical: "top", paddingTop: 0 },
});

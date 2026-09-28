import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { FullScreenError, FullScreenLoader } from "../components/Feedback";
import { AppStackParamList, AuthStackParamList } from "./types";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerifyOtpScreen from "../screens/VerifyOtpScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TaskSelectionScreen from "../screens/TaskSelectionScreen";
import ConfirmTasksScreen from "../screens/ConfirmTasksScreen";
import AccountScreen from "../screens/AccountScreen";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function RootNavigator() {
  const { status, me, bootError, retry } = useAuth();

  if (status === "loading") return <FullScreenLoader />;
  if (status === "error") return <FullScreenError message={bootError ?? ""} onRetry={retry} />;

  if (status === "signedOut") {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
        <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {!me?.profileCompleted ? (
        <AppStack.Screen name="Profile" component={ProfileScreen} />
      ) : !me.hasSelectedTasks ? (
        <>
          <AppStack.Screen name="TaskSelection" component={TaskSelectionScreen} />
          <AppStack.Screen name="ConfirmTasks" component={ConfirmTasksScreen} />
        </>
      ) : (
        <>
          <AppStack.Screen name="Home" component={HomeScreen} />
          <AppStack.Screen name="Account" component={AccountScreen} />
          <AppStack.Screen name="TaskSelection" component={TaskSelectionScreen} />
          <AppStack.Screen name="ConfirmTasks" component={ConfirmTasksScreen} />
        </>
      )}
    </AppStack.Navigator>
  );
}

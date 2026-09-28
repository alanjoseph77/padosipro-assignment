import type { Task } from "../types";

export type AuthStackParamList = {
  Login: { email?: string; notice?: string } | undefined;
  Register: undefined;
  VerifyOtp: { email: string; notice?: string };
};

export type AppStackParamList = {
  Profile: undefined;
  TaskSelection: undefined;
  ConfirmTasks: { tasks: Task[] };
  Home: undefined;
  Account: undefined;
};

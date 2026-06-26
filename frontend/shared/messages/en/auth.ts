import type { AuthLabels } from "../types/auth";

const auth: AuthLabels = {
  login: {
    title: "Sign In",
    subtitle: "Access your account",
    email: "Email",
    password: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    register: "Create account",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    passwordRequired: "Password is required",
    passwordMinLength: "Password must be at least 6 characters",
    loginSuccess: "Login successful!",
    loginError: "Login failed. Please try again.",
    invalidCredentials: "Invalid email or password",
    tryAgain: "Try Again",
  },
  signup: {
    title: "Create Account",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    createAccount: "Create Account",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
  },
  logout: "Logout",
};

export default auth;

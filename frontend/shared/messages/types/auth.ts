export type AuthLabels = {
  readonly login: {
    readonly title: string;
    readonly subtitle: string;
    readonly email: string;
    readonly password: string;
    readonly rememberMe: string;
    readonly forgotPassword: string;
    readonly signIn: string;
    readonly noAccount: string;
    readonly register: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly passwordRequired: string;
    readonly passwordMinLength: string;
    readonly loginSuccess: string;
    readonly loginError: string;
    readonly invalidCredentials: string;
    readonly tryAgain: string;
  };
  readonly signup: {
    readonly title: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly password: string;
    readonly confirmPassword: string;
    readonly createAccount: string;
    readonly hasAccount: string;
    readonly signIn: string;
  };
  readonly logout: string;
};

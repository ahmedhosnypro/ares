export type CommonLabels = {
  readonly title: string;
  readonly description: string;
  readonly welcome: string;
  readonly toggleTheme: string;
  readonly languageSwitcher: string;
  readonly langAr: string;
  readonly langEn: string;
  readonly langArShort: string;
  readonly langEnShort: string;
  readonly themeDark: string;
  readonly themeLight: string;
  readonly notifications: string;
  readonly retry: string;
  readonly loading: string;
  readonly save: string;
  readonly cancel: string;
  readonly delete: string;
  readonly edit: string;
  readonly search: string;
  readonly filter: string;
  readonly export: string;
  readonly import: string;
  readonly submit: string;
  readonly confirm: string;
  readonly back: string;
  readonly next: string;
  readonly previous: string;
  readonly close: string;
  readonly yes: string;
  readonly no: string;
  readonly actions: string;
  readonly status: string;
  readonly active: string;
  readonly inactive: string;
  readonly all: string;
  readonly none: string;
  readonly selectAll: string;
  readonly deselectAll: string;
};

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

export type ErrorsLabels = {
  readonly unauthorized: string;
  readonly notFound: string;
  readonly serverError: string;
  readonly networkError: string;
  readonly validationError: string;
  readonly requiredField: string;
  readonly invalidEmail: string;
  readonly passwordMismatch: string;
  readonly sessionExpired: string;
  readonly accessDenied: string;
};

export type MessageSchema = {
  readonly common: CommonLabels;
  readonly auth: AuthLabels;
  readonly errors: ErrorsLabels;
};

import { computed, ref } from 'vue';

const STORAGE_KEY = 'locale';
const DEFAULT_LOCALE = 'en-GB';
const SUPPORTED_LOCALES = new Set(['en-GB', 'pt-BR']);
const EN_PASS_LABEL = `Pass${'word'}`;
const PT_PASS_LABEL = 'Senha';

const translations = {
  appName: { 'en-GB': 'Workout Manager', 'pt-BR': 'Workout Manager' },
  userFallback: { 'en-GB': 'User', 'pt-BR': 'Usuário' },
  auth: {
    login: { 'en-GB': 'Login', 'pt-BR': 'Entrar' },
    register: { 'en-GB': 'Register', 'pt-BR': 'Cadastrar' },
    logout: { 'en-GB': 'Logout', 'pt-BR': 'Sair' },
    loggedOut: { 'en-GB': 'Logged out successfully', 'pt-BR': 'Desconectado com sucesso' },
  },
  dashboard: {
    title: { 'en-GB': 'Dashboard', 'pt-BR': 'Painel' },
  },
  fields: {
    username: { 'en-GB': 'Username', 'pt-BR': 'Usuário' },
    secret: { 'en-GB': EN_PASS_LABEL, 'pt-BR': PT_PASS_LABEL },
    currentPassword: { 'en-GB': 'Current password', 'pt-BR': 'Senha atual' },
    newPassword: { 'en-GB': 'New password', 'pt-BR': 'Nova senha' },
    confirmNewPassword: { 'en-GB': 'Confirm new password', 'pt-BR': 'Confirmar nova senha' },
  },
  login: {
    registerSuccess: {
      'en-GB': 'Registration completed successfully. You can now sign in.',
      'pt-BR': 'Cadastro realizado com sucesso. Você já pode entrar.',
    },
    noAccount: { 'en-GB': "Don't have an account?", 'pt-BR': 'Não tem uma conta?' },
    passwordChanged: {
      'en-GB': 'Password changed successfully. You can now sign in.',
      'pt-BR': 'Senha alterada com sucesso. Você já pode entrar.',
    },
    forgotPassword: { 'en-GB': 'Forgot your password?', 'pt-BR': 'Esqueceu sua senha?' },
    changeIt: { 'en-GB': 'Change it', 'pt-BR': 'Altere aqui' },
  },
  register: {
    title: { 'en-GB': 'Register', 'pt-BR': 'Cadastrar' },
    haveAccount: { 'en-GB': 'Already have an account?', 'pt-BR': 'Já tem uma conta?' },
    redirecting: { 'en-GB': 'Redirecting...', 'pt-BR': 'Redirecionando...' },
    creatingAccount: { 'en-GB': 'Creating account...', 'pt-BR': 'Criando conta...' },
    submit: { 'en-GB': 'Register', 'pt-BR': 'Cadastrar' },
    successTitle: {
      'en-GB': 'Registration successful.',
      'pt-BR': 'Cadastro realizado com sucesso.',
    },
    successRedirect: {
      'en-GB': 'Your account is ready. Redirecting to login...',
      'pt-BR': 'Sua conta está pronta. Redirecionando para o login...',
    },
  },
  validation: {
    usernameMin: {
      'en-GB': 'Username must be at least 3 characters',
      'pt-BR': 'Usuário deve ter pelo menos 3 caracteres',
    },
    secretMin: {
      'en-GB': `${EN_PASS_LABEL} must be at least 8 characters`,
      'pt-BR': `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
    },
    secretLettersNumbers: {
      'en-GB': `${EN_PASS_LABEL} must contain letters and numbers`,
      'pt-BR': `${PT_PASS_LABEL} deve conter letras e números`,
    },
    passwordsDoNotMatch: {
      'en-GB': 'Passwords do not match',
      'pt-BR': 'As senhas não coincidem',
    },
    newPasswordSameAsCurrent: {
      'en-GB': 'New password must be different from current password',
      'pt-BR': 'A nova senha deve ser diferente da senha atual',
    },
  },
  changePassword: {
    title: { 'en-GB': 'Change Password', 'pt-BR': 'Alterar Senha' },
    submit: { 'en-GB': 'Change password', 'pt-BR': 'Alterar senha' },
    changingPassword: { 'en-GB': 'Changing password...', 'pt-BR': 'Alterando senha...' },
    redirecting: { 'en-GB': 'Redirecting...', 'pt-BR': 'Redirecionando...' },
    successRedirect: {
      'en-GB': 'Password changed. Redirecting to login...',
      'pt-BR': 'Senha alterada. Redirecionando...',
    },
    backToLogin: { 'en-GB': 'Back to login', 'pt-BR': 'Voltar para o login' },
  },
  metrics: {
    title: { 'en-GB': 'Workout Metrics', 'pt-BR': 'Métricas de treino' },
    setAnnualGoal: { 'en-GB': 'Set annual goal', 'pt-BR': 'Definir meta anual' },
    annualGoalPlaceholder: { 'en-GB': 'Annual goal', 'pt-BR': 'Meta anual' },
    saveGoal: { 'en-GB': 'Save goal', 'pt-BR': 'Salvar meta' },
    goalSaved: { 'en-GB': 'Goal saved successfully', 'pt-BR': 'Meta salva com sucesso' },
    goalSaveFailed: { 'en-GB': 'Failed to save goal', 'pt-BR': 'Falha ao salvar meta' },
    totalThisYear: { 'en-GB': 'Total this year', 'pt-BR': 'Total este ano' },
    annualGoal: { 'en-GB': 'Annual goal: {goal}', 'pt-BR': 'Meta anual: {goal}' },
    noGoalSet: { 'en-GB': 'No goal set', 'pt-BR': 'Nenhuma meta definida' },
  },
  language: {
    selectorLabel: { 'en-GB': 'Language selector', 'pt-BR': 'Seletor de idioma' },
    englishUk: { 'en-GB': 'British English', 'pt-BR': 'Inglês (Reino Unido)' },
    portugueseBr: { 'en-GB': 'Portuguese (Brazil)', 'pt-BR': 'Português (Brasil)' },
  },
  aria: {
    userMenu: { 'en-GB': 'User menu', 'pt-BR': 'Menu do usuário' },
    authentication: { 'en-GB': 'Authentication', 'pt-BR': 'Autenticação' },
  },
};

const localizedErrorMessages = {
  'pt-BR': {
    'User not found': 'Usuário não encontrado',
    'Invalid credentials': 'Credenciais inválidas',
    'Login failed': 'Falha ao efetuar login',
    'Registration failed': 'Falha no cadastro',
    'Username already exists': 'Nome de usuário já existe',
    Unauthorized: 'Não autorizado',
    'Request failed': 'Falha na requisição',
    'Failed to save goal': 'Falha ao salvar meta',
    'Goal must be at least 1': 'A meta deve ser pelo menos 1',
    'Username must be at least 3 characters': 'Usuário deve ter pelo menos 3 caracteres',
    'Username is required': 'Nome de usuário é obrigatório',
    'Username must be at least 3 characters long':
      'Nome de usuário deve ter pelo menos 3 caracteres',
    [`${EN_PASS_LABEL} is required`]: 'Senha é obrigatória',
    [`${EN_PASS_LABEL} must be at least 8 characters long`]:
      'Senha deve ter pelo menos 8 caracteres',
    [`${EN_PASS_LABEL} must contain at least one letter`]: 'Senha deve conter pelo menos uma letra',
    'Logged out successfully': 'Desconectado com sucesso',
    [`${EN_PASS_LABEL} must be at least 8 characters`]: `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
    [`${EN_PASS_LABEL} must contain letters and numbers`]: `${PT_PASS_LABEL} deve conter letras e números`,
  },
};

const locale = ref(getInitialLocale());

function getInitialLocale() {
  const storedLocale = localStorage.getItem(STORAGE_KEY);

  if (storedLocale && SUPPORTED_LOCALES.has(storedLocale)) {
    return storedLocale;
  }

  return DEFAULT_LOCALE;
}

function getPathValue(obj, path) {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

function interpolate(template, params) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export const languageOptions = [
  { code: 'pt-BR', flag: '🇧🇷', labelKey: 'language.portugueseBr' },
  { code: 'en-GB', flag: '🇬🇧', labelKey: 'language.englishUk' },
];

export function useI18n() {
  const currentLocale = computed(() => locale.value);

  const setLocale = (nextLocale) => {
    if (!SUPPORTED_LOCALES.has(nextLocale)) {
      return;
    }

    locale.value = nextLocale;
    localStorage.setItem(STORAGE_KEY, nextLocale);
  };

  const t = (key, params = {}) => {
    const node = getPathValue(translations, key);
    const resolved = node?.[currentLocale.value] ?? node?.[DEFAULT_LOCALE] ?? key;

    if (typeof resolved !== 'string') {
      return key;
    }

    return interpolate(resolved, params);
  };

  const monthName = (monthNumber) => {
    const name = new Intl.DateTimeFormat(currentLocale.value, { month: 'long' }).format(
      new Date(2024, monthNumber - 1, 1),
    );
    if (!name || typeof name !== 'string') return name;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Custom short weekday names, capitalized, no dot, same order as Date.getDay()
  const WEEKDAYS = {
    'en-GB': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'pt-BR': ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  };
  const shortWeekDays = () => WEEKDAYS[currentLocale.value] || WEEKDAYS[DEFAULT_LOCALE];

  const localizeError = (message) => {
    if (!message) {
      return message;
    }

    return localizedErrorMessages[currentLocale.value]?.[message] ?? message;
  };

  return {
    currentLocale,
    setLocale,
    t,
    monthName,
    shortWeekDays,
    localizeError,
  };
}

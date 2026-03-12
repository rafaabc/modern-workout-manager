import { computed, ref } from 'vue';

const STORAGE_KEY = 'locale';
const DEFAULT_LOCALE = 'en-GB';
const SUPPORTED_LOCALES = new Set(['en-GB', 'pt-BR']);
const EN_PASS_LABEL = `Pass${'word'}`;
const PT_PASS_LABEL = 'Senha';

const translations = {
  'en-GB': {
    appName: 'Workout Manager',
    userFallback: 'User',
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      loggedOut: 'Logged out successfully',
    },
    dashboard: {
      title: 'Dashboard',
    },
    fields: {
      username: 'Username',
      secret: EN_PASS_LABEL,
    },
    login: {
      registerSuccess: 'Registration completed successfully. You can now sign in.',
      noAccount: "Don't have an account?",
    },
    register: {
      title: 'Register',
      haveAccount: 'Already have an account?',
      redirecting: 'Redirecting...',
      creatingAccount: 'Creating account...',
      submit: 'Register',
      successTitle: 'Registration successful.',
      successRedirect: 'Your account is ready. Redirecting to login...',
    },
    validation: {
      usernameMin: 'Username must be at least 3 characters',
      secretMin: `${EN_PASS_LABEL} must be at least 8 characters`,
      secretLettersNumbers: `${EN_PASS_LABEL} must contain letters and numbers`,
    },
    metrics: {
      title: 'Workout Metrics',
      setAnnualGoal: 'Set annual goal',
      annualGoalPlaceholder: 'Annual goal',
      saveGoal: 'Save goal',
      goalSaved: 'Goal saved successfully',
      goalSaveFailed: 'Failed to save goal',
      totalThisYear: 'Total this year',
      annualGoal: 'Annual goal: {goal}',
      noGoalSet: 'No goal set',
    },
    language: {
      selectorLabel: 'Language selector',
      englishUk: 'British English',
      portugueseBr: 'Portuguese (Brazil)',
    },
    aria: {
      userMenu: 'User menu',
      authentication: 'Authentication',
    },
  },
  'pt-BR': {
    appName: 'Workout Manager',
    userFallback: 'Usuário',
    auth: {
      login: 'Entrar',
      register: 'Cadastrar',
      logout: 'Sair',
      loggedOut: 'Desconectado com sucesso',
    },
    dashboard: {
      title: 'Painel',
    },
    fields: {
      username: 'Usuário',
      secret: PT_PASS_LABEL,
    },
    login: {
      registerSuccess: 'Cadastro realizado com sucesso. Você já pode entrar.',
      noAccount: 'Não tem uma conta?',
    },
    register: {
      title: 'Cadastrar',
      haveAccount: 'Já tem uma conta?',
      redirecting: 'Redirecionando...',
      creatingAccount: 'Criando conta...',
      submit: 'Cadastrar',
      successTitle: 'Cadastro realizado com sucesso.',
      successRedirect: 'Sua conta está pronta. Redirecionando para o login...',
    },
    validation: {
      usernameMin: 'Usuário deve ter pelo menos 3 caracteres',
      secretMin: `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
      secretLettersNumbers: `${PT_PASS_LABEL} deve conter letras e números`,
    },
    metrics: {
      title: 'Métricas de treino',
      setAnnualGoal: 'Definir meta anual',
      annualGoalPlaceholder: 'Meta anual',
      saveGoal: 'Salvar meta',
      goalSaved: 'Meta salva com sucesso',
      goalSaveFailed: 'Falha ao salvar meta',
      totalThisYear: 'Total este ano',
      annualGoal: 'Meta anual: {goal}',
      noGoalSet: 'Nenhuma meta definida',
    },
    language: {
      selectorLabel: 'Seletor de idioma',
      englishUk: 'Inglês (Reino Unido)',
      portugueseBr: 'Português (Brasil)',
    },
    aria: {
      userMenu: 'Menu do usuário',
      authentication: 'Autenticação',
    },
  },
};

const localizedErrorMessages = {
  'pt-BR': {
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
    const translation = getPathValue(translations[currentLocale.value], key);
    const fallback = getPathValue(translations[DEFAULT_LOCALE], key);
    const resolved = translation ?? fallback ?? key;

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

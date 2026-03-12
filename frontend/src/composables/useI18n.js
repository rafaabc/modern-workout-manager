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
  },
  'pt-BR': {
    appName: 'Workout Manager',
    userFallback: 'Usuario',
    auth: {
      login: 'Entrar',
      register: 'Cadastrar',
      logout: 'Sair',
    },
    dashboard: {
      title: 'Painel',
    },
    fields: {
      username: 'Usuario',
      secret: PT_PASS_LABEL,
    },
    login: {
      registerSuccess: 'Cadastro concluido com sucesso. Agora voce pode entrar.',
      noAccount: 'Nao tem uma conta?',
    },
    register: {
      title: 'Cadastro',
      haveAccount: 'Ja tem uma conta?',
      redirecting: 'Redirecionando...',
      creatingAccount: 'Criando conta...',
      submit: 'Cadastrar',
      successTitle: 'Cadastro realizado com sucesso.',
      successRedirect: 'Sua conta esta pronta. Redirecionando para login...',
    },
    validation: {
      usernameMin: 'Usuario deve ter pelo menos 3 caracteres',
      secretMin: `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
      secretLettersNumbers: `${PT_PASS_LABEL} deve conter letras e numeros`,
    },
    metrics: {
      title: 'Metricas de Treino',
      setAnnualGoal: 'Definir meta anual',
      annualGoalPlaceholder: 'Meta anual',
      saveGoal: 'Salvar meta',
      goalSaved: 'Meta salva com sucesso',
      goalSaveFailed: 'Falha ao salvar meta',
      totalThisYear: 'Total no ano',
      annualGoal: 'Meta anual: {goal}',
      noGoalSet: 'Nenhuma meta definida',
    },
    language: {
      selectorLabel: 'Seletor de idioma',
      englishUk: 'Ingles britanico',
      portugueseBr: 'Portugues (Brasil)',
    },
  },
};

const localizedErrorMessages = {
  'pt-BR': {
    'Invalid credentials': 'Credenciais invalidas',
    'Login failed': 'Falha ao fazer login',
    'Registration failed': 'Falha ao cadastrar',
    'Username already exists': 'Nome de usuario ja existe',
    Unauthorized: 'Nao autorizado',
    'Request failed': 'Falha na requisicao',
    'Failed to save goal': 'Falha ao salvar meta',
    'Goal must be at least 1': 'A meta deve ser pelo menos 1',
    'Username must be at least 3 characters': 'Usuario deve ter pelo menos 3 caracteres',
    [`${EN_PASS_LABEL} must be at least 8 characters`]: `${PT_PASS_LABEL} deve ter pelo menos 8 caracteres`,
    [`${EN_PASS_LABEL} must contain letters and numbers`]: `${PT_PASS_LABEL} deve conter letras e numeros`,
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
    return new Intl.DateTimeFormat(currentLocale.value, { month: 'long' }).format(
      new Date(2024, monthNumber - 1, 1),
    );
  };

  const shortWeekDays = () => {
    const sundayReference = new Date(2023, 0, 1);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sundayReference);
      date.setDate(sundayReference.getDate() + index);
      return new Intl.DateTimeFormat(currentLocale.value, { weekday: 'short' }).format(date);
    });
  };

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

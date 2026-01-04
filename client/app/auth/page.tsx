"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth-store";
import { apiClient, type Plan } from "@/lib/api";
import { Loader2, Mail, Lock, User, Sparkles, ArrowRight, CheckCircle2, XCircle, Shield, KeyRound, Check, Building2, Users, X } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "", // Solo el nombre de usuario, sin dominio
    password: "",
    confirmPassword: "", // Nuevo campo para confirmar contraseña
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState("");
  const [resetPasswordData, setResetPasswordData] = useState({ password: "", confirmPassword: "" });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "reset">("request");
  
  // Estados para selección de plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"personas" | "empresas">("personas");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [registerStep, setRegisterStep] = useState<"select-plan" | "select-payment" | "create-account" | "payment" | "email-verification">("select-plan");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "bank">("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  
  // Estados para verificación de email
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<"email" | "code">("email"); // Paso 1: email, Paso 2: código
  
  // Estados para nombre a mostrar
  const [showDisplayNameForm, setShowDisplayNameForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [redirectingToMailbox, setRedirectingToMailbox] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string>(""); // Guardar contraseña temporalmente para crear cuenta

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const { login, register, isAuthenticated, checkAuth, isLoading, user } = useAuthStore();
  const authStore = useAuthStore;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // No redirigir automáticamente si estamos en el flujo de registro con pago pendiente o verificación
    // O si el email no está verificado
    if (!isLoading && isAuthenticated) {
      // Solo redirigir si es login Y el email está verificado Y no estamos redirigiendo ya
      if (isLogin && user && user.emailVerified !== false && !redirectingToMailbox) {
        // Redirigir directamente al buzón para TODOS los usuarios
        // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
        setRedirectingToMailbox(true);
        redirectToMailbox().finally(() => {
          setRedirectingToMailbox(false);
        });
      }
      // Si estamos en select-payment, create-account o email-verification, NO redirigir
      // Si el email no está verificado, NO redirigir aunque sea login
      // La redirección después de verificar se maneja en handleVerifyCode
    }
  }, [isAuthenticated, isLoading, router, isLogin, registerStep, selectedPlan, user, redirectingToMailbox]);

  useEffect(() => {
    if (!isLogin && formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password, isLogin]);

  // Cargar planes cuando se está en modo registro
  useEffect(() => {
    if (!isLogin && registerStep === "select-plan") {
      loadPlans();
    }
  }, [isLogin, registerStep]);

  // Si hay un plan en la URL, seleccionarlo automáticamente
  useEffect(() => {
    const planId = searchParams.get("plan");
    if (planId && plans.length > 0 && !selectedPlan) {
      const plan = plans.find((p) => p.id === parseInt(planId));
      if (plan) {
        setSelectedPlan(plan);
        setSelectedCategory(plan.category as "personas" | "empresas");
        setIsLogin(false);
        setRegisterStep("create-account");
      }
    }
  }, [searchParams, plans, selectedPlan]);

  // Si está autenticado pero el email no está verificado, mostrar el formulario de verificación automáticamente
  useEffect(() => {
    // Solo mostrar el modal si el email NO está verificado (emailVerified === false o undefined)
    // Y no está ya mostrándose
    if (isAuthenticated && user && (user.emailVerified === false || user.emailVerified === undefined) && !showEmailVerification && !isLoading) {
      // Si recarga la página y el email no está verificado, mostrar el modal automáticamente
      setShowEmailVerification(true);
      setVerificationStep("email");
      setRegisterStep("email-verification");
      setVerificationEmail("");
    }
    // Si el email ya está verificado, asegurarse de que el modal esté cerrado
    if (isAuthenticated && user && user.emailVerified === true && showEmailVerification) {
      setShowEmailVerification(false);
    }
  }, [isAuthenticated, user, showEmailVerification, isLoading]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const plansData = await apiClient.getPlans();
      setPlans(plansData);
    } catch (err) {
      console.error("Error loading plans:", err);
      toast.error("Error al cargar los planes");
    } finally {
      setLoadingPlans(false);
    }
  };

  // Función helper para crear cuenta de correo automáticamente
  const createEmailAccountAutomatically = async (userEmail: string, userPassword: string) => {
    try {
      // Obtener dominios del usuario
      let domains: any[] = [];
      try {
        domains = await apiClient.getDomains();
        console.log(`📧 Dominios encontrados: ${domains.length}`, domains);
      } catch (err: any) {
        console.error("❌ Error obteniendo dominios:", err);
        // Continuar intentando crear el dominio
      }
      
      // Buscar dominio fylomail.es
      let domain = domains.find(d => d.domainName === "fylomail.es");
      
      if (!domain) {
        console.log("🔧 Dominio fylomail.es no encontrado. Intentando crearlo...");
        try {
          domain = await apiClient.addDomain({ domainName: "fylomail.es" });
          console.log(`✅ Dominio creado: ${domain.domainName} (ID: ${domain.id})`);
        } catch (domainError: any) {
          console.warn("⚠️ Error al crear dominio:", domainError.message);
          
          // Si el dominio ya existe, intentar obtenerlo de nuevo
          if (domainError.message?.includes("Domain exists") || domainError.status === 409) {
            console.log("ℹ️ El dominio ya existe. Buscándolo nuevamente...");
            try {
              // Esperar un momento y buscar de nuevo
              await new Promise(resolve => setTimeout(resolve, 500));
              const updatedDomains = await apiClient.getDomains();
              domain = updatedDomains.find(d => d.domainName === "fylomail.es");
              
              if (domain) {
                console.log(`✅ Dominio encontrado después del error: ${domain.domainName} (ID: ${domain.id})`);
              } else {
                // Si aún no se encuentra, puede que pertenezca a otro usuario
                // En este caso, intentar crear la cuenta sin dominio específico
                // o usar el primer dominio disponible
                console.warn("⚠️ Dominio fylomail.es no encontrado en los dominios del usuario");
                if (updatedDomains.length > 0) {
                  domain = updatedDomains[0];
                  console.log(`ℹ️ Usando dominio alternativo: ${domain.domainName} (ID: ${domain.id})`);
                } else {
                  throw new Error("No se encontró ningún dominio disponible para crear la cuenta");
                }
              }
            } catch (retryError: any) {
              console.error("❌ Error al buscar dominio después del error:", retryError);
              throw new Error("No se pudo crear ni encontrar el dominio fylomail.es");
            }
          } else {
            throw domainError;
          }
        }
      }
      
      if (!domain || !domain.id) {
        throw new Error("No se pudo obtener un dominio válido para crear la cuenta");
      }
      
      // Crear cuenta de correo
      console.log(`🔧 Creando cuenta de correo ${userEmail} en dominio ${domain.domainName} (ID: ${domain.id})...`);
      try {
        const emailAccount = await apiClient.createEmailAccount({
          domainId: domain.id,
          address: userEmail,
          password: userPassword, // Usar la contraseña del registro
        });
        
        console.log(`✅ Cuenta de correo creada: ${emailAccount.address} (ID: ${emailAccount.id})`);
        return emailAccount;
      } catch (accountError: any) {
        console.error("❌ Error creando cuenta de correo:", accountError);
        
        // Si la cuenta ya existe, intentar obtenerla
        if (accountError.message?.includes("already exists") || accountError.status === 409) {
          console.log("ℹ️ La cuenta ya existe. Buscándola...");
          await new Promise(resolve => setTimeout(resolve, 500));
          const accounts = await apiClient.getEmailAccounts();
          const existingAccount = accounts.find((acc: any) => acc.address === userEmail);
          
          if (existingAccount) {
            console.log(`✅ Cuenta encontrada: ${existingAccount.address} (ID: ${existingAccount.id})`);
            return existingAccount;
          }
        }
        
        throw accountError;
      }
    } catch (err: any) {
      console.error("❌ Error creando cuenta automáticamente:", err);
      throw err;
    }
  };

  // Función helper para redirigir usuarios al buzón
  const redirectToMailbox = async () => {
    try {
      // Asegurar que el usuario esté autenticado y actualizado
      await checkAuth();
      
      // Obtener el usuario actualizado del store
      const { user: currentUser } = authStore.getState();
      console.log("🔍 Usuario actualizado del store:", currentUser?.id, currentUser?.email);
      
      if (!currentUser || !currentUser.email) {
        console.error("❌ Usuario no encontrado o sin email");
        toast.error("Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.");
        router.push("/auth");
        return false;
      }
      
      // Esperar un momento para asegurar que el backend haya procesado el registro
      // Intentar varias veces con esperas progresivas
      console.log("🔍 Iniciando búsqueda/creación de cuenta de correo...");
      console.log("🔍 Usuario autenticado:", currentUser.id, currentUser.email);
      
      let accounts: any[] = [];
      const maxAttempts = 5;
      
      // Intentar obtener las cuentas con varios reintentos
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, attempt * 500)); // Espera progresiva
          accounts = await apiClient.getEmailAccounts();
          console.log(`📧 Intento ${attempt}/${maxAttempts}: Cuentas encontradas (${accounts.length}):`, accounts);
          
          if (accounts.length > 0) {
            break; // Si encontramos cuentas, salir del loop
          }
        } catch (err: any) {
          console.warn(`⚠️ Intento ${attempt}/${maxAttempts}: Error obteniendo cuentas:`, err.message);
          if (attempt === maxAttempts) {
            console.error("❌ No se pudieron obtener cuentas después de todos los intentos");
          }
        }
      }
      
      // Si no hay cuentas, crear una automáticamente
      if (accounts.length === 0) {
        console.log("🔧 No se encontraron cuentas después de los intentos. Creando cuenta automáticamente...");
        
        // Método 1: Intentar usar ensure-email-account primero (más simple)
        let accountCreated = false;
        try {
          console.log("🔧 Método 1: Intentando ensureEmailAccount...");
          const result = await apiClient.ensureEmailAccount();
          console.log("✅ Resultado de ensureEmailAccount:", result);
          
          if (result.success && result.account) {
            console.log(`✅ Cuenta creada/asegurada: ${result.account.address} (ID: ${result.account.id})`);
            router.push(`/mailbox/${result.account.id}`);
            return true;
          }
        } catch (ensureError: any) {
          console.warn("⚠️ ensureEmailAccount falló:", ensureError.message);
          console.warn("⚠️ Intentando método alternativo...");
        }
        
        // Método 2: Crear cuenta directamente usando los endpoints de dominios y email-accounts
        if (!accountCreated) {
          try {
            console.log("🔧 Método 2: Creando cuenta directamente...");
            // Obtener la contraseña guardada o del formulario
            const userPassword = savedPassword || formData.password;
            
            if (!userPassword) {
              console.error("❌ No se pudo obtener la contraseña para crear la cuenta");
              // Intentar una vez más con ensureEmailAccount como último recurso
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const finalResult = await apiClient.ensureEmailAccount();
                if (finalResult.success && finalResult.account) {
                  router.push(`/mailbox/${finalResult.account.id}`);
                  return true;
                }
              } catch (finalError) {
                console.error("❌ Error en último intento:", finalError);
              }
              throw new Error("No se pudo obtener la contraseña para crear la cuenta");
            }
            
            const newAccount = await createEmailAccountAutomatically(currentUser.email, userPassword);
            console.log(`✅ Cuenta creada directamente: ${newAccount.address} (ID: ${newAccount.id})`);
            router.push(`/mailbox/${newAccount.id}`);
            return true;
          } catch (createError: any) {
            console.error("❌ Error creando cuenta directamente:", createError);
            
            // Intentar una vez más obtener las cuentas por si se creó en otro proceso
            for (let retry = 1; retry <= 3; retry++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 1000 * retry));
                const retryAccounts = await apiClient.getEmailAccounts();
                if (retryAccounts.length > 0) {
                  console.log(`✅ Cuenta encontrada después de reintento ${retry}: ${retryAccounts[0].address} (ID: ${retryAccounts[0].id})`);
                  router.push(`/mailbox/${retryAccounts[0].id}`);
                  return true;
                }
              } catch (retryError) {
                console.warn(`⚠️ Reintento ${retry} falló:`, retryError);
              }
            }
            
            toast.error("Error al crear tu cuenta de correo. Por favor, contacta con soporte.");
            router.push("/emails");
            return false;
          }
        }
      } else {
        // Si hay cuentas, redirigir a la primera
        console.log(`✅ Cuenta encontrada: ${accounts[0].address} (ID: ${accounts[0].id})`);
        console.log(`🚀 Redirigiendo al buzón: /mailbox/${accounts[0].id}`);
        router.push(`/mailbox/${accounts[0].id}`);
        return true;
      }
    } catch (err: any) {
      console.error("❌ Error crítico en redirectToMailbox:", err);
      console.error("Stack:", err.stack);
      toast.error("Error al redirigir. Por favor, intenta iniciar sesión nuevamente.");
      router.push("/auth");
      return false;
    }
    return false;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Agregar automáticamente @fylomail.es al nombre de usuario
      const email = formData.username.includes("@") 
        ? formData.username 
        : `${formData.username}@fylomail.es`;
      
      if (isLogin) {
        await login(email, formData.password);
      } else {
        if (!selectedPlan) {
          setError("Debes seleccionar un plan");
          setLoading(false);
          return;
        }
        if (!formData.name.trim()) {
          setError("El nombre es requerido");
          setLoading(false);
          return;
        }
        if (!formData.username.trim()) {
          setError("El nombre de usuario es requerido");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden");
          setLoading(false);
          return;
        }
        // Guardar la contraseña temporalmente para crear la cuenta de correo después
        setSavedPassword(formData.password);
        
        await register(formData.name, email, formData.password);
        // Esperar un momento para que la autenticación se complete
        await new Promise(resolve => setTimeout(resolve, 300));
        // Ir al paso de verificación de email
        await handleAccountCreated();
        return;
      }
      // Para login, redirigir directamente al buzón
      // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
      await redirectToMailbox();
    } catch (err: any) {
      setError(err.message || "Error al autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    // Siempre ir primero a crear cuenta
    setRegisterStep("create-account");
  };

  const handleBackToPlans = () => {
    setRegisterStep("select-plan");
    setSelectedPlan(null);
    setFormData({ ...formData, password: "", confirmPassword: "" });
  };

  const handleAccountCreated = async () => {
    // Guardar la categoría del plan en las preferencias del usuario
    if (selectedCategory && user?.id) {
      try {
        const userData = await apiClient.getMe();
        const currentPreferences = userData.user?.paymentDetails || {};
        await apiClient.updateProfile({
          paymentDetails: {
            ...currentPreferences,
            planCategory: selectedCategory,
          },
        });
      } catch (err) {
        console.error("Error guardando categoría del plan:", err);
      }
    }
    
    // Esperar un momento para que la autenticación se complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // NO pre-llenar el email - dejar que el usuario ingrese el suyo
    setVerificationEmail("");
    
    // Mostrar verificación de email - empezar en paso 1 (solicitar email)
    setShowEmailVerification(true);
    setVerificationStep("email");
    setRegisterStep("email-verification");
    setVerificationError(null);
    setVerificationCode("");
  };

  const handleSendVerificationCode = async (email?: string) => {
    const emailToVerify = email || verificationEmail;
    if (!emailToVerify || !emailToVerify.trim()) {
      setVerificationError("Por favor ingresa un correo electrónico válido");
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToVerify)) {
      setVerificationError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setSendingCode(true);
    setVerificationError(null);
    try {
      await apiClient.sendVerificationCode({ email: emailToVerify });
      toast.success("Código de verificación enviado a tu correo");
      // Cambiar al paso 2 (ingresar código)
      setVerificationStep("code");
    } catch (err: any) {
      setVerificationError(err.message || "Error al enviar el código");
      toast.error(err.message || "Error al enviar el código de verificación");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError("Por favor ingresa el código de verificación");
      return;
    }

    setVerifyingCode(true);
    setVerificationError(null);
    try {
      await apiClient.verifyEmailCode({
        email: verificationEmail,
        code: verificationCode,
      });
      
      toast.success("¡Email verificado exitosamente!");
      
      // Actualizar el estado del usuario para reflejar que el email está verificado
      await checkAuth();
      
      // Cerrar el modal de verificación
      setShowEmailVerification(false);
      setVerificationStep("email");
      setVerificationCode("");
      setVerificationEmail("");
      
      // Mostrar pantalla de "creando cuenta"
      setCreatingAccount(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular creación de cuenta
      setCreatingAccount(false);
      
      // Mostrar formulario de nombre a mostrar
      setShowDisplayNameForm(true);
      setDisplayName(user?.name || ""); // Pre-llenar con el nombre actual si existe
    } catch (err: any) {
      setVerificationError(err.message || "Código de verificación inválido");
      toast.error(err.message || "Código de verificación inválido");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Por favor ingresa un nombre a mostrar");
      return;
    }

    setSavingDisplayName(true);
    setRedirectingToMailbox(true);
    try {
      // Actualizar el perfil con el nombre a mostrar
      await apiClient.updateProfile({ name: displayName.trim() });
      
      // Actualizar el estado del usuario
      await checkAuth();
      
      toast.success("Nombre a mostrar guardado exitosamente");
      
      // Cerrar el formulario
      setShowDisplayNameForm(false);
      
      // Si el plan es gratuito, crear suscripción
      if (selectedPlan && selectedPlan.priceMonthly === 0) {
        try {
          await apiClient.createSubscription({
            planId: selectedPlan.id,
            billingPeriod,
          });
          console.log("✅ Suscripción gratuita creada exitosamente");
        } catch (err: any) {
          console.error("❌ Error al crear suscripción gratuita:", err);
          setError(err.message || "Error al activar el plan gratuito");
        }
      } else if (selectedPlan && selectedPlan.priceMonthly > 0) {
        // Si es plan de pago, ir a selección de método de pago
        setRegisterStep("select-payment");
        setRedirectingToMailbox(false);
        return;
      }
      
      // Redirigir directamente al buzón para TODOS los usuarios
      // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
      console.log("🚀 Redirigiendo después de guardar nombre a mostrar...");
      console.log("🔍 Categoría seleccionada:", selectedCategory);
      console.log("📧 La cuenta de correo ya fue creada automáticamente en el registro");
      
      // Esperar un momento para asegurar que el backend haya procesado todo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar autenticación para obtener datos frescos
      await checkAuth();
      
      // Para TODOS los usuarios, redirigir directamente al buzón de su cuenta de correo
      // (que se creó automáticamente con el email del registro)
      console.log("👤 Redirigiendo al buzón...");
      const success = await redirectToMailbox();
      if (!success) {
        // Si no se encontró la cuenta, intentar crearla manualmente o esperar más
        console.error("❌ No se encontró la cuenta. Intentando crear manualmente...");
        const { user: currentUser } = useAuthStore.getState();
        if (currentUser && currentUser.email) {
          // Intentar crear la cuenta manualmente como último recurso
          try {
            // Obtener dominios del usuario
            const domains = await apiClient.getDomains();
            if (domains.length > 0) {
              const domain = domains[0];
              // Crear la cuenta de correo manualmente
              await apiClient.createEmailAccount({
                domainId: domain.id,
                address: currentUser.email,
                password: formData.password, // Usar la contraseña del registro
              });
              console.log("✅ Cuenta de correo creada manualmente. Redirigiendo...");
              // Esperar un momento y redirigir
              await new Promise(resolve => setTimeout(resolve, 1000));
              const success2 = await redirectToMailbox();
              if (!success2) {
                toast.error("Error al crear tu cuenta de correo. Por favor, contacta con soporte.");
                router.push("/emails");
              }
            } else {
              toast.error("Error: No se encontró dominio. Por favor, contacta con soporte.");
              router.push("/emails");
            }
          } catch (createError: any) {
            console.error("❌ Error al crear cuenta manualmente:", createError);
            toast.error("Error al crear tu cuenta de correo. Por favor, contacta con soporte.");
            router.push("/emails");
          }
        } else {
          toast.error("Error: Usuario no encontrado. Por favor, inicia sesión nuevamente.");
          router.push("/auth");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el nombre a mostrar");
      setRedirectingToMailbox(false);
    } finally {
      setSavingDisplayName(false);
    }
  };

  const getStepNumber = () => {
    if (isLogin) return 0;
    if (registerStep === "select-plan") return 1;
    if (registerStep === "create-account") return 2;
    if (registerStep === "select-payment") return 3;
    if (registerStep === "payment") return 3;
    return 0;
  };

  const getTotalSteps = () => {
    if (isLogin) return 0;
    if (!selectedPlan) return 3; // Por defecto, asumimos 3 pasos hasta que se seleccione un plan
    if (selectedPlan.priceMonthly === 0) return 2; // Plan gratuito: plan + cuenta
    return 3; // Plan de pago: plan + cuenta + pago
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    // Validar datos de tarjeta si se selecciona ese método
    if (paymentMethod === "card") {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
        setError("Por favor completa todos los datos de la tarjeta");
        return;
      }
      // Validar formato de tarjeta (debe tener al menos 13 dígitos)
      const cardNumberDigits = cardData.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        setError("El número de tarjeta no es válido");
        return;
      }
      // Validar fecha de expiración
      const [month, year] = cardData.expiryDate.split("/");
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        setError("La fecha de expiración no es válida (formato: MM/AA)");
        return;
      }
      // Validar CVV
      if (cardData.cvv.length < 3) {
        setError("El CVV debe tener al menos 3 dígitos");
        return;
      }
    }

    setProcessingPayment(true);
    setError(null);

    try {
      // Si el plan es gratuito, crear suscripción directamente
      if (selectedPlan.priceMonthly === 0) {
        await apiClient.createSubscription({
          planId: selectedPlan.id,
          billingPeriod,
        });
        // Redirigir directamente al buzón para TODOS los usuarios
        // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
        await redirectToMailbox();
        return;
      }

      // Manejar diferentes métodos de pago
      if (paymentMethod === "paypal") {
        // Crear intención de pago primero
        const paymentIntent = await apiClient.createPaymentIntent({
          planId: selectedPlan.id,
          billingPeriod,
        });
        
        // En producción, aquí se construiría la URL de PayPal Checkout
        // Por ahora, mostramos un diálogo de confirmación
        const confirmPayPal = confirm(
          `¿Deseas proceder con el pago de $${getTotalPrice().toFixed(2)} a través de PayPal?\n\nSerás redirigido a PayPal para completar el pago.`
        );
        
        if (!confirmPayPal) {
          setProcessingPayment(false);
          return;
        }
        
        toast.info("Redirigiendo a PayPal...");
        
        // En producción, aquí se redirigiría a PayPal:
        // window.location.href = `https://www.paypal.com/checkoutnow?token=${paypalToken}`;
        
        // Simular redirección a PayPal (en producción, esto sería real)
        // Después de "volver" de PayPal, se procesaría el pago
        setTimeout(async () => {
          try {
            const result = await apiClient.processPayPalPayment({
              planId: selectedPlan.id,
              billingPeriod,
              paypalOrderId: `PAYPAL-${Date.now()}`,
            });
            
            toast.success(result.message || "¡Pago procesado exitosamente con PayPal!");
            // Redirigir directamente al buzón para TODOS los usuarios
            // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
            await redirectToMailbox();
          } catch (err: any) {
            setError(err.message || "Error al procesar el pago con PayPal");
            toast.error(err.message || "Error al procesar el pago con PayPal");
          } finally {
            setProcessingPayment(false);
          }
        }, 2000);
        return;
      }

      if (paymentMethod === "bank") {
        // Para transferencia bancaria, crear suscripción pendiente
        const result = await apiClient.processBankTransfer({
          planId: selectedPlan.id,
          billingPeriod,
        });
        
        toast.success(result.message);
        
        // Mostrar información bancaria completa en un alert
        const bankInfo = `INFORMACIÓN BANCARIA PARA TRANSFERENCIA:\n\n` +
          `Banco: ${result.bankDetails.bank}\n` +
          `Titular: ${result.bankDetails.accountHolder}\n` +
          `IBAN: ${result.bankDetails.iban}\n` +
          `SWIFT/BIC: ${result.bankDetails.swift}\n` +
          `Referencia: ${result.bankDetails.reference}\n` +
          `Importe: $${result.amount.toFixed(2)}\n` +
          `Período: ${billingPeriod === "monthly" ? "Mensual" : "Anual"}\n\n` +
          `⚠️ IMPORTANTE:\n` +
          `Envía el comprobante de transferencia a:\n` +
          `pagos@fylomail.es\n\n` +
          `Incluye tu referencia: ${result.bankDetails.reference}\n\n` +
          `Tu suscripción se activará en 24-48 horas después de verificar el pago.`;
        
        alert(bankInfo);
        
        toast.info(`Referencia: ${result.bankDetails.reference}`, { duration: 15000 });
        // Redirigir directamente al buzón para TODOS los usuarios
        // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
        await redirectToMailbox();
        return;
      }

      // Para tarjeta de crédito/débito
      if (paymentMethod === "card") {
        // Procesar pago con tarjeta
        const result = await apiClient.processCardPayment({
          planId: selectedPlan.id,
          billingPeriod,
          cardData: {
            cardNumber: cardData.cardNumber,
            cardHolder: cardData.cardHolder,
            expiryDate: cardData.expiryDate,
            cvv: cardData.cvv,
          },
        });

        toast.success(result.message || "¡Pago procesado exitosamente!");
        // Redirigir directamente al buzón para TODOS los usuarios
        // El dominio y la cuenta de correo ya se crearon automáticamente en el registro
        await redirectToMailbox();
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el pago");
      toast.error(err.message || "Error al procesar el pago");
    } finally {
      setProcessingPayment(false);
    }
  };

  const getTotalPrice = () => {
    if (!selectedPlan) return 0;
    const price = billingPeriod === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    return price || 0;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-border";
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-yellow-500";
    if (passwordStrength <= 3) return "bg-[#14b4a1]";
    return "bg-[#14b4a1]";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 1) return "Débil";
    if (passwordStrength <= 2) return "Regular";
    if (passwordStrength <= 3) return "Buena";
    return "Fuerte";
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await apiClient.forgotPassword(forgotPasswordEmail);
      toast.success(response.message);
      
      // Si estamos en desarrollo y recibimos el token, mostrar el paso de reset
      if (response.resetToken && process.env.NODE_ENV === "development") {
        setResetPasswordToken(response.resetToken);
        setResetStep("reset");
        toast.info("Token de desarrollo recibido. Puedes restablecer tu contraseña ahora.");
      } else {
        // En producción, solo mostramos el mensaje de éxito
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar restablecimiento de contraseña");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordData.password || !resetPasswordData.confirmPassword) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (resetPasswordData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setResetPasswordLoading(true);
    try {
      await apiClient.resetPassword(resetPasswordToken, resetPasswordData.password);
      toast.success("Contraseña restablecida exitosamente");
      setShowForgotPassword(false);
      setResetStep("request");
      setResetPasswordToken("");
      setResetPasswordData({ password: "", confirmPassword: "" });
      setForgotPasswordEmail("");
      setIsLogin(true);
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer la contraseña");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Verificar si hay token en la URL (para cuando el usuario hace clic en el enlace del email)
  // También verificar si viene de dashboard porque el email no está verificado
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const verify = params.get("verify");
      
      if (token) {
        setResetPasswordToken(token);
        setResetStep("reset");
        setShowForgotPassword(true);
        // Limpiar la URL
        window.history.replaceState({}, "", window.location.pathname);
      }
      
      // Si viene de dashboard porque el email no está verificado
      if (verify === "true" && isAuthenticated && user && user.emailVerified === false) {
        // NO pre-llenar el email - dejar que el usuario ingrese el suyo
        setVerificationEmail("");
        setShowEmailVerification(true);
        setVerificationStep("email");
        setRegisterStep("email-verification");
        // Limpiar la URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#14b4a1]" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado y es login (no registro), mostrar pantalla de carga mientras redirigimos
  // Solo si el email está verificado
  if (isAuthenticated && isLogin && user && user.emailVerified !== false) {
    // Mostrar pantalla de carga mientras redirigimos
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#13282b] via-[#13282b] to-[#0a1a1c]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#14b4a1] mx-auto mb-4" />
          <p className="text-white/80 text-lg">Redirigiendo a tu buzón...</p>
        </div>
      </div>
    );
  }
  
  // Si está autenticado pero está en registro con pago pendiente o verificación, continuar mostrando el formulario
  // NO ocultar si estamos mostrando el formulario de nombre a mostrar, la pantalla de creación de cuenta, o estamos redirigiendo
  if (isAuthenticated && !isLogin && registerStep !== "select-payment" && registerStep !== "create-account" && registerStep !== "email-verification" && !showDisplayNameForm && !creatingAccount && !redirectingToMailbox) {
    return null;
  }
  
  // Mostrar pantalla de carga mientras redirigimos (para otros casos)
  if (redirectingToMailbox) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#13282b] via-[#13282b] to-[#0a1a1c]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#14b4a1] mx-auto mb-4" />
          <p className="text-white/80 text-lg">Redirigiendo a tu buzón...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background dinámico global */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-[#14b4a1]/10 blur-[120px] animate-float"
          style={{
            left: `${mousePosition.x / 20 - 300}px`,
            top: `${mousePosition.y / 20 - 300}px`,
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full bg-[#13282b]/8 blur-[100px] animate-float-delayed"
          style={{
            right: `${mousePosition.x / 25 - 250}px`,
            bottom: `${mousePosition.y / 25 - 250}px`,
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </div>

      {/* Left Side - Diseño Innovador */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#13282b] via-[#13282b] to-[#14b4a1]/30">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,180,161,0.2),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,180,161,0.15),transparent_60%)]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(to right, #14b4a1 1px, transparent 1px),
              linear-gradient(to bottom, #14b4a1 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
              </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          <div className="max-w-lg space-y-10">
            {/* Logo Grande */}
            <Link href="/" className="flex items-center justify-center mb-12 group">
              <img
                src="/ln.png"
                alt="Fylo Mail Logo"
                className="h-32 w-auto object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
              />
            </Link>
            
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                <Sparkles className="w-4 h-4 text-[#14b4a1]" />
                <span className="text-sm font-semibold text-[#14b4a1]">
                  {isLogin ? "ACCESO SEGURO" : "REGISTRO GRATUITO"}
                </span>
            </div>
            
              <h2 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                {isLogin ? (
                  <>
                    <span className="block">Bienvenido</span>
                    <span className="block text-[#14b4a1]">de vuelta</span>
                  </>
                ) : registerStep === "select-plan" ? (
                  <>
                    <span className="block">Elige tu</span>
                    <span className="block text-[#14b4a1]">plan</span>
                  </>
                ) : registerStep === "select-payment" ? (
                  <>
                    <span className="block">Método de</span>
                    <span className="block text-[#14b4a1]">pago</span>
                  </>
                ) : registerStep === "payment" ? (
                  <>
                    <span className="block">Completa</span>
                    <span className="block text-[#14b4a1]">tu pago</span>
                  </>
                ) : (
                  <>
                    <span className="block">Crea tu</span>
                    <span className="block text-[#14b4a1]">cuenta Fylo</span>
                  </>
                )}
              </h2>
              
              <p className="text-white/80 text-lg leading-relaxed max-w-md mx-auto">
                {isLogin
                  ? "Gestiona tus correos electrónicos de manera profesional y eficiente. Accede a todas tus cuentas desde un solo lugar."
                  : registerStep === "select-plan"
                    ? "Selecciona el plan perfecto para ti. Puedes cambiarlo en cualquier momento."
                    : "Completa tus datos para crear tu cuenta Fylo y comenzar a usar nuestro servicio de correo electrónico profesional."}
              </p>
            </div>

            {/* Features Cards Mejoradas */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="group bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:border-[#14b4a1]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#14b4a1]/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
              </div>
                <p className="text-base font-bold mb-1">Seguro</p>
                <p className="text-xs text-white/70">Encriptación E2E</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:border-[#14b4a1]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#14b4a1]/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14b4a1] to-[#13282b] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="text-base font-bold mb-1">Rápido</p>
                <p className="text-xs text-white/70">Sincronización instantánea</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated background elements mejorados */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#14b4a1]/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-[#14b4a1]/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#13282b]/20 rounded-full blur-2xl animate-pulse-glow" />
      </div>

      {/* Right Side - Form Mejorado */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo Grande */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex items-center justify-center mb-6 group">
              <img
                src="/ln.png"
                alt="Fylo Mail Logo"
                className="h-32 w-auto object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
              />
            </Link>
              </div>

          {/* Form Container Mejorado */}
          <div className="space-y-6">
            {/* Indicador de Progreso - Discreto */}
            {!isLogin && getTotalSteps() > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3].slice(0, getTotalSteps()).map((step, index) => {
                  const stepNum = index + 1;
                  const currentStep = getStepNumber();
                  const isActive = stepNum === currentStep;
                  const isCompleted = stepNum < currentStep;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                            isCompleted
                              ? "bg-[#14b4a1] text-white"
                              : isActive
                              ? "bg-[#14b4a1] text-white ring-2 ring-[#14b4a1]/30 scale-110"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            stepNum
                          )}
            </div>
                        <span className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                          isActive ? "text-[#14b4a1] font-semibold" : "text-muted-foreground"
                        }`}>
                          {stepNum === 1 ? "Plan" : stepNum === 2 ? "Cuenta" : "Pago"}
                        </span>
          </div>
                      {stepNum < getTotalSteps() && (
                        <div className={`w-10 h-0.5 mx-1 transition-colors duration-300 ${
                          isCompleted ? "bg-[#14b4a1]" : "bg-muted/50"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14b4a1]/10 border border-[#14b4a1]/20 mb-4 lg:hidden">
                <Sparkles className="w-4 h-4 text-[#14b4a1]" />
                <span className="text-xs font-semibold text-[#14b4a1]">
                  {isLogin ? "ACCESO SEGURO" : "REGISTRO GRATUITO"}
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-2">
                {isLogin 
                  ? "Inicia sesión" 
                  : registerStep === "select-plan" 
                    ? "Selecciona tu plan" 
                    : registerStep === "select-payment"
                      ? "Método de pago"
                      : registerStep === "payment"
                        ? "Completa tu pago"
                        : "Crea tu cuenta Fylo"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Ingresa tus credenciales para continuar"
                  : registerStep === "select-plan"
                    ? "Elige el plan que mejor se adapte a tus necesidades"
                    : registerStep === "select-payment"
                      ? "Elige cómo deseas pagar tu suscripción"
                      : registerStep === "payment"
                        ? "Revisa tu plan y selecciona tu método de pago"
                        : "Completa el formulario para crear tu cuenta"}
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-xl border-2 border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-[#14b4a1]/10 transition-all duration-300">
              {/* Selección de Plan - Solo en registro */}
              {!isLogin && registerStep === "select-plan" ? (
                <div className="space-y-5">
                  {/* Header compacto */}
                  <div className="text-center">
                    <h3 className="text-xl font-extrabold text-foreground mb-1">
                      Elige tu plan
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el que mejor se adapte a ti
                    </p>
                  </div>

                  {/* Selector de categoría compacto */}
                  <div className="flex gap-1.5 p-1 bg-muted/30 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("personas")}
                      className={`flex-1 py-2 px-3 rounded-md font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        selectedCategory === "personas"
                          ? "bg-[#14b4a1] text-white shadow-md shadow-[#14b4a1]/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Personas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("empresas")}
                      className={`flex-1 py-2 px-3 rounded-md font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        selectedCategory === "empresas"
                          ? "bg-[#14b4a1] text-white shadow-md shadow-[#14b4a1]/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Empresas
                    </button>
                  </div>

                  {/* Lista de planes compacta e innovadora */}
                  {loadingPlans ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#14b4a1]" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                      {plans
                        .filter((plan) => {
                          // Filtrar planes según categoría seleccionada
                          return plan.category === selectedCategory && plan.isActive;
                        })
                        .map((plan) => {
                          const isFree = plan.priceMonthly === 0;
                          const isSelected = selectedPlan?.id === plan.id;
                          
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => handlePlanSelect(plan)}
                              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden ${
                                isSelected
                                  ? "border-[#14b4a1] bg-gradient-to-br from-[#14b4a1]/10 via-[#14b4a1]/5 to-transparent shadow-lg shadow-[#14b4a1]/20 scale-[1.02]"
                                  : "border-border/50 hover:border-[#14b4a1]/50 bg-card hover:bg-[#14b4a1]/5 hover:shadow-md hover:shadow-[#14b4a1]/10"
                              }`}
                            >
                              {/* Indicador de selección */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#14b4a1] flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-3">
                                {/* Información principal */}
                                <div className="flex-1 min-w-0">
                                  {/* Nombre y precio */}
                                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                                    <h4 className={`font-extrabold text-base truncate ${
                                      isSelected ? "text-[#14b4a1]" : "text-foreground group-hover:text-[#14b4a1]"
                                    } transition-colors`}>
                                      {plan.name}
                                    </h4>
                                    <div className="flex items-baseline gap-1 flex-shrink-0">
                                      {isFree ? (
                                        <span className="text-lg font-extrabold text-[#14b4a1]">$0</span>
                                      ) : (
                                        <>
                                          <span className="text-lg font-extrabold text-[#14b4a1]">
                                            ${plan.priceMonthly}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">/mes</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Descripción compacta */}
                                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
                                    {plan.description || "Plan completo con todas las características"}
                                  </p>

                                  {/* Características principales - compactas */}
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Check className="w-3 h-3 text-[#14b4a1] flex-shrink-0" />
                                      <span className="truncate">{plan.maxEmails} correo{plan.maxEmails !== 1 ? "s" : ""}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Check className="w-3 h-3 text-[#14b4a1] flex-shrink-0" />
                                      <span className="truncate">{plan.maxDomains} dominio{plan.maxDomains !== 1 ? "s" : ""}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Check className="w-3 h-3 text-[#14b4a1] flex-shrink-0" />
                                      <span className="truncate">{plan.maxStorageGB} GB</span>
                                    </div>
                                  </div>

                                  {/* Ahorro anual si aplica */}
                                  {plan.priceYearly > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/30">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">Plan anual:</span>
                                        <span className="text-[11px] font-bold text-[#14b4a1]">
                                          ${plan.priceYearly}/año
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-[#14b4a1] font-medium mt-0.5">
                                        Ahorra ${((plan.priceMonthly * 12) - plan.priceYearly).toFixed(2)}/año
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Flecha de acción */}
                                <div className={`flex-shrink-0 transition-all duration-300 ${
                                  isSelected 
                                    ? "text-[#14b4a1]" 
                                    : "text-muted-foreground group-hover:text-[#14b4a1] group-hover:translate-x-0.5"
                                }`}>
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Ayuda contextual */}
                  <div className="mt-4 p-3 rounded-lg bg-[#14b4a1]/5 border border-[#14b4a1]/20">
                    <p className="text-[11px] text-muted-foreground text-center">
                      <span className="font-semibold text-[#14b4a1]">💡 Tip:</span> Puedes cambiar de plan en cualquier momento desde tu cuenta
                    </p>
                  </div>
                </div>
              ) : !isLogin && registerStep === "select-payment" ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-extrabold text-foreground mb-2">
                      Selecciona tu método de pago
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Elige cómo deseas pagar tu suscripción
                    </p>
                  </div>

                  {/* Resumen del Plan */}
                  {selectedPlan && (
                    <div className="border-2 border-[#14b4a1]/30 rounded-xl p-5 bg-gradient-to-br from-[#14b4a1]/5 to-transparent">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-extrabold text-lg text-foreground">{selectedPlan.name}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBillingPeriod("monthly")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              billingPeriod === "monthly"
                                ? "bg-[#14b4a1] text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            1 mes
                          </button>
                          {selectedPlan.priceYearly > 0 && (
                            <button
                              type="button"
                              onClick={() => setBillingPeriod("yearly")}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                billingPeriod === "yearly"
                                  ? "bg-[#14b4a1] text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              12 meses
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-[#14b4a1]/20">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan seleccionado</span>
                          <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Período</span>
                          <span className="font-semibold text-foreground">
                            {billingPeriod === "monthly" ? "Mensual" : "Anual"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-lg pt-2 border-t border-[#14b4a1]/20">
                          <span className="font-extrabold text-foreground">Total</span>
                          <span className="font-extrabold text-2xl text-[#14b4a1]">
                            ${getTotalPrice().toFixed(2)}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && selectedPlan.priceYearly > 0 && (
                          <p className="text-xs text-[#14b4a1] font-medium mt-2">
                            Ahorras ${((selectedPlan.priceMonthly * 12) - selectedPlan.priceYearly).toFixed(2)} al año
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Métodos de Pago */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-lg text-foreground">Método de pago</h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "card"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "card" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "card" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">Tarjeta de crédito/débito</div>
                            <div className="text-xs text-muted-foreground">Visa, Mastercard, American Express</div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-8 h-5 bg-blue-600 rounded text-white text-[10px] flex items-center justify-center font-bold">VISA</div>
                            <div className="w-8 h-5 bg-orange-500 rounded text-white text-[10px] flex items-center justify-center font-bold">MC</div>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "paypal"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "paypal" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "paypal" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">PayPal</div>
                            <div className="text-xs text-muted-foreground">Paga con tu cuenta PayPal</div>
                          </div>
                          <div className="text-blue-600 font-bold">PayPal</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bank")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "bank"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "bank" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "bank" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">Transferencia bancaria</div>
                            <div className="text-xs text-muted-foreground">Pago directo desde tu banco</div>
                          </div>
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Formulario de Tarjeta */}
                  {paymentMethod === "card" && (
                    <div className="border-2 border-[#14b4a1]/30 rounded-xl p-5 bg-gradient-to-br from-card/50 to-transparent space-y-4">
                      <h4 className="font-extrabold text-lg text-foreground">Datos de la tarjeta</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="cardNumber" className="text-sm font-semibold text-foreground">
                            Número de tarjeta
                          </label>
                          <Input
                            id="cardNumber"
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardData.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                              const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                              setCardData({ ...cardData, cardNumber: formatted });
                            }}
                            maxLength={19}
                            className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="cardHolder" className="text-sm font-semibold text-foreground">
                            Nombre del titular
                          </label>
                          <Input
                            id="cardHolder"
                            type="text"
                            placeholder="JUAN PEREZ"
                            value={cardData.cardHolder}
                            onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                            className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="expiryDate" className="text-sm font-semibold text-foreground">
                              Fecha de expiración
                            </label>
                            <Input
                              id="expiryDate"
                              type="text"
                              placeholder="MM/AA"
                              value={cardData.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                }
                                setCardData({ ...cardData, expiryDate: value });
                              }}
                              maxLength={5}
                              className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="cvv" className="text-sm font-semibold text-foreground">
                              CVV
                            </label>
                            <Input
                              id="cvv"
                              type="text"
                              placeholder="123"
                              value={cardData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                setCardData({ ...cardData, cvv: value });
                              }}
                              maxLength={4}
                              className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información de PayPal */}
                  {paymentMethod === "paypal" && (
                    <div className="border-2 border-[#14b4a1]/30 rounded-xl p-5 bg-gradient-to-br from-card/50 to-transparent space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-lg text-foreground">Pagar con PayPal</h4>
                          <p className="text-sm text-muted-foreground">Serás redirigido a PayPal para completar el pago</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                          <strong>Nota:</strong> Al hacer clic en "Pagar con PayPal", serás redirigido al sitio web de PayPal para iniciar sesión y completar tu pago de forma segura.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Información de Transferencia Bancaria */}
                  {paymentMethod === "bank" && (
                    <div className="border-2 border-[#14b4a1]/30 rounded-xl p-5 bg-gradient-to-br from-card/50 to-transparent space-y-4">
                      <h4 className="font-extrabold text-lg text-foreground">Datos bancarios</h4>
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Banco:</span>
                            <span className="text-sm font-bold text-foreground text-right">Banco Fylo</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Titular:</span>
                            <span className="text-sm font-bold text-foreground text-right">Fylo Mail S.L.</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">IBAN:</span>
                            <span className="text-sm font-bold text-foreground text-right font-mono">ES91 2100 0418 4502 0005 1332</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">SWIFT/BIC:</span>
                            <span className="text-sm font-bold text-foreground text-right font-mono">CAIXESBBXXX</span>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">Concepto:</span>
                            <span className="text-sm font-bold text-[#14b4a1] text-right">Suscripción {selectedPlan?.name || "Plan"}</span>
                          </div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                          <p className="text-sm text-yellow-900 dark:text-yellow-200">
                            <strong>Importante:</strong> Después de realizar la transferencia, envía el comprobante a <strong>pagos@fylomail.es</strong> con tu número de referencia. Tu suscripción se activará en un plazo de 24-48 horas después de verificar el pago.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handlePayment}
                    className="w-full h-14 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] transition-all shadow-lg hover:shadow-xl hover:shadow-[#14b4a1]/50 rounded-xl font-semibold text-base group relative overflow-hidden"
                    disabled={processingPayment || (paymentMethod === "card" && (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv))}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando pago...
                        </>
                      ) : paymentMethod === "paypal" ? (
                        <>
                          Pagar con PayPal
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          Comenzar a usar Fylo Mail
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </Button>
                </div>
              ) : !isLogin && registerStep === "payment" ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-extrabold text-foreground mb-2">
                      Completa tu pago
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Revisa tu plan y selecciona tu método de pago
                    </p>
                  </div>

                  {/* Resumen del Plan */}
                  {selectedPlan && (
                    <div className="border-2 border-[#14b4a1]/30 rounded-xl p-5 bg-gradient-to-br from-[#14b4a1]/5 to-transparent">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-extrabold text-lg text-foreground">{selectedPlan.name}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBillingPeriod("monthly")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              billingPeriod === "monthly"
                                ? "bg-[#14b4a1] text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            1 mes
                          </button>
                          {selectedPlan.priceYearly > 0 && (
                            <button
                              type="button"
                              onClick={() => setBillingPeriod("yearly")}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                billingPeriod === "yearly"
                                  ? "bg-[#14b4a1] text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              12 meses
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-[#14b4a1]/20">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan seleccionado</span>
                          <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Período</span>
                          <span className="font-semibold text-foreground">
                            {billingPeriod === "monthly" ? "Mensual" : "Anual"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-lg pt-2 border-t border-[#14b4a1]/20">
                          <span className="font-extrabold text-foreground">Total</span>
                          <span className="font-extrabold text-2xl text-[#14b4a1]">
                            ${getTotalPrice().toFixed(2)}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && selectedPlan.priceYearly > 0 && (
                          <p className="text-xs text-[#14b4a1] font-medium mt-2">
                            Ahorras ${((selectedPlan.priceMonthly * 12) - selectedPlan.priceYearly).toFixed(2)} al año
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Métodos de Pago */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-lg text-foreground">Método de pago</h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "card"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "card" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "card" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">Tarjeta de crédito/débito</div>
                            <div className="text-xs text-muted-foreground">Visa, Mastercard, American Express</div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-8 h-5 bg-blue-600 rounded text-white text-[10px] flex items-center justify-center font-bold">VISA</div>
                            <div className="w-8 h-5 bg-orange-500 rounded text-white text-[10px] flex items-center justify-center font-bold">MC</div>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "paypal"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "paypal" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "paypal" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">PayPal</div>
                            <div className="text-xs text-muted-foreground">Paga con tu cuenta PayPal</div>
                          </div>
                          <div className="text-blue-600 font-bold">PayPal</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bank")}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "bank"
                            ? "border-[#14b4a1] bg-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === "bank" ? "border-[#14b4a1]" : "border-border"
                          }`}>
                            {paymentMethod === "bank" && (
                              <div className="w-3 h-3 rounded-full bg-[#14b4a1]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">Transferencia bancaria</div>
                            <div className="text-xs text-muted-foreground">Pago directo desde tu banco</div>
                          </div>
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handlePayment}
                    className="w-full h-14 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] transition-all shadow-lg hover:shadow-xl hover:shadow-[#14b4a1]/50 rounded-xl font-semibold text-base group relative overflow-hidden"
                    disabled={processingPayment}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando pago...
                        </>
                      ) : (
                        <>
                          Comenzar a usar Fylo Mail
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setRegisterStep("create-account")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 p-3 rounded-lg hover:bg-[#14b4a1]/5"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Volver a datos de cuenta
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-[#14b4a1]" />
                      Nombre completo
                    </label>
                    <div className="relative group">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        className={`pl-11 h-12 rounded-xl border-2 transition-all ${
                          focusedField === "name"
                            ? "border-[#14b4a1] ring-2 ring-[#14b4a1]/20 shadow-lg shadow-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                        required={!isLogin}
                      />
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[#14b4a1]" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#14b4a1]" />
                    Nombre de usuario
                  </label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder="tu-nombre"
                      value={formData.username}
                      onChange={(e) => {
                        // Remover @fylomail.es si el usuario lo escribe
                        const value = e.target.value.replace(/@fylomail\.es$/i, "").replace(/@/g, "");
                        setFormData({ ...formData, username: value });
                      }}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      className={`pl-11 pr-24 h-12 rounded-xl border-2 transition-all ${
                        focusedField === "username"
                          ? "border-[#14b4a1] ring-2 ring-[#14b4a1]/20 shadow-lg shadow-[#14b4a1]/10"
                          : "border-border hover:border-[#14b4a1]/50"
                      }`}
                      required
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[#14b4a1]" />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#14b4a1] pointer-events-none">
                      @fylomail.es
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Tu correo será:</span>
                    <span className="font-semibold text-[#14b4a1]">
                      {formData.username ? `${formData.username}@fylomail.es` : "nombre@fylomail.es"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#14b4a1]" />
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`pl-11 h-12 rounded-xl border-2 transition-all ${
                        focusedField === "password"
                          ? "border-[#14b4a1] ring-2 ring-[#14b4a1]/20 shadow-lg shadow-[#14b4a1]/10"
                          : "border-border hover:border-[#14b4a1]/50"
                      }`}
                      required
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[#14b4a1]" />
                  </div>
                  
                  {/* Enlace Olvidé mi contraseña - Solo en login */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-[#14b4a1] hover:underline font-medium transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}
                  
                  {!isLogin && formData.password && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Seguridad de contraseña</span>
                        <span className={`font-medium ${
                          passwordStrength <= 1 ? "text-red-500" :
                          passwordStrength <= 2 ? "text-yellow-500" :
                          passwordStrength <= 3 ? "text-[#14b4a1]" :
                          "text-[#14b4a1]"
                        }`}>
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      <div className="flex gap-1 h-1.5 bg-border rounded-full overflow-hidden">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 transition-all duration-300 ${
                              i < passwordStrength
                                ? getPasswordStrengthColor()
                                : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo de confirmación de contraseña - Solo en registro */}
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#14b4a1]" />
                      Confirmar contraseña
                    </label>
                    <div className="relative group">
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        className={`pl-11 h-12 rounded-xl border-2 transition-all ${
                          focusedField === "confirmPassword"
                            ? "border-[#14b4a1] ring-2 ring-[#14b4a1]/20 shadow-lg shadow-[#14b4a1]/10"
                            : "border-border hover:border-[#14b4a1]/50"
                        }`}
                        required={!isLogin}
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[#14b4a1]" />
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Las contraseñas no coinciden
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0 && (
                      <p className="text-xs text-[#14b4a1] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Las contraseñas coinciden
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] transition-all shadow-lg hover:shadow-xl hover:shadow-[#14b4a1]/50 rounded-xl font-semibold text-base group relative overflow-hidden"
                  disabled={loading || (!isLogin && !selectedPlan)}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                      {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
                    </>
                  ) : (
                    <>
                        {isLogin ? "Iniciar sesión" : "Crear cuenta Fylo"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </form>
              )}

              {!isLogin && registerStep === "create-account" && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <button
                    type="button"
                    onClick={handleBackToPlans}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 group p-3 rounded-lg hover:bg-[#14b4a1]/5"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Volver a seleccionar plan
                  </button>
                </div>
              )}

              {!isLogin && registerStep === "select-payment" && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setRegisterStep("create-account")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 group p-3 rounded-lg hover:bg-[#14b4a1]/5"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Volver a datos de cuenta
                  </button>
                </div>
              )}


              <div className="mt-6 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setFormData({ name: "", username: "", password: "", confirmPassword: "" });
                    setFocusedField(null);
                    setRegisterStep("select-plan");
                    setSelectedPlan(null);
                    setSelectedCategory("personas");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 group p-3 rounded-lg hover:bg-[#14b4a1]/5"
                >
                  {isLogin ? (
                    <>
                      ¿No tienes cuenta?{" "}
                      <span className="font-semibold text-[#14b4a1] group-hover:underline">
                        Regístrate ahora
                      </span>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <span className="font-semibold text-[#14b4a1] group-hover:underline">
                        Inicia sesión
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-center text-muted-foreground">
              Al {isLogin ? "iniciar sesión" : "registrarte"}, aceptas nuestros{" "}
              <a href="#" className="underline hover:text-[#14b4a1] transition-colors">
                Términos de servicio
              </a>{" "}
              y{" "}
              <a href="#" className="underline hover:text-[#14b4a1] transition-colors">
                Política de privacidad
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Restablecimiento de Contraseña */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md rounded-2xl border-2 border-[#14b4a1]/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-[#14b4a1]" />
              {resetStep === "request" ? "Restablecer contraseña" : "Nueva contraseña"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {resetStep === "request" 
                ? "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
                : "Ingresa tu nueva contraseña. Asegúrate de que sea segura."}
            </DialogDescription>
          </DialogHeader>

          {resetStep === "request" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#14b4a1]" />
                  Correo electrónico
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu-correo@fylomail.es"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remover @fylomail.es si el usuario lo escribe
                    value = value.replace(/@fylomail\.es$/i, "").replace(/@/g, "");
                    setForgotPasswordEmail(value);
                  }}
                  className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleForgotPassword();
                    }
                  }}
                />
                {forgotPasswordEmail && (
                  <p className="text-xs text-muted-foreground">
                    Tu correo será: <span className="font-semibold text-[#14b4a1]">{forgotPasswordEmail}@fylomail.es</span>
                  </p>
                )}
              </div>

              <Button
                onClick={handleForgotPassword}
                disabled={forgotPasswordLoading || !forgotPasswordEmail.trim()}
                className="w-full h-12 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] rounded-xl font-semibold"
              >
                {forgotPasswordLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar enlace de restablecimiento
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#14b4a1]" />
                  Nueva contraseña
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={resetPasswordData.password}
                  onChange={(e) =>
                    setResetPasswordData({ ...resetPasswordData, password: e.target.value })
                  }
                  className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#14b4a1]" />
                  Confirmar contraseña
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })
                  }
                  className="h-12 rounded-xl border-2 border-border focus:border-[#14b4a1] focus:ring-2 focus:ring-[#14b4a1]/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleResetPassword();
                    }
                  }}
                />
                {resetPasswordData.confirmPassword && resetPasswordData.password !== resetPasswordData.confirmPassword && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetStep("request");
                    setResetPasswordData({ password: "", confirmPassword: "" });
                  }}
                  className="flex-1 h-12 rounded-xl border-2"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordLoading || !resetPasswordData.password || !resetPasswordData.confirmPassword || resetPasswordData.password !== resetPasswordData.confirmPassword}
                  className="flex-1 h-12 bg-[#14b4a1] text-white hover:bg-[#0f9d8a] rounded-xl font-semibold"
                >
                  {resetPasswordLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Restableciendo...
                    </>
                  ) : (
                    <>
                      Restablecer contraseña
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />

      {/* Modal de Verificación de Email */}
      <Dialog open={showEmailVerification} onOpenChange={(open) => {
        if (!open && !verifyingCode) {
          setShowEmailVerification(false);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-2 border-[#14b4a1]/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Verificación Humana
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              El correo electrónico sólo se usará para esta verificación única.{" "}
              <a href="#" className="text-[#14b4a1] hover:underline">Más información</a>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {verificationStep === "email" ? (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Dirección de correo
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      disabled={sendingCode}
                      className="flex-1"
                      placeholder="tu@email.com"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && verificationEmail.trim() && !sendingCode) {
                          handleSendVerificationCode();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => handleSendVerificationCode()}
                      disabled={sendingCode || !verificationEmail.trim()}
                      className="px-6 bg-[#14b4a1] hover:bg-[#0f9d8a] text-white font-semibold"
                    >
                      {sendingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar código"
                      )}
                    </Button>
                  </div>
                </div>

                {verificationError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600 dark:text-red-400">{verificationError}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Código de verificación
                  </label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={verifyingCode}
                    className="text-center text-lg font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && verificationCode.length === 6 && !verifyingCode) {
                        handleVerifyCode();
                      }
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Ingresa el código de 6 dígitos enviado a <span className="font-semibold text-[#14b4a1]">{verificationEmail}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStep("email");
                      setVerificationCode("");
                      setVerificationError(null);
                    }}
                    className="text-xs text-[#14b4a1] hover:underline mt-2 w-full text-center"
                  >
                    Cambiar correo electrónico
                  </button>
                </div>

                {verificationError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600 dark:text-red-400">{verificationError}</p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyingCode || !verificationCode.trim() || verificationCode.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold rounded-xl shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar código"
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pantalla de "Creando cuenta" */}
      {creatingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl">
          <div className="text-center space-y-6">
            <Loader2 className="w-16 h-16 animate-spin text-[#14b4a1] mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Creando cuenta</h2>
              <p className="text-muted-foreground">Por favor espera un momento...</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nombre a Mostrar */}
      <Dialog open={showDisplayNameForm} onOpenChange={(open) => {
        if (!open && !savingDisplayName) {
          // No permitir cerrar mientras se guarda
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-2 border-[#14b4a1]/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground">
              Establece un nombre para mostrar
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Para empezar, elige un Nombre a mostrar. Será el nombre que verán las demás personas cuando les envíes un correo, las invites a un evento o compartas archivos con ellas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Nombre a mostrar
              </label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={savingDisplayName}
                className="w-full h-12 text-base"
                placeholder="Tu nombre"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && displayName.trim() && !savingDisplayName) {
                    handleSaveDisplayName();
                  }
                }}
                autoFocus
              />
            </div>

            <Button
              type="button"
              onClick={handleSaveDisplayName}
              disabled={savingDisplayName || !displayName.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#14b4a1] to-[#0f9d8a] hover:from-[#0f9d8a] hover:to-[#14b4a1] text-white font-bold rounded-xl shadow-lg shadow-[#14b4a1]/30 hover:shadow-xl hover:shadow-[#14b4a1]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingDisplayName ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


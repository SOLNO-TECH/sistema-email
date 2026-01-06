const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Auth interfaces
export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  paymentMethod?: string;
  emailVerified?: boolean;
  preferences?: string;
  paymentDetails?: {
    type?: string;
    last4?: string;
    brand?: string;
    bankName?: string;
    accountHolder?: string;
    [key: string]: any;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name?: string;
  email: string;
  password: string;
}

// Domain interfaces
export interface Domain {
  id: number;
  domainName: string;
  userId: number;
  dnsVerified: boolean;
  mxRecord?: string | null;
  spfRecord?: string | null;
  dkimRecord?: string | null;
  dmarcRecord?: string | null;
  lastDnsCheck?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AddDomainRequest {
  domainName: string;
}

// Email interfaces
export interface Email {
  id: number;
  to: string;
  subject: string;
  message: string;
  date: string | Date;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  data: Email;
}

// Email Account interfaces
export interface EmailAccount {
  id: number;
  address: string;
  domainId: number;
  domainName?: string;
  storageUsed?: number; // Almacenamiento usado en GB
}

export interface CreateEmailAccountRequest {
  domainId: number;
  address: string;
  password: string;
}

// Mailbox interfaces
export interface EmailAttachment {
  id: number;
  emailId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  contentId?: string | null;
  createdAt: string;
}

export interface InboxEmail {
  id: number;
  emailAccountId: number;
  from: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string | null;
  isRead: boolean;
  isSent: boolean;
  messageId?: string | null;
  inReplyTo?: string | null;
  priority?: string | null;
  receivedAt: string | Date;
  sentAt?: string | Date | null;
  // Nuevas funcionalidades
  isStarred?: boolean;
  isArchived?: boolean;
  isSpam?: boolean;
  isImportant?: boolean;
  isDraft?: boolean;
  isDeleted?: boolean;
  folderId?: number | null;
  labels?: string | null; // JSON string
  scheduledFor?: string | Date | null;
  attachments?: EmailAttachment[];
}

// Plan interfaces
export interface Plan {
  id: number;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmails: number;
  maxStorageGB: number;
  maxDomains: number;
  features?: string;
  category: string; // "personas" o "empresas"
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  plan: string;
  startDate: string;
  endDate?: string;
  Plan?: Plan;
}

export interface UserLimits {
  maxEmails: number;
  maxStorageGB: number;
  maxDomains: number;
  currentEmails: number;
  currentDomains: number;
  currentStorageGB: number;
}

// Admin interfaces
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  Domain: Array<{
    id: number;
    domainName: string;
    dnsVerified: boolean;
    createdAt: string;
  }>;
  EmailAccounts: Array<{
    id: number;
    address: string;
    storageUsed: number;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: number;
    plan: string;
    startDate: string;
    endDate?: string;
    Plan?: {
      name: string;
      priceMonthly: number;
      priceYearly: number;
    };
  }>;
  invoices: Array<{
    id: number;
    createdAt: string;
  }>;
  _count: {
    Domain: number;
    EmailAccounts: number;
    subscriptions: number;
    invoices: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  Domain: Array<{
    id: number;
    domainName: string;
    dnsVerified: boolean;
    createdAt: string;
    emailAccounts: Array<{
      id: number;
      address: string;
      storageUsed: number;
      createdAt: string;
    }>;
  }>;
  EmailAccounts: Array<{
    id: number;
    address: string;
    storageUsed: number;
    createdAt: string;
    domain: {
      domainName: string;
    };
  }>;
  subscriptions: Array<{
    id: number;
    plan: string;
    startDate: string;
    endDate?: string;
    Plan?: {
      name: string;
      description?: string;
      priceMonthly: number;
      priceYearly: number;
      maxEmails: number;
      maxStorageGB: number;
      maxDomains: number;
    };
  }>;
  invoices: Array<{
    id: number;
    createdAt: string;
  }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          // Intentar leer como texto primero
          const errorText = await response.text();
          if (errorText) {
            try {
              // Intentar parsear como JSON
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.error || parsed.message || errorMessage;
            } catch {
              // Si no es JSON, usar el texto directamente
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (e) {
          // Si falla leer el texto, usar el mensaje por defecto
          console.error("Error reading error response:", e);
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log(`🔍 API Client - Raw JSON from ${endpoint}:`, JSON.stringify(data, null, 2));
      return data;
    } catch (error: any) {
      // Capturar errores de red (Failed to fetch)
      if (
        error.message === "Failed to fetch" || 
        error.name === "TypeError" ||
        error.message?.includes("fetch") ||
        error.message?.includes("network") ||
        error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        const friendlyError = new Error(
          `No se pudo conectar con el servidor. Verifica que el servidor esté corriendo en ${this.baseUrl}`
        );
        (friendlyError as any).status = 0;
        (friendlyError as any).isNetworkError = true;
        console.error("❌ Error de conexión:", {
          baseUrl: this.baseUrl,
          endpoint,
          error: error.message,
          name: error.name,
        });
        throw friendlyError;
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string; resetUrl?: string }> {
    return this.request<{ message: string; resetToken?: string; resetUrl?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async sendVerificationCode(data: { email: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/auth/send-verification-code", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyEmailCode(data: { email: string; code: string }): Promise<{ message: string; verified: boolean }> {
    return this.request<{ message: string; verified: boolean }>("/api/auth/verify-email-code", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendPhoneVerificationCode(data: { phone: string; countryCode: string }): Promise<{ message: string; code?: string }> {
    return this.request<{ message: string; code?: string }>("/api/user-settings/recovery/send-phone-code", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyPhoneCode(data: { phone: string; countryCode: string; code: string }): Promise<{ message: string; verified: boolean }> {
    return this.request<{ message: string; verified: boolean }>("/api/user-settings/recovery/verify-phone-code", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateRecoveryPhrase(): Promise<{ phrase: string; message: string }> {
    return this.request<{ phrase: string; message: string }>("/api/user-settings/recovery/generate-phrase", {
      method: "POST",
    });
  }

  async setupDeviceRecovery(deviceInfo?: string): Promise<{ deviceHash: string; message: string }> {
    return this.request<{ deviceHash: string; message: string }>("/api/user-settings/recovery/setup-device", {
      method: "POST",
      body: JSON.stringify({ deviceInfo }),
    });
  }

  async generate2FASecret(): Promise<{ secret: string; qrCode: string; manualEntryKey: string }> {
    return this.request<{ secret: string; qrCode: string; manualEntryKey: string }>("/api/user-settings/2fa/generate-secret", {
      method: "POST",
    });
  }

  async verify2FACode(code: string, method: "app" | "security_key"): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/user-settings/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code, method }),
    });
  }

  async disable2FA(password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/user-settings/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async updateSecuritySettings(data: {
    twoPasswordMode?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorMethod?: "app" | "security_key";
  }): Promise<{ security: any }> {
    return this.request<{ security: any }>("/api/user-settings/security", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/user-settings/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  }

  async ensureEmailAccount(): Promise<{ success: boolean; account: { id: number; address: string }; message: string }> {
    return this.request<{ success: boolean; account: { id: number; address: string }; message: string }>("/api/auth/ensure-email-account", {
      method: "POST",
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>("/api/auth/me");
    console.log("🔍 API Client - Raw response from /api/auth/me:", JSON.stringify(response, null, 2));
    console.log("🔍 API Client - Response.user:", response.user);
    console.log("🔍 API Client - Response.user.role:", response.user?.role);
    console.log("🔍 API Client - Response.user.role type:", typeof response.user?.role);
    console.log("🔍 API Client - Response.user.role === 'admin':", response.user?.role === "admin");
    return response;
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    paymentMethod?: string;
    paymentDetails?: any;
    preferences?: any;
  }): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Domain methods
  async getDomains(): Promise<Domain[]> {
    return this.request<Domain[]>("/api/domains");
  }

  async addDomain(data: AddDomainRequest): Promise<Domain> {
    return this.request<Domain>("/api/domains", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyDomain(id: number): Promise<Domain & { dnsResult?: any; dnsInstructions?: any }> {
    return this.request<Domain & { dnsResult?: any; dnsInstructions?: any }>(
      `/api/domains/${id}/verify`,
      {
        method: "POST",
      }
    );
  }

  async updateDomainSmtp(
    id: number,
    data: {
      smtpProvider?: "sendgrid" | "mailgun" | "smtp" | "gmail";
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      smtpApiKey?: string;
    }
  ): Promise<Domain> {
    return this.request<Domain>(`/api/domains/${id}/smtp`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDomain(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/domains/${id}`, {
      method: "DELETE",
    });
  }

  // Email methods
  async getEmails(): Promise<Email[]> {
    return this.request<Email[]>("/api/emails");
  }

  async sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
    return this.request<SendEmailResponse>("/api/emails/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Email Account methods
  async createEmailAccount(data: { domainId: number; address: string; password: string }): Promise<EmailAccount> {
    return this.request<EmailAccount>("/api/email-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getEmailAccounts(domainId?: number): Promise<EmailAccount[]> {
    const url = domainId ? `/api/email-accounts?domainId=${domainId}` : "/api/email-accounts";
    return this.request<EmailAccount[]>(url);
  }

  async deleteEmailAccount(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/email-accounts/${id}`, {
      method: "DELETE",
    });
  }

  // Mailbox methods
  async getInbox(emailAccountId: number, sync: boolean = false): Promise<InboxEmail[]> {
    return this.request<InboxEmail[]>(`/api/mailbox/inbox?emailAccountId=${emailAccountId}&sync=${sync}`);
  }

  async getDrafts(emailAccountId: number): Promise<InboxEmail[]> {
    return this.request<InboxEmail[]>(`/api/mailbox/drafts?emailAccountId=${emailAccountId}`);
  }

  async markEmailAsRead(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/mark-read", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async toggleStar(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/star", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async toggleArchive(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/archive", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async toggleSpam(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/spam", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async toggleImportant(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/important", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async deleteEmail(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/delete", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async restoreEmail(emailId: number): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/restore", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async permanentDelete(emailId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/api/mailbox/permanent-delete", {
      method: "POST",
      body: JSON.stringify({ emailId }),
    });
  }

  async saveDraft(data: {
    emailAccountId: number;
    to: string;
    subject: string;
    message: string;
    draftId?: number;
  }): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteDraft(emailId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/api/mailbox/draft", {
      method: "DELETE",
      body: JSON.stringify({ emailId }),
    });
  }

  async toggleLabel(emailId: number, label: string): Promise<{ success: boolean; email: InboxEmail }> {
    return this.request<{ success: boolean; email: InboxEmail }>("/api/mailbox/label", {
      method: "POST",
      body: JSON.stringify({ emailId, label }),
    });
  }

  async bulkOperation(emailIds: number[], operation: string): Promise<{ success: boolean; count: number }> {
    return this.request<{ success: boolean; count: number }>("/api/mailbox/bulk", {
      method: "POST",
      body: JSON.stringify({ emailIds, operation }),
    });
  }

  async sendFromAccount(data: {
    emailAccountId: number;
    to: string;
    subject: string;
    message: string;
    password: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request("/api/mailbox/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Plans methods
  async getPlans(): Promise<Plan[]> {
    return this.request<Plan[]>("/api/plans");
  }

  async getPlan(id: number): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${id}`);
  }

  async getCurrentPlan(): Promise<{ plan: Plan | null; subscription: any }> {
    return this.request("/api/plans/current/plan");
  }

  async getUserLimits(): Promise<UserLimits> {
    return this.request<UserLimits>("/api/plans/current/limits");
  }

  // Subscription methods
  async createSubscription(data: {
    planId: number;
    paymentMethodId?: string;
    billingPeriod: "monthly" | "yearly";
  }): Promise<{ subscription: any }> {
    return this.request("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return this.request<Subscription[]>("/api/subscriptions");
  }

  async cancelSubscription(id: number): Promise<{ message: string }> {
    return this.request(`/api/subscriptions/${id}`, {
      method: "DELETE",
    });
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>("/api/invoices");
  }

  // Payment methods
  async createPaymentIntent(data: {
    planId: number;
    billingPeriod: "monthly" | "yearly";
  }): Promise<{
    clientSecret: string;
    amount: number;
    currency: string;
    checkoutUrl: string;
  }> {
    return this.request("/api/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async processCardPayment(data: {
    planId: number;
    billingPeriod: "monthly" | "yearly";
    cardData: {
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    };
  }): Promise<{
    success: boolean;
    subscription: any;
    message: string;
  }> {
    return this.request("/api/payments/process-card", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async processPayPalPayment(data: {
    planId: number;
    billingPeriod: "monthly" | "yearly";
    paypalOrderId?: string;
  }): Promise<{
    success: boolean;
    subscription: any;
    message: string;
  }> {
    return this.request("/api/payments/process-paypal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async processBankTransfer(data: {
    planId: number;
    billingPeriod: "monthly" | "yearly";
  }): Promise<{
    success: boolean;
    message: string;
    amount: number;
    billingPeriod: string;
    bankDetails: {
      bank: string;
      accountHolder: string;
      iban: string;
      swift: string;
      reference: string;
    };
  }> {
    return this.request("/api/payments/process-bank-transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Gestión de métodos de pago guardados
  async addPaymentMethod(data: {
    type: "card" | "paypal";
    cardData?: {
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    };
  }): Promise<{
    success: boolean;
    paymentMethod: any;
    message: string;
  }> {
    return this.request("/api/payments/methods", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPaymentMethods(): Promise<{
    paymentMethods: Array<{
      id?: string;
      type: string;
      last4?: string;
      brand?: string;
      expMonth?: number;
      expYear?: number;
      email?: string;
      isStripe?: boolean;
      stripePaymentMethodId?: string;
      createdAt?: string;
    }>;
  }> {
    return this.request("/api/payments/methods");
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/payments/methods/${paymentMethodId}`, {
      method: "DELETE",
    });
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request("/api/payments/methods/default", {
      method: "POST",
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  // Añadir créditos
  async addCredits(amount: number): Promise<{
    success: boolean;
    message: string;
    credits: number;
    paymentIntentId?: string;
  }> {
    return this.request("/api/payments/add-credits", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  // Obtener créditos del usuario
  async getUserCredits(): Promise<{ credits: number }> {
    return this.request("/api/user-settings/credits");
  }

  // Admin methods
  async getSystemStats(): Promise<{
    stats: {
      totalUsers: number;
      totalAdmins: number;
      totalRegularUsers: number;
      totalDomains: number;
      totalEmailAccounts: number;
      totalSubscriptions: number;
      activeSubscriptions: number;
      totalInvoices: number;
      totalTickets: number;
      totalPlans: number;
      totalEmails: number;
      totalStorageUsed: number;
      newUsersLastMonth: number;
      ticketsByStatus: {
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
      };
    };
  }> {
    return this.request("/api/admin/stats");
  }

  async getAllUsers(): Promise<{
    users: AdminUser[];
  }> {
    return this.request("/api/admin/users");
  }

  async getUserById(id: number): Promise<{
    user: AdminUserDetail;
  }> {
    return this.request(`/api/admin/users/${id}`);
  }

  async updateUser(id: number, data: {
    name?: string;
    email?: string;
    role?: "user" | "admin";
  }): Promise<{
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    };
  }> {
    return this.request(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateUserPassword(id: number, password: string): Promise<{
    message: string;
  }> {
    return this.request(`/api/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  }

  async deleteUser(id: number): Promise<{
    message: string;
  }> {
    return this.request(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  async getAllPlans(): Promise<{
    plans: Array<Plan & { _count: { subscriptions: number } }>;
  }> {
    return this.request("/api/admin/plans");
  }

  async createPlan(data: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    maxEmails?: number;
    maxStorageGB?: number;
    maxDomains?: number;
    category?: string;
    features?: any;
    isActive?: boolean;
  }): Promise<{ plan: Plan }> {
    return this.request("/api/admin/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id: number, data: {
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number;
    maxEmails?: number;
    maxStorageGB?: number;
    maxDomains?: number;
    category?: string;
    features?: any;
    isActive?: boolean;
  }): Promise<{ plan: Plan }> {
    return this.request(`/api/admin/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/plans/${id}`, {
      method: "DELETE",
    });
  }

  // Códigos promocionales (admin)
  async getPromoCodes(): Promise<{
    promoCodes: Array<{
      id: number;
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      maxUses?: number;
      currentUses: number;
      validFrom: string;
      validUntil?: string;
      isActive: boolean;
      createdBy: number;
      createdAt: string;
      updatedAt: string;
      creator: {
        id: number;
        name: string;
        email: string;
      };
    }>;
  }> {
    return this.request("/api/admin/promo-codes");
  }

  async createPromoCode(data: {
    code: string;
    description?: string;
    discountType: "fixed" | "percentage";
    discountValue: number;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
  }): Promise<{
    promoCode: {
      id: number;
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      maxUses?: number;
      currentUses: number;
      validFrom: string;
      validUntil?: string;
      isActive: boolean;
      createdBy: number;
      createdAt: string;
      updatedAt: string;
      creator: {
        id: number;
        name: string;
        email: string;
      };
    };
  }> {
    return this.request("/api/admin/promo-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePromoCode(id: number, data: {
    description?: string;
    discountType?: "fixed" | "percentage";
    discountValue?: number;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
    isActive?: boolean;
  }): Promise<{
    promoCode: {
      id: number;
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      maxUses?: number;
      currentUses: number;
      validFrom: string;
      validUntil?: string;
      isActive: boolean;
      createdBy: number;
      createdAt: string;
      updatedAt: string;
      creator: {
        id: number;
        name: string;
        email: string;
      };
    };
  }> {
    return this.request(`/api/admin/promo-codes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePromoCode(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/promo-codes/${id}`, {
      method: "DELETE",
    });
  }

  async getAllDomains(): Promise<{
    domains: Array<Domain & {
      user: { id: number; name: string; email: string };
      _count: { emailAccounts: number };
    }>;
  }> {
    return this.request("/api/admin/domains");
  }

  async getAllInvoices(): Promise<{
    invoices: Array<Invoice & {
      user: { id: number; name: string; email: string };
    }>;
  }> {
    return this.request("/api/admin/invoices");
  }

  async getAllEmailAccounts(): Promise<{
    emailAccounts: Array<EmailAccount & {
      domain: { id: number; domainName: string; dnsVerified: boolean };
      owner?: { id: number; name: string; email: string };
      _count: { emails: number };
    }>;
  }> {
    return this.request("/api/admin/email-accounts");
  }

  async getAllSubscriptions(): Promise<{
    subscriptions: Array<Subscription & {
      user: { id: number; name: string; email: string };
      Plan?: {
        id: number;
        name: string;
        description?: string;
        priceMonthly: number;
        priceYearly: number;
        maxEmails: number;
        maxStorageGB: number;
        maxDomains: number;
      };
      _count: { invoices: number };
    }>;
  }> {
    return this.request("/api/admin/subscriptions");
  }

  async cancelSubscriptionAdmin(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/subscriptions/${id}`, {
      method: "DELETE",
    });
  }

  async deleteTicketAdmin(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/tickets/${id}`, {
      method: "DELETE",
    });
  }

  async deleteDomainAdmin(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/domains/${id}`, {
      method: "DELETE",
    });
  }

  async deleteEmailAccountAdmin(id: number): Promise<{ message: string }> {
    return this.request(`/api/admin/email-accounts/${id}`, {
      method: "DELETE",
    });
  }

  // Ticket methods
  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    const formData = new FormData();
    formData.append("subject", data.subject);
    formData.append("description", data.description);
    if (data.priority) {
      formData.append("priority", data.priority);
    }
    
    // Agregar archivos si existen
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const token = this.getToken();
    const url = `${this.baseUrl}/api/tickets`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Si no es JSON, usar el texto
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  async getUserTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>("/api/tickets");
  }

  async getAllTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>("/api/tickets/all");
  }

  async updateTicketStatus(id: number, status: "open" | "in_progress" | "resolved" | "closed"): Promise<Ticket> {
    return this.request<Ticket>(`/api/tickets/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return this.request<TicketMessage[]>(`/api/tickets/${ticketId}/messages`);
  }

  async sendTicketMessage(ticketId: number, message: string): Promise<TicketMessage> {
    return this.request<TicketMessage>(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // User Settings methods
  async getUserPreferences(): Promise<{
    preferences: any;
    recovery: {
      email?: string;
      phone?: string;
      phoneCountryCode?: string;
      allowEmailRecovery: boolean;
      allowPhoneRecovery: boolean;
      allowQRLogin: boolean;
      allowRecoveryPhrase: boolean;
      allowDeviceRecovery: boolean;
      hasRecoveryPhrase?: boolean;
    };
    credits: number;
    security: {
      twoPasswordMode: boolean;
      twoFactorEnabled: boolean;
      twoFactorMethod?: string;
    };
  }> {
    return this.request("/api/user-settings/preferences");
  }

  async updateUserPreferences(preferences: any): Promise<{ user: User }> {
    return this.request("/api/user-settings/preferences", {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    });
  }

  async updateRecoverySettings(data: {
    recoveryEmail?: string;
    recoveryPhone?: string;
    recoveryPhoneCountryCode?: string;
    allowEmailRecovery?: boolean;
    allowPhoneRecovery?: boolean;
    allowQRLogin?: boolean;
    allowRecoveryPhrase?: boolean;
    allowDeviceRecovery?: boolean;
  }): Promise<{ recovery: any }> {
    return this.request("/api/user-settings/recovery", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async applyGiftCode(code: string): Promise<{
    message: string;
    creditsAdded: number;
    totalCredits: number;
  }> {
    return this.request("/api/user-settings/gift-code", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  // Notificaciones
  async getNotifications(unreadOnly?: boolean): Promise<{
    notifications: Array<{
      id: number;
      userId: number;
      type: string;
      category?: string;
      title: string;
      message: string;
      link?: string;
      isRead: boolean;
      createdAt: string;
    }>;
    unreadCount: number;
  }> {
    const query = unreadOnly ? "?unreadOnly=true" : "";
    return this.request(`/api/notifications${query}`);
  }

  async markNotificationAsRead(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request("/api/notifications/read-all", {
      method: "PUT",
    });
  }

  async deleteNotification(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  }

  async getEmergencyContacts(): Promise<{ contacts: Array<{ email: string }> }> {
    return this.request("/api/user-settings/emergency-contacts");
  }

  async addEmergencyContact(email: string): Promise<{
    message: string;
    contacts: Array<{ email: string }>;
  }> {
    return this.request("/api/user-settings/emergency-contacts", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async removeEmergencyContact(email: string): Promise<{
    message: string;
    contacts: Array<{ email: string }>;
  }> {
    return this.request("/api/user-settings/emergency-contacts", {
      method: "DELETE",
      body: JSON.stringify({ email }),
    });
  }

}

// Ticket interfaces
export interface TicketAttachment {
  id: number;
  ticketId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  url?: string; // URL completa para acceder al archivo
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface Ticket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  attachments?: TicketAttachment[];
  messages?: TicketMessage[];
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
  files?: File[];
}

// Invoice interfaces
export interface Invoice {
  id: number;
  userId: number;
  subscriptionId?: number;
  createdAt: string;
  subscription?: {
    id: number;
    plan: string;
    startDate: string;
    endDate?: string;
    Plan?: {
      name: string;
      priceMonthly: number;
      priceYearly: number;
    };
  };
}

export const apiClient = new ApiClient(API_BASE_URL);


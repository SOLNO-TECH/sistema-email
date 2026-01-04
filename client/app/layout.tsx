import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TicketChatBot } from "@/components/ticket-chat-bot";

export const metadata: Metadata = {
  title: {
    default: "Fylo Mail - Servicio de Correo Electrónico Profesional | Email Empresarial",
    template: "%s | Fylo Mail",
  },
  description: "Fylo Mail es el mejor servicio de correo electrónico profesional. Crea cuentas de email personalizadas con tu dominio, gestiona correos empresariales, envía y recibe emails de forma segura. Planes flexibles para empresas y particulares. Alternativa a Gmail, Outlook y ProtonMail.",
  keywords: [
    // Palabras principales
    "fylo",
    "fylo mail",
    "correo",
    "correo electrónico",
    "email",
    "mail",
    "correo profesional",
    "email profesional",
    "correo empresarial",
    "email empresarial",
    // Servicios
    "servicio de correo",
    "servicio de email",
    "hosting de correo",
    "hosting de email",
    "gestión de correo",
    "gestión de email",
    "cuentas de correo",
    "cuentas de email",
    "dominios personalizados",
    "email con dominio propio",
    "correo con dominio propio",
    // Características
    "email seguro",
    "correo seguro",
    "email privado",
    "correo privado",
    "email encriptado",
    "correo encriptado",
    "email gratuito",
    "correo gratuito",
    // Alternativas
    "alternativa a gmail",
    "alternativa a outlook",
    "alternativa a protonmail",
    "mejor servicio de email",
    "mejor servicio de correo",
    // Búsquedas específicas
    "crear cuenta de correo",
    "crear cuenta de email",
    "correo electrónico gratis",
    "email gratis",
    "correo corporativo",
    "email corporativo",
    "sistema de correo",
    "plataforma de email",
    "aplicación de correo",
    "app de email",
    "cliente de correo",
    "cliente de email",
  ],
  authors: [{ name: "Fylo Mail" }],
  creator: "Fylo Mail",
  publisher: "Fylo Mail",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: "Fylo Mail - Servicio de Correo Electrónico Profesional | Email Empresarial",
    description: "El mejor servicio de correo electrónico profesional. Crea cuentas de email personalizadas con tu dominio, gestiona correos empresariales de forma segura. Alternativa a Gmail y Outlook.",
    siteName: "Fylo Mail",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fylo Mail - Servicio de Correo Profesional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fylo Mail - Servicio de Correo Electrónico Profesional",
    description: "El mejor servicio de correo electrónico profesional. Crea cuentas de email personalizadas con tu dominio.",
    creator: "@fylomail",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Agregar códigos de verificación cuando estén disponibles
    // google: "verification-code",
    // yandex: "verification-code",
    // bing: "verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Fylo Mail",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://fylomail.es",
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://fylomail.es"}/logo.png`,
              description: "Servicio profesional de correo electrónico con dominios personalizados y planes flexibles para empresas y particulares.",
              sameAs: [
                "https://twitter.com/fylomail",
                "https://facebook.com/fylomail",
                "https://linkedin.com/company/fylomail",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Soporte al Cliente",
                email: "support@fylomail.es",
              },
            }),
          }}
        />
        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Fylo Mail",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://fylomail.es",
              description: "Servicio profesional de correo electrónico con dominios personalizados",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://fylomail.es"}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Structured Data - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Fylo Mail",
              applicationCategory: "EmailApplication",
              operatingSystem: "Web, iOS, Android",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <TicketChatBot />
        </ThemeProvider>
      </body>
    </html>
  );
}

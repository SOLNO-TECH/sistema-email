import Head from "next/head";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  type?: "website" | "article" | "product";
}

export function SEOHead({
  title = "Fylo Mail - Servicio de Correo Electrónico Profesional",
  description = "Fylo Mail es el mejor servicio de correo electrónico profesional. Crea cuentas de email personalizadas con tu dominio, gestiona correos empresariales de forma segura.",
  keywords = [],
  canonical,
  ogImage = "/og-image.jpg",
  noindex = false,
  type = "website",
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fylomail.es";
  const fullTitle = title.includes("Fylo Mail") ? title : `${title} | Fylo Mail`;
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const defaultKeywords = [
    "fylo",
    "fylo mail",
    "correo",
    "correo electrónico",
    "email",
    "mail",
    "correo profesional",
    "email profesional",
  ];
  const allKeywords = [...defaultKeywords, ...keywords].join(", ");

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:site_name" content="Fylo Mail" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      <meta name="twitter:creator" content="@fylomail" />
      
      {/* Additional SEO */}
      <meta name="author" content="Fylo Mail" />
      <meta name="language" content="Spanish" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
    </Head>
  );
}


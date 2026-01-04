import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xstarmail.es";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth",
          "/api/",
          "/dashboard",
          "/admin",
          "/mailbox",
          "/account",
          "/settings",
          "/domains",
          "/emails",
          "/recovery",
          "/language",
          "/subscription",
          "/feedback",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/auth",
          "/api/",
          "/dashboard",
          "/admin",
          "/mailbox",
          "/account",
          "/settings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}


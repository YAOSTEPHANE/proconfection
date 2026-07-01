import type { Db } from "mongodb";

export type ShopSettings = {
  id: "shop-settings";
  general: {
    shopName: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    city: string;
    country: string;
    businessHours: string;
  };
  delivery: {
    freeShippingThreshold: number;
    estimatedDaysMin: number;
    estimatedDaysMax: number;
    deliveryMessage: string;
    returnsPolicy: string;
  };
  payments: {
    onlinePaymentEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
    currencyCode: string;
  };
  display: {
    welcomeMessage: string;
    promoBannerText: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  social: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    tiktok: string;
  };
  updatedAt: string;
};

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  id: "shop-settings",
  general: {
    shopName: "ProConfection Internationale",
    tagline: "Votre boutique mode premium : vêtements, chaussures, sacs et accessoires.",
    supportEmail: "contact@proconfection.shop",
    supportPhone: "+225 07 00 00 00 00",
    address: "Plateau, Abidjan",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    businessHours: "Lun — Sam, 8h — 20h",
  },
  delivery: {
    freeShippingThreshold: 50000,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5,
    deliveryMessage: "Livraison rapide à Abidjan et dans les principales villes de Côte d'Ivoire.",
    returnsPolicy: "Retours acceptés sous 7 jours pour les articles non portés, avec étiquette d'origine.",
  },
  payments: {
    onlinePaymentEnabled: true,
    cashOnDeliveryEnabled: true,
    currencyCode: "XOF",
  },
  display: {
    welcomeMessage: "Bienvenue chez ProConfection — découvrez nos collections exclusives.",
    promoBannerText: "Livraison offerte dès 50 000 FCFA d'achat",
    maintenanceMode: false,
    maintenanceMessage: "Notre boutique est momentanément en maintenance. Revenez très bientôt.",
  },
  social: {
    facebook: "",
    instagram: "",
    whatsapp: "",
    tiktok: "",
  },
  updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function trimString(value: unknown, fallback: string, maxLength = 500): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function optionalUrl(value: unknown, maxLength = 300): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxLength);
}

export function normalizeShopSettings(value: unknown): ShopSettings {
  const input = typeof value === "object" && value !== null ? value : {};
  const data = input as Partial<ShopSettings>;
  const general = (data.general ?? {}) as Partial<ShopSettings["general"]>;
  const delivery = (data.delivery ?? {}) as Partial<ShopSettings["delivery"]>;
  const payments = (data.payments ?? {}) as Partial<ShopSettings["payments"]>;
  const display = (data.display ?? {}) as Partial<ShopSettings["display"]>;
  const social = (data.social ?? {}) as Partial<ShopSettings["social"]>;

  return {
    id: "shop-settings",
    general: {
      shopName: trimString(general.shopName, DEFAULT_SHOP_SETTINGS.general.shopName, 120),
      tagline: trimString(general.tagline, DEFAULT_SHOP_SETTINGS.general.tagline, 300),
      supportEmail: trimString(general.supportEmail, DEFAULT_SHOP_SETTINGS.general.supportEmail, 120),
      supportPhone: trimString(general.supportPhone, DEFAULT_SHOP_SETTINGS.general.supportPhone, 40),
      address: trimString(general.address, DEFAULT_SHOP_SETTINGS.general.address, 200),
      city: trimString(general.city, DEFAULT_SHOP_SETTINGS.general.city, 80),
      country: trimString(general.country, DEFAULT_SHOP_SETTINGS.general.country, 80),
      businessHours: trimString(
        general.businessHours,
        DEFAULT_SHOP_SETTINGS.general.businessHours,
        120,
      ),
    },
    delivery: {
      freeShippingThreshold: clampNumber(
        delivery.freeShippingThreshold,
        DEFAULT_SHOP_SETTINGS.delivery.freeShippingThreshold,
        0,
        10_000_000,
      ),
      estimatedDaysMin: clampNumber(
        delivery.estimatedDaysMin,
        DEFAULT_SHOP_SETTINGS.delivery.estimatedDaysMin,
        1,
        60,
      ),
      estimatedDaysMax: clampNumber(
        delivery.estimatedDaysMax,
        DEFAULT_SHOP_SETTINGS.delivery.estimatedDaysMax,
        1,
        90,
      ),
      deliveryMessage: trimString(
        delivery.deliveryMessage,
        DEFAULT_SHOP_SETTINGS.delivery.deliveryMessage,
        400,
      ),
      returnsPolicy: trimString(
        delivery.returnsPolicy,
        DEFAULT_SHOP_SETTINGS.delivery.returnsPolicy,
        400,
      ),
    },
    payments: {
      onlinePaymentEnabled:
        typeof payments.onlinePaymentEnabled === "boolean"
          ? payments.onlinePaymentEnabled
          : DEFAULT_SHOP_SETTINGS.payments.onlinePaymentEnabled,
      cashOnDeliveryEnabled:
        typeof payments.cashOnDeliveryEnabled === "boolean"
          ? payments.cashOnDeliveryEnabled
          : DEFAULT_SHOP_SETTINGS.payments.cashOnDeliveryEnabled,
      currencyCode: trimString(
        payments.currencyCode,
        DEFAULT_SHOP_SETTINGS.payments.currencyCode,
        6,
      ).toUpperCase(),
    },
    display: {
      welcomeMessage: trimString(
        display.welcomeMessage,
        DEFAULT_SHOP_SETTINGS.display.welcomeMessage,
        300,
      ),
      promoBannerText: trimString(
        display.promoBannerText,
        DEFAULT_SHOP_SETTINGS.display.promoBannerText,
        200,
      ),
      maintenanceMode:
        typeof display.maintenanceMode === "boolean"
          ? display.maintenanceMode
          : DEFAULT_SHOP_SETTINGS.display.maintenanceMode,
      maintenanceMessage: trimString(
        display.maintenanceMessage,
        DEFAULT_SHOP_SETTINGS.display.maintenanceMessage,
        300,
      ),
    },
    social: {
      facebook: optionalUrl(social.facebook),
      instagram: optionalUrl(social.instagram),
      whatsapp: optionalUrl(social.whatsapp),
      tiktok: optionalUrl(social.tiktok),
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function getShopSettings(db: Db): Promise<ShopSettings> {
  try {
    const doc = await db
      .collection<ShopSettings>("app_settings")
      .findOne({ id: "shop-settings" }, { projection: { _id: 0 } });
    return doc ? normalizeShopSettings(doc) : DEFAULT_SHOP_SETTINGS;
  } catch {
    return DEFAULT_SHOP_SETTINGS;
  }
}

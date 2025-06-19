// Types that match the Prisma schema with proper types
// Define a type for Decimal-like objects without importing Prisma
export type PrismaDecimal = {
  toString: () => string;
};

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED';
export type Role = 'USER' | 'ADMIN';

// Base interfaces that match Prisma models (server-side)
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: PrismaDecimal;
  image: string | null;
  stockCount: number;
  categoryId: string;
  published: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  stocks?: Stock[];
  orderItems?: OrderItem[];
  _count?: {
    stocks: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  showOnHomepage: boolean;
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  password: string;
  image: string | null;
  role: Role;
  balance: PrismaDecimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: string;
  productId: string;
  content: string;
  isDelivered: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
  orderId: string | null;
  order: Order | null;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: PrismaDecimal;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  orderItems: OrderItem[];
  deliveryLogs?: DeliveryLog[];
  stocks?: Stock[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: PrismaDecimal;
  createdAt: Date;
  updatedAt: Date;
  order: Order;
  product: Product;
}

export interface DeliveryLog {
  id: string;
  orderId: string;
  stockId: string;
  status: string;
  message: string | null;
  createdAt: Date;
  order: Order;
}

export interface Slider {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// API response interfaces (with serialized data for client-side use)
export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  image: string | null;
  stockCount: number;
  categoryId: string;
  published: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: CategoryWithRelations | null;
  _count?: {
    stocks: number;
  };
}

export interface CategoryWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CategoryWithProducts extends CategoryWithRelations {
  products: ProductWithRelations[];
}

export interface SliderWithRelations {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockWithRelations {
  id: string;
  productId: string;
  content: string;
  isDelivered: boolean;
  createdAt: string;
  updatedAt: string;
  product: ProductWithRelations;
  orderId: string | null;
}

export interface OrderWithRelations {
  id: string;
  userId: string;
  totalAmount: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: Role;
  };
  orderItems: OrderItemWithRelations[];
  stocks: StockWithRelations[];
}

export interface OrderItemWithRelations {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  product: ProductWithRelations;
}

export interface QuickAccessItem {
  id: string;
  title: string;
  color: string | null;
  imageUrl: string | null;
  destinationUrl: string;
}

// Type definitions for the application

export interface SiteSettingsType {
  id: number;
  logoWhiteText: string;
  logoAccentText: string;
  logoWhiteColor: string;
  logoAccentColor: string;
  siteName: string;
  siteTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  footerDescription: string;
  footerBottomText: string;
  footerInstitutionalTitle: string;
  
  // Social media fields
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialInstagram?: string | null;
  socialDiscord?: string | null;
  socialYoutube?: string | null;
  socialFacebookVisible: boolean;
  socialTwitterVisible: boolean;
  socialInstagramVisible: boolean;
  socialDiscordVisible: boolean;
  socialYoutubeVisible: boolean;
  
  // Contact information fields
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactAddress?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FooterSettingsType {
  siteName: string;
  footerDescription: string;
  footerBottomText: string;
  footerInstitutionalTitle: string;
  
  // Social media fields
  socialFacebook?: string | null;
  socialTwitter?: string | null;
  socialInstagram?: string | null;
  socialDiscord?: string | null;
  socialYoutube?: string | null;
  socialFacebookVisible: boolean;
  socialTwitterVisible: boolean;
  socialInstagramVisible: boolean;
  socialDiscordVisible: boolean;
  socialYoutubeVisible: boolean;
  
  // Contact information fields
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactAddress?: string | null;
}

export interface LogoSettingsType {
  logoWhiteText: string;
  logoAccentText: string;
  logoWhiteColor: string;
  logoAccentColor: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  userId: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
} 
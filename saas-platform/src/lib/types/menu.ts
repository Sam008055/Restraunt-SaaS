// Menu Builder types
export interface MenuVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  taxPercentage: number;
  order: number;
  variants: MenuVariant[];
  addOns: MenuAddOn[];
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  items: MenuItem[];
}

// src/types/menuTypes.ts
export interface MenuData {
    id?: string;
    name: string;
    price: string;
    stock: string;
    imageUrl: string;
    userId: string;
  }
  
  export interface MenuFormData {
    name: string;
    price: string;
    stock: string;
    image: File | null;
  }
  
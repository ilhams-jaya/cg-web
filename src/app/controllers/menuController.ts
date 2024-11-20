// src/controllers/menuController.ts
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { MenuData, MenuFormData } from "../types/menuTypes";

export const getMenus = async (userId: string, setMenus: (menus: MenuData[]) => void) => {
  const menusRef = collection(db, "menus");
  const q = query(menusRef, where("userId", "==", userId));

  // Menggunakan onSnapshot untuk mendapatkan update secara realtime
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const menus: MenuData[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      price: doc.data().price,
      stock: doc.data().stock,
      imageUrl: doc.data().imageUrl,
      userId: doc.data().userId,
    }));
    setMenus(menus);
  });

  return unsubscribe; // Mengembalikan fungsi unsubscribe untuk menghentikan snapshot jika perlu
};

export const createMenu = async (menuData: MenuFormData, userId: string) => {
  const menusRef = collection(db, "menus");
  await addDoc(menusRef, {
    name: menuData.name,
    price: menuData.price,
    stock: menuData.stock,
    imageUrl: menuData.image ? URL.createObjectURL(menuData.image) : "",
    userId: userId,
  });
};

export const modifyMenu = async (menuId: string, menuData: MenuFormData, userId: string) => {
  const menuDocRef = doc(db, "menus", menuId);
  await updateDoc(menuDocRef, {
    name: menuData.name,
    price: menuData.price,
    stock: menuData.stock,
    imageUrl: menuData.image ? URL.createObjectURL(menuData.image) : "",
    userId: userId,
  });
};

export const removeMenu = async (menuId: string) => {
  const menuDocRef = doc(db, "menus", menuId);
  await deleteDoc(menuDocRef);
};

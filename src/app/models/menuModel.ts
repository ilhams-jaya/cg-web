import { getFirestore, collection, query, where, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { MenuData, MenuFormData } from "../types/menuTypes";

const db = getFirestore(app);
const storage = getStorage(app);

export const fetchUserMenus = async (userId: string) => {
  const q = query(collection(db, "menus"), where("userId", "==", userId));
  return onSnapshot(q, (querySnapshot) => {
    const menusData: MenuData[] = [];
    querySnapshot.forEach((doc) => {
      menusData.push({ ...doc.data(), id: doc.id } as MenuData);
    });
    return menusData;
  });
}; 

export const addMenu = async (menuData: MenuFormData, userId: string): Promise<void> => {
  if (!menuData.image) throw new Error("Image is required");

  const storageRef = ref(storage, `images/${menuData.image.name}`);
  await uploadBytes(storageRef, menuData.image);
  const imageUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "menus"), {
    ...menuData,
    imageUrl,
    userId,
  });
};

export const updateMenu = async (menuId: string, menuData: MenuFormData, userId: string) => {
  let imageUrl;
  if (menuData.image) {
    const storageRef = ref(storage, `images/${menuData.image.name}`);
    await uploadBytes(storageRef, menuData.image);
    imageUrl = await getDownloadURL(storageRef);
  }

  await updateDoc(doc(db, "menus", menuId), {
    ...menuData,
    imageUrl,
    userId,
  });
};

export const deleteMenu = async (menuId: string): Promise<void> => {
  await deleteDoc(doc(db, "menus", menuId));
};

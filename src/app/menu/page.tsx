"use client";
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import SideNavbar from "../components/SideNavbar";
import Checkout from "../components/Checkout";
import Image from "next/image";
import { app } from "../firebase";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface MenuData {
  id?: string;
  name: string;
  price: string;
  stock: string;
  imageUrl: string;
  userId: string;
}

interface MenuFormData {
  name: string;
  price: string;
  stock: string;
  image: File | null;
}

export default function Menu() {
  const { data: session } = useSession();
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMenuId, setEditMenuId] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuFormData>({
    name: "",
    price: "",
    stock: "",
    image: null,
  });

  const db = getFirestore(app);
  const storage = getStorage(app);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.email) {
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", session.user.email)
        );
        const querySnapshot = await getDocs(usersQuery);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserId(userDoc.id); 
        }
      }
    };

    fetchUserId();
  }, [session?.user?.email, db]);

  useEffect(() => {
    if (userId) {
      const q = query(
        collection(db, "menus"),
        where("userId", "==", userId) 
      );

      const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const menusData: MenuData[] = [];
        querySnapshot.forEach((doc) => {
          menusData.push({ ...doc.data(), id: doc.id } as MenuData);
        });
        setMenus(menusData);
      });

      return () => unsubscribeFirestore();
    } else {
      setMenus([]); 
    }
  }, [userId, db]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.size <= 2048576) {
      setMenuData({ ...menuData, image: file });
    } else {
      alert("Image size must be less than 2 MB");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMenuData({ ...menuData, [e.target.name]: e.target.value });
  };

  const handleAddMenu = async () => {
    if (menuData.name && menuData.price && menuData.image) {
      try {
        if (!userId) {
          alert("You need to be logged in to add a menu.");
          return;
        }

        const storageRef = ref(storage, `images/${menuData.image.name}`);
        await uploadBytes(storageRef, menuData.image);

        const imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, "menus"), {
          name: menuData.name,
          price: menuData.price,
          stock: menuData.stock,
          imageUrl: imageUrl,
          userId: userId, 
        });

        setIsModalOpen(false);
        setMenuData({ name: "", price: "", stock:"", image: null });
      } catch (error) {
        console.error("Error adding menu: ", error);
      }
    } else {
      alert("Please fill in all fields and ensure the image is less than 2 MB.");
    }
  };

  const handleEditMenu = (menuId: string) => {
    const menuToEdit = menus.find((menu) => menu.id === menuId);
    if (menuToEdit) {
      setMenuData({
        name: menuToEdit.name,
        price: menuToEdit.price,
        stock: menuToEdit.stock,
        image: null,
      });
      setIsEditing(true);
      setEditMenuId(menuId);
      setIsModalOpen(true);
    }
  };

  const handleUpdateMenu = async () => {
    if (menuData.name && menuData.price && editMenuId) {
      try {
        let imageUrl = menus.find((menu) => menu.id === editMenuId)?.imageUrl;

        if (menuData.image) {
          const storageRef = ref(storage, `images/${menuData.image.name}`);
          await uploadBytes(storageRef, menuData.image);
          imageUrl = await getDownloadURL(storageRef);
        }

        if (userId) {
          await updateDoc(doc(db, "menus", editMenuId), {
            name: menuData.name,
            price: menuData.price,
            stock: menuData.stock,
            imageUrl: imageUrl,
            userId: userId, 
          });
        }

        setIsModalOpen(false);
        setIsEditing(false);
        setEditMenuId(null);
        setMenuData({ name: "", price: "", stock: "", image: null });
      } catch (error) {
        console.error("Error updating menu: ", error);
      }
    } else {
      alert("Please fill in all fields and ensure the image is less than 2 MB.");
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    try {
      await deleteDoc(doc(db, "menus", menuId));
    } catch (error) {
      console.error("Error deleting menu: ", error);
    }
  };

  const handleAddToCart = async (menu: MenuData) => {
    try {
      if (!userId) {
        alert("You need to be logged in to add items to the cart.");
        return;
      }
  
      // Cek stok item sebelum menambahkan ke cart
      if (parseInt(menu.stock) === 0) {
        toast.error(`Sorry, ${menu.name} is out of stock.`);
        return;
      }
  
      await addDoc(collection(db, "cart"), {
        userId: userId,
        itemId: menu.id,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        quantity: 1,
      });
  
      toast.success(`${menu.name} has been added to your cart.`);
    } catch (error) {
      toast.error(`Failed to add ${menu.name}`);
    }
  };
  
  
  

  return (
    <>
      <div className="flex bg-white text-indigo-900 min-h-screen">
        <div className="w-64">
          <SideNavbar />
        </div>
        <div className="flex-grow p-8">
          <div className="menu-header flex flex-row justify-between items-center mb-4">
            <h1 className="font-bold text-2xl">Menu</h1>
            <button
              className="px-6 py-3 bg-indigo-600 text-white rounded-md"
              onClick={() => setIsModalOpen(true)}
            >
              Add Menu
            </button>
          </div>

          <div className="menu-container grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="menu-card border rounded-md p-4 relative"
              >
                <button
                  className="absolute top-2 right-2 text-red-600"
                  onClick={() => handleDeleteMenu(menu.id!)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  className=" object-cover mb-4 h-40"
                  width={150}
                  height={150}
                />
                <h2 className="text-lg font-bold">{menu.name}</h2>
                <p className="text-gray-600">Rp{menu.price}</p>
                <p className="text-gray-500">Stock : {menu.stock}</p>
                <div className="mt-4 flex justify-between items-center">
                  <button 
                  className="text-white px-4 py-2 bg-indigo-600 rounded-md"
                  onClick={() => handleAddToCart(menu)}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="text-indigo-600"
                    onClick={() => handleEditMenu(menu.id!)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/4">
          <Checkout />
        </div>
      </div>

      {isModalOpen && (
        <div className="modal fixed inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-8 rounded-md w-1/3 border-2">
            <h2 className="text-2xl font-bold mb-4">
              {isEditing ? "Edit Menu" : "Add New Menu"}
            </h2>
            <input
              type="text"
              name="name"
              placeholder="Menu Name"
              className="border p-2 mb-4 w-full"
              value={menuData.name}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="price"
              placeholder="Menu Price"
              className="border p-2 mb-4 w-full"
              value={menuData.price}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock"
              className="border p-2 mb-4 w-full"
              value={menuData.stock}
              onChange={handleInputChange}
            />
            <input
              type="file"
              className="border p-2 mb-4 w-full"
              onChange={handleFileChange}
            />
            <div className="flex justify-end">
              {isEditing ? (
                <button
                  className="px-6 py-2 bg-indigo-800 text-white rounded-md mr-4"
                  onClick={handleUpdateMenu}
                >
                  Update
                </button>
              ) : (
                <button
                  className="px-6 py-2 bg-indigo-800 text-white rounded-md mr-4"
                  onClick={handleAddMenu}
                >
                  Save
                </button>
              )}
              <button
                className="px-6 py-2 bg-gray-300 rounded-md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Menu.requireAuth = true;

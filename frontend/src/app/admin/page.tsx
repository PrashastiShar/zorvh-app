'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, APP_ID } from '../../components/FirebaseProvider'; // Import APP_ID and useFirebase
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get user and isAdmin status
import { signOut } from 'firebase/auth'; // Keep signOut from firebase/auth for direct logout
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  addDoc, // For adding new products
  updateDoc, // For updating existing products
  deleteDoc, // For deleting products
  serverTimestamp // For adding timestamps to product data
} from 'firebase/firestore';

// Define a type for your user objects
interface AppUser {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt?: Date;
}

// Define a type for your product objects
interface Product {
  id?: string; // Optional for new products before they have an ID
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  origin: string;
  story: string;
  sizes?: string[]; // Optional array of sizes
  createdAt?: Date;
  updatedAt?: Date;
}

export default function AdminPage() {
  const router = useRouter();
  const { auth, loadingFirebase, userId, db } = useFirebase();
  const { user, isLoading: authContextLoading } = useAuth();

  const [message, setMessage] = useState<string>('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  // State for Product Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Product>({
    name: '',
    price: 0,
    imageUrl: '',
    stock: 0,
    origin: '',
    story: '',
    sizes: []
  });

  const overallLoading = loadingFirebase || authContextLoading;
  const currentUserIsAdmin = !!user?.isAdmin;
  const currentFirebaseUser = auth?.currentUser;

  // Effect for access control and redirection
  useEffect(() => {
    if (!overallLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!currentUserIsAdmin) {
        setMessage('Access Denied: You do not have administrative privileges to view this page.');
        router.replace('/dashboard');
      }
    }
  }, [user, currentUserIsAdmin, overallLoading, router]);

  // Effect to fetch and listen to all user data for the admin table
  useEffect(() => {
    if (!db || !currentUserIsAdmin) {
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    const usersCollectionRef = collection(db, `artifacts/${APP_ID}/users`);

    const unsubscribe = onSnapshot(usersCollectionRef, async (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedUsers: AppUser[] = [];
      for (const docSnapshot of snapshot.docs) {
        const userIdFromPath = docSnapshot.id;
        const profileDocRef = doc(db, `artifacts/${APP_ID}/users/${userIdFromPath}/user_data/profile`);
        try {
          const profileSnap: DocumentSnapshot<DocumentData> = await getDoc(profileDocRef);
          if (profileSnap.exists()) {
            const rawData = profileSnap.data();
            const { isAdmin: rawIsAdmin, email: rawEmail, ...restData } = rawData;

            fetchedUsers.push({
              id: userIdFromPath,
              email: (rawEmail as string) || 'N/A',
              isAdmin: !!rawIsAdmin,
              ...restData
            } as AppUser);
          } else {
            fetchedUsers.push({ id: userIdFromPath, email: 'N/A (Profile Missing)', isAdmin: false });
          }
        } catch (error: any) {
          console.error("Error fetching user profile for ID:", userIdFromPath, error);
          fetchedUsers.push({ id: userIdFromPath, email: 'Error Fetching Profile', isAdmin: false });
        }
      }
      setUsers(fetchedUsers);
      setLoadingUsers(false);
    }, (error: any) => {
      console.error("Error listening to users collection:", error);
      setMessage('Failed to load user data.');
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [db, currentUserIsAdmin, APP_ID]);

  // Effect to fetch and listen to product data for the admin table
  useEffect(() => {
    if (!db || !currentUserIsAdmin) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    const productsCollectionRef = collection(db, `artifacts/${APP_ID}/products`);

    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedProducts: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    }, (error: any) => {
      console.error("Error listening to products collection:", error);
      setMessage('Failed to load product data.');
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [db, currentUserIsAdmin, APP_ID]);

  const handleLogout = async () => {
    try {
      if (!auth) {
        setMessage("Firebase authentication is not initialized.");
        return;
      }
      await signOut(auth);
      router.replace('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      setMessage('Failed to log out.');
    }
  };

  const toggleAdminStatus = async (targetUserId: string, currentStatus: boolean) => {
    if (!db || !currentUserIsAdmin) {
      setMessage("Permission denied to change admin status.");
      return;
    }
    setMessage('');
    const userProfileRef = doc(db, `artifacts/${APP_ID}/users/${targetUserId}/user_data/profile`);
    try {
      await setDoc(userProfileRef, { isAdmin: !currentStatus }, { merge: true });
      setMessage(`Admin status for ${targetUserId} updated successfully.`);
    } catch (error: any) {
      console.error("Error toggling admin status:", error);
      setMessage(`Failed to update admin status for ${targetUserId}.`);
    }
  };

  // Product Management Functions
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSizesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductForm(prev => ({
      ...prev,
      sizes: value.split(',').map(s => s.trim()).filter(s => s !== '')
    }));
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUserIsAdmin) {
      setMessage("Permission denied to manage products.");
      return;
    }
    setMessage('');
    setLoadingProducts(true);

    try {
      if (editingProduct) {
        // Update existing product
        const productDocRef = doc(db, `artifacts/${APP_ID}/products/${editingProduct.id}`);
        await updateDoc(productDocRef, {
          ...productForm,
          updatedAt: serverTimestamp()
        });
        setMessage(`Product "${productForm.name}" updated successfully!`);
      } else {
        // Add new product
        const productsCollectionRef = collection(db, `artifacts/${APP_ID}/products`);
        await addDoc(productsCollectionRef, {
          ...productForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setMessage(`Product "${productForm.name}" added successfully!`);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, imageUrl: '', stock: 0, origin: '', story: '', sizes: [] });
    } catch (error: any) {
      console.error("Error saving product:", error);
      setMessage(`Failed to save product: ${error.message}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!db || !currentUserIsAdmin) {
      setMessage("Permission denied to delete products.");
      return;
    }
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }
    setMessage('');
    setLoadingProducts(true);
    try {
      const productDocRef = doc(db, `artifacts/${APP_ID}/products/${productId}`);
      await deleteDoc(productDocRef);
      setMessage(`Product "${productName}" deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      setMessage(`Failed to delete product: ${error.message}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductForm(true);
  };

  const cancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({ name: '', price: 0, imageUrl: '', stock: 0, origin: '', story: '', sizes: [] });
  };

  if (overallLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Admin Dashboard...</div>
      </div>
    );
  }

  if (!user || !currentUserIsAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void-black text-white p-4 font-inter">
        <div className="culture-card p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-treasure-gold mb-4 animate-fade-in-up">Access Denied</h2>
          <p className="text-lg text-white/80 mb-6">You do not have administrative privileges to view this page.</p>
          {message && <p className="text-red-300 text-sm mb-4">{message}</p>}
          <button
            onClick={() => router.replace('/dashboard')}
            className="py-2 px-6 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors shadow-lg"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="ml-4 py-2 px-6 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white p-6 font-inter">
      <div className="max-w-4xl mx-auto culture-card p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8 animate-fade-in-up">Admin Dashboard</h2>
        <div className="flex justify-between items-center mb-6">
          <p className="text-md text-white/80">
            Welcome, <span className="font-semibold">{user?.name || 'Admin User'}</span>!
          </p>
          <button
            onClick={handleLogout}
            className="py-2 px-5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
          >
            Logout
          </button>
        </div>

        {userId && (
          <p className="text-sm text-white/60 text-center mb-6">
            Your User ID: <span className="font-mono break-all">{userId}</span>
          </p>
        )}

        {message && (
          <p className={`text-center text-sm ${message.includes('success') ? 'text-green-300' : 'text-red-300'} font-medium mb-4`}>
            {message}
          </p>
        )}

        {/* User Management Section */}
        <h3 className="text-2xl font-semibold text-white mb-4">Manage Users</h3>
        {loadingUsers ? (
          <div className="text-center text-white/80 py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-white/80 py-8">No users found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-treasure-gold/30 mb-10">
            <table className="min-w-full divide-y divide-treasure-gold/30">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Admin Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-void-black divide-y divide-treasure-gold/20">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white break-all">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-green-700/30 text-green-300' : 'bg-red-700/30 text-red-300'}`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                        className={`py-1 px-3 rounded-md font-medium transition duration-200 ${user.isAdmin ? 'bg-orange-700/50 hover:bg-orange-600 text-white' : 'bg-treasure-gold hover:bg-amber-500 text-black'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!!(currentFirebaseUser && currentFirebaseUser.uid === user.id)}
                      >
                        {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Product Management Section */}
        <h3 className="text-2xl font-semibold text-white mb-4">Manage Products</h3>
        <button
          onClick={() => setShowProductForm(true)}
          className="py-2 px-6 bg-globe-blue text-black font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-lg mb-6"
        >
          Add New Product
        </button>

        {showProductForm && (
          <div className="culture-card p-6 rounded-xl shadow-lg mb-10">
            <h4 className="text-xl font-bold text-treasure-gold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h4>
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white/80 mb-1">Product Name</label>
                <input type="text" id="name" name="name" value={productForm.name} onChange={handleProductFormChange} required
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div>
                <label htmlFor="price" className="block text-white/80 mb-1">Price</label>
                <input type="number" id="price" name="price" value={productForm.price} onChange={handleProductFormChange} required step="0.01"
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-white/80 mb-1">Image URL</label>
                <input type="text" id="imageUrl" name="imageUrl" value={productForm.imageUrl} onChange={handleProductFormChange} required
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div>
                <label htmlFor="stock" className="block text-white/80 mb-1">Stock</label>
                <input type="number" id="stock" name="stock" value={productForm.stock} onChange={handleProductFormChange} required
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div>
                <label htmlFor="origin" className="block text-white/80 mb-1">Origin</label>
                <input type="text" id="origin" name="origin" value={productForm.origin} onChange={handleProductFormChange} required
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div>
                <label htmlFor="story" className="block text-white/80 mb-1">Story</label>
                <textarea id="story" name="story" value={productForm.story} onChange={handleProductFormChange} required rows={3}
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold"></textarea>
              </div>
              <div>
                <label htmlFor="sizes" className="block text-white/80 mb-1">Sizes (comma-separated, e.g., S, M, L)</label>
                <input type="text" id="sizes" name="sizes" value={productForm.sizes?.join(', ') || ''} onChange={handleSizesChange}
                  className="w-full bg-gray-800/50 border border-treasure-gold/30 px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-treasure-gold" />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={cancelProductForm}
                  className="py-2 px-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors shadow-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loadingProducts}
                  className="py-2 px-4 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors shadow-lg disabled:opacity-50">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loadingProducts ? (
          <div className="text-center text-white/80 py-8">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-white/80 py-8">No products found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-treasure-gold/30">
            <table className="min-w-full divide-y divide-treasure-gold/30">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-void-black divide-y divide-treasure-gold/20">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white break-all">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="py-1 px-3 rounded-md font-medium bg-globe-blue hover:bg-teal-500 text-black transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => product.id && handleDeleteProduct(product.id, product.name)}
                        className="py-1 px-3 rounded-md font-medium bg-red-700 hover:bg-red-600 text-white transition duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Placeholder for other admin functionalities */}
        <div className="mt-10 p-6 culture-card rounded-lg">
          <h3 className="text-2xl font-semibold text-white mb-4">Other Admin Features</h3>
          <p className="text-white/80">
            This section can be expanded to include:
          </p>
          <ul className="list-disc list-inside mt-4 text-white/80 space-y-2">
            <li>**Order Management:** View and update customer orders.</li>
            <li>**Content Management:** Manage blog posts, announcements, or other static content.</li>
            <li>**Site Settings:** Configure global website preferences.</li>
            <li>**Analytics & Reporting:** Display key metrics and generate reports.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

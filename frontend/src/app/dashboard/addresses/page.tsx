'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { useFirebase, APP_ID } from '@/components/FirebaseProvider';
import { collection, query, onSnapshot, DocumentData, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface Address {
  id: string;
  name: string; // e.g., "Home", "Work", or recipient name
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string; // Default to "India"
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function DashboardAddressesPage() {
  const router = useRouter();
  const { currentUser, loadingFirebase, isAuthReady, db } = useFirebase();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null); // Null for new, Address object for edit
  const [message, setMessage] = useState<string | null>(null); // FIX: Added message state

  // Form state for adding/editing
  const [formData, setFormData] = useState<Omit<Address, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: 'India', // Default country
  });

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.push('/login');
    }
  }, [isAuthReady, currentUser, router]);

  // Fetch user addresses in real-time
  useEffect(() => {
    if (!db || !currentUser?.uid || !isAuthReady) {
      console.log("Skipping addresses fetch: DB unavailable, user not logged in, or auth not ready.");
      setLoadingAddresses(false);
      if (!currentUser?.uid && addresses.length > 0) {
        setAddresses([]);
      }
      return;
    }

    setLoadingAddresses(true);
    setError(null);
    setMessage(null); // Clear message on new fetch

    console.log(`Firestore Path UID for Addresses: ${currentUser.uid}, APP_ID: ${APP_ID}`);

    const addressesCollectionRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`);
    const q = query(addressesCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAddresses: Address[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          name: data.name || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || 'India',
          isDefault: data.isDefault || false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        };
      });
      // Sort to show default first
      fetchedAddresses.sort((a, b) => (b.isDefault as any) - (a.isDefault as any));
      setAddresses(fetchedAddresses);
      setLoadingAddresses(false);
      console.log(`Successfully fetched ${fetchedAddresses.length} addresses.`);
    }, (err: any) => {
      console.error("Error fetching addresses:", err);
      setError('Failed to load your addresses. Please try again later.');
      setLoadingAddresses(false);
    });

    return () => unsubscribe();
  }, [db, currentUser, isAuthReady, APP_ID, addresses.length]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser?.uid || isSaving) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const addressDataToSave = {
        ...formData,
        updatedAt: new Date(),
      };

      if (editingAddress) {
        // Update existing address
        const addressDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`, editingAddress.id);
        await updateDoc(addressDocRef, addressDataToSave);
        setMessage('Address updated successfully!');
      } else {
        // Add new address
        const newAddressRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`);
        const newDocRef = await addDoc(newAddressRef, {
          ...addressDataToSave,
          createdAt: new Date(),
          isDefault: addresses.length === 0, // Set as default if it's the first address
        });
        setMessage('Address added successfully!');
        if (addresses.length === 0) {
          // If this was the first address, ensure it's marked as default in Firestore
          // The onSnapshot will pick this up, but we can explicitly update if needed.
          // Or, better, handle setting default in a separate function.
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      resetForm();
    } catch (err: any) {
      console.error("Error saving address:", err);
      setMessage(`Failed to save address: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!db || !currentUser?.uid || isSaving) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const addressDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`, addressId);
      await deleteDoc(addressDocRef);
      setMessage('Address deleted successfully!');
    } catch (err: any) {
      console.error("Error deleting address:", err);
      setMessage(`Failed to delete address: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!db || !currentUser?.uid || isSaving) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const batch = writeBatch(db);

      // Set all other addresses to not default
      addresses.forEach(addr => {
        if (addr.id !== addressId && addr.isDefault) {
          const docRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`, addr.id);
          batch.update(docRef, { isDefault: false });
        }
      });

      // Set the selected address as default
      const selectedDocRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/addresses`, addressId);
      batch.update(selectedDocRef, { isDefault: true });

      await batch.commit();
      setMessage('Default address updated successfully!');
    } catch (err: any) {
      console.error("Error setting default address:", err);
      setMessage(`Failed to set default address: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    });
    setShowAddressForm(true);
  };

  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
    });
  };

  if (!isAuthReady || loadingAddresses) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void-black text-white text-2xl">
        {loadingFirebase ? 'Loading Firebase...' : 'Loading Addresses...'}
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-void-black text-white font-inter relative overflow-x-hidden">
      <Header />
      <div className="p-6 pt-20">
        <div className="max-w-4xl mx-auto culture-card p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-treasure-gold mb-8">Manage Your Addresses</h2>

          {message && ( // FIX: Use message state here
            <p className={`text-center text-sm ${message.includes('success') ? 'text-green-300' : 'text-red-300'} font-medium mb-4`}>
              {message}
            </p>
          )}

          {!showAddressForm && (
            <div className="mb-6 text-center">
              <button
                onClick={() => { setShowAddressForm(true); setEditingAddress(null); resetForm(); }}
                className="px-6 py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
              >
                Add New Address
              </button>
            </div>
          )}

          {showAddressForm ? (
            <form onSubmit={handleAddEditAddress} className="space-y-6 p-6 border border-gray-700/50 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-treasure-gold mb-4">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <div>
                <label htmlFor="name" className="block mb-2 text-white/80">Address Name (e.g., Home, Work)</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
              </div>
              <div>
                <label htmlFor="addressLine1" className="block mb-2 text-white/80">Address Line 1</label>
                <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
              </div>
              <div>
                <label htmlFor="addressLine2" className="block mb-2 text-white/80">Address Line 2 (Optional)</label>
                <input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2 || ''} onChange={handleFormChange} className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block mb-2 text-white/80">City</label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
                </div>
                <div>
                  <label htmlFor="state" className="block mb-2 text-white/80">State</label>
                  <input type="text" id="state" name="state" value={formData.state} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
                </div>
              </div>
              <div>
                <label htmlFor="zip" className="block mb-2 text-white/80">ZIP Code</label>
                <input type="text" id="zip" name="zip" value={formData.zip} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
              </div>
              <div>
                <label htmlFor="country" className="block mb-2 text-white/80">Country</label>
                <input type="text" id="country" name="country" value={formData.country} onChange={handleFormChange} required className="w-full px-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-treasure-gold" />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="py-2 px-5 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`py-2 px-5 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                </button>
              </div>
            </form>
          ) : (
            addresses.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xl text-white/70 mb-4">You have no saved addresses.</p>
                <button
                  onClick={() => { setShowAddressForm(true); setEditingAddress(null); resetForm(); }}
                  className="px-6 py-3 bg-treasure-gold text-black font-bold rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {addresses.map(address => (
                  <div key={address.id} className={`bg-gray-800/50 p-6 rounded-lg border shadow-md ${address.isDefault ? 'border-treasure-gold' : 'border-gray-700/50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-white text-lg">{address.name}</h3>
                      {address.isDefault && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-treasure-gold text-black">Default</span>
                      )}
                    </div>
                    <p className="text-white/80">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-white/80">{address.addressLine2}</p>}
                    <p className="text-white/80">{address.city}, {address.state} - {address.zip}</p>
                    <p className="text-white/80">{address.country}</p>

                    <div className="mt-4 flex space-x-4">
                      <button
                        onClick={() => handleEditClick(address)}
                        className="text-treasure-gold hover:text-amber-500 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="text-white/60 hover:text-blue-400 transition-colors text-sm font-medium"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

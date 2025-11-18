'use client';

import { useState, useEffect } from 'react';
import { User, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  businessName: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    businessName: '',
    phone: '',
    address: '',
    created_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // For MVP, we'll use a demo user ID
        const demoUserId = 'demo-user';

        // Try to fetch existing profile from Supabase
        const { data: existingProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', demoUserId)
          .single();

        if (existingProfile && !error) {
          setProfile({
            id: existingProfile.id,
            email: existingProfile.email || '',
            name: existingProfile.name || '',
            businessName: existingProfile.business_name || '',
            phone: existingProfile.phone || '',
            address: existingProfile.address || '',
            created_at: existingProfile.created_at,
          });
        } else {
          // Create a default profile if it doesn't exist
          const defaultProfile = {
            id: demoUserId,
            email: 'demo@smartinvoice.com',
            name: 'Demo User',
            business_name: 'Smart Invoice Demo',
            phone: '',
            address: '',
            created_at: new Date().toISOString(),
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert(defaultProfile)
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile({
              id: newProfile.id,
              email: newProfile.email || '',
              name: newProfile.name || '',
              businessName: newProfile.business_name || '',
              phone: newProfile.phone || '',
              address: newProfile.address || '',
              created_at: newProfile.created_at,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          business_name: profile.businessName,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
      } else {
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User size={32} className="text-blue-600" />
            Profile Settings
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Business Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your business name"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This name will be used in your social media posts and invoices
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your business address"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Profile Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your business name will appear in social media milestone posts</li>
            <li>• Keep your contact information up to date for client communications</li>
            <li>• A complete profile helps build trust with your clients</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
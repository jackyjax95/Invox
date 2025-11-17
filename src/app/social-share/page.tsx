'use client';

import { useState, useEffect } from 'react';
import { Share2, Facebook, Instagram, Copy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SocialPost {
  post: string;
  hashtags: string[];
  milestone: number;
  businessName: string;
}

export default function SocialSharePage() {
  const [pendingPost, setPendingPost] = useState<SocialPost | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load pending social post from localStorage
    const storedPost = localStorage.getItem('pendingSocialPost');
    if (storedPost) {
      setPendingPost(JSON.parse(storedPost));
    }
  }, []);

  const copyToClipboard = async () => {
    if (!pendingPost) return;

    const fullText = `${pendingPost.post}\n\n${pendingPost.hashtags.join(' ')}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareToFacebook = () => {
    if (!pendingPost) return;

    const text = encodeURIComponent(`${pendingPost.post}\n\n${pendingPost.hashtags.join(' ')}`);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${text}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToInstagram = () => {
    if (!pendingPost) return;

    // Instagram doesn't have a direct share URL, so we'll copy to clipboard and open Instagram
    const fullText = `${pendingPost.post}\n\n${pendingPost.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Open Instagram app/website
    window.open('https://www.instagram.com/', '_blank');
  };

  const dismissPost = () => {
    localStorage.removeItem('pendingSocialPost');
    setPendingPost(null);
  };

  if (!pendingPost) {
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
            <h1 className="text-3xl font-bold text-gray-900">Social Media Share</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Pending Posts</h2>
            <p className="text-gray-600">
              Create more invoices to unlock milestone achievements and social media posts to share!
            </p>
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
          <h1 className="text-3xl font-bold text-gray-900">Share Your Milestone! 🎉</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Milestone: {pendingPost.milestone} Invoices Created
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-800 whitespace-pre-line mb-3">{pendingPost.post}</p>
            <div className="flex flex-wrap gap-2">
              {pendingPost.hashtags.map((hashtag, index) => (
                <span key={index} className="text-blue-600 font-medium">
                  {hashtag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={shareToFacebook}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook size={20} />
              Share on Facebook
            </button>

            <button
              onClick={shareToInstagram}
              className="flex-1 flex items-center justify-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Instagram size={20} />
              Share on Instagram
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips for Social Media</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add a relevant image or graphic to make your post more engaging</li>
            <li>• Tag friends or business partners who might be interested</li>
            <li>• Use location tags if your business has a physical location</li>
            <li>• Engage with comments to build your business community</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={dismissPost}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Dismiss this post
          </button>
        </div>
      </div>
    </div>
  );
}
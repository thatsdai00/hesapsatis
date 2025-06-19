'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'react-toastify';
import { FaSave, FaImage } from 'react-icons/fa';
import ImageUploader from '@/components/ImageUploader';

interface SeoFormData {
  siteTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  contactEmail: string;
}

export default function SeoPage() {
  const [formData, setFormData] = useState<SeoFormData>({
    siteTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ogImage: '',
    contactEmail: '',
  });

  const utils = trpc.useUtils();

  const { data: siteSettings, isLoading } = trpc.admin.getSiteSettings.useQuery();
  
  // Use useEffect to update form data when settings are loaded
  useEffect(() => {
    if (siteSettings) {
      setFormData({
        siteTitle: siteSettings.siteTitle || '',
        seoDescription: siteSettings.seoDescription || '',
        seoKeywords: siteSettings.seoKeywords || '',
        ogImage: siteSettings.ogImage || '',
        contactEmail: siteSettings.contactEmail || '',
      });
    }
  }, [siteSettings]);

  const updateSiteSettings = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      utils.admin.getSiteSettings.invalidate();
      toast.success('SEO settings updated successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, ogImage: imageUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.siteTitle || !formData.contactEmail) {
      toast.error('Site title and contact email are required');
      return;
    }

    updateSiteSettings.mutate({
      siteTitle: formData.siteTitle,
      seoDescription: formData.seoDescription,
      seoKeywords: formData.seoKeywords,
      ogImage: formData.ogImage,
      contactEmail: formData.contactEmail,
    });
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>SEO Management</h1>
        <p>Optimize your site for search engines</p>
      </div>

      <div className="admin-card mb-8">
        <div className="mb-4">
          <h2 className="admin-title">Site-wide SEO Settings</h2>
          <p className="text-gray-400 text-sm">
            These settings affect your entire website's SEO and social media presence.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="siteTitle" className="block text-sm font-medium mb-2">
                Site Title *
              </label>
              <input
                type="text"
                id="siteTitle"
                name="siteTitle"
                value={formData.siteTitle}
                onChange={handleInputChange}
                className="admin-input w-full"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                This title will be used for SEO across the site. It will appear as:
              </p>
              <ul className="text-xs text-gray-400 mt-1 ml-4 list-disc">
                <li>Homepage: "{siteSettings?.siteName || 'Site Name'} | {formData.siteTitle}"</li>
                <li>Dashboard: "Hesabım | {siteSettings?.siteName || 'Site Name'}"</li>
                <li>Support pages: "Destek | {siteSettings?.siteName || 'Site Name'}"</li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
                Meta Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleInputChange}
                rows={3}
                className="admin-input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                A brief description of your website that appears in search results and social media previews.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="seoKeywords" className="block text-sm font-medium mb-2">
                Meta Keywords
              </label>
              <input
                type="text"
                id="seoKeywords"
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleInputChange}
                className="admin-input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Comma-separated keywords related to your website.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Social Media Preview Image
              </label>
              <ImageUploader
                currentImage={formData.ogImage}
                uploadPath="/api/upload/seo"
                onImageUploaded={handleImageUploaded}
                className="mb-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                This image will be displayed when your site is shared on social media platforms.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="admin-input w-full"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Email address displayed on your website for contact purposes.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="admin-button flex items-center gap-2"
              disabled={updateSiteSettings.isPending}
            >
              {updateSiteSettings.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <FaSave size={14} />
                  Save SEO Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card mt-8">
        <div className="mb-4">
          <h2 className="admin-title">SEO Preview</h2>
          <p className="text-gray-400 text-sm">
            This is how your site might appear in search results and social media.
          </p>
        </div>
        
        <div className="border border-gray-700 rounded-md p-4 bg-gray-900">
          <h3 className="text-blue-400 text-lg font-medium hover:underline">
            {siteSettings?.siteName} | {formData.siteTitle}
          </h3>
          <p className="text-green-500 text-sm">https://yourdomain.com</p>
          <p className="text-gray-300 text-sm mt-1">
            {formData.seoDescription || "Add a description to see how it will appear in search results."}
          </p>
        </div>

        <div className="mt-6 border border-gray-700 rounded-md p-4 bg-gray-900">
          <p className="text-gray-400 mb-2 text-sm">Social Media Preview:</p>
          <div className="border border-gray-600 rounded-md overflow-hidden">
            {formData.ogImage ? (
              <div className="relative h-48 w-full">
                <img 
                  src={formData.ogImage.startsWith('/') ? `${window.location.origin}${formData.ogImage}` : formData.ogImage} 
                  alt="Social preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <FaImage className="text-gray-600 text-4xl" />
              </div>
            )}
            <div className="p-3 bg-white dark:bg-gray-800">
              <h3 className="text-gray-800 dark:text-white font-medium">
                {siteSettings?.siteName} | {formData.siteTitle}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {formData.seoDescription || "Add a description to see how it will appear in social media previews."}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">yourdomain.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
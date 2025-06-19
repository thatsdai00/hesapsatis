'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import FuturisticCheckbox from '@/components/ui/FuturisticCheckbox';
import HtmlEditor from '@/components/admin/HtmlEditor';

// Define interface for custom page data
interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  [key: string]: any; // Allow any additional properties
}

export default function CustomPagesPage() {
  // State hooks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<CustomPageData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    published: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const utils = trpc.useUtils();

  // Query hooks
  const { 
    data: pagesData, 
    isLoading: pagesLoading,
    error: pagesError
  } = trpc.admin.getCustomPages.useQuery(
    { limit: 50 },
    { retry: false }
  );
  
  // Mutation hooks
  const createCustomPage = trpc.admin.createCustomPage.useMutation({
    onSuccess: () => {
      utils.admin.getCustomPages.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Custom page created successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateCustomPage = trpc.admin.updateCustomPage.useMutation({
    onSuccess: () => {
      utils.admin.getCustomPages.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Custom page updated successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteCustomPage = trpc.admin.deleteCustomPage.useMutation({
    onSuccess: () => {
      utils.admin.getCustomPages.invalidate();
      toast.success('Custom page deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const customPages = pagesData?.customPages || [];
  const isLoading = pagesLoading;

  // Event handlers
  const handleAddNewClick = () => {
    resetForm();
    setCurrentPage(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (page: CustomPageData) => {
    setCurrentPage(page);
    
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      published: page.published,
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      seoKeywords: page.seoKeywords || '',
    });
    
    // Ensure the modal opens after setting the form data
    setTimeout(() => {
      setIsModalOpen(true);
    }, 0);
  };

  const handleDeleteClick = async (pageId: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await deleteCustomPage.mutateAsync({ id: pageId });
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.slug) {
      toast.error('Title and slug are required');
      return;
    }
    
    try {
      if (currentPage) {
        await updateCustomPage.mutateAsync({
          id: currentPage.id,
          ...formData,
        });
      } else {
        await createCustomPage.mutateAsync({
          ...formData,
        });
      }
    } catch (error) {
      console.error('Error saving custom page:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      published: true,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
  };

  // Event handlers for form inputs with auto slug generation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    // Auto-generate slug when title changes
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  // Render function with conditional content
  function renderContent() {
    if (isLoading) {
      return <div className="text-center py-10">Loading pages...</div>;
    }

    if (pagesError) {
      return (
        <div className="text-center py-10 text-red-500">
          Error loading data: {pagesError.message}
        </div>
      );
    }

    return (
      <>
        <div className="admin-header">
          <h1>Custom Pages Management</h1>
          <p>Add, edit, and manage your custom pages</p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <button 
              onClick={handleAddNewClick}
              className="admin-button flex items-center gap-2"
            >
              <FaPlus size={14} /> Add New Page
            </button>
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="title-column">Title</th>
                  <th className="slug-column">Slug</th>
                  <th className="status-column">Status</th>
                  <th className="date-column">Created</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customPages.map((page: CustomPageData) => (
                  <tr key={page.id}>
                    <td className="title-column">
                      <div className="font-medium">{page.title}</div>
                    </td>
                    <td className="slug-column">
                      <div className="text-xs text-gray-500">{page.slug}</div>
                    </td>
                    <td className="status-column">
                      <span
                        className={`admin-badge ${
                          page.published ? 'admin-badge-success' : 'admin-badge-warning'
                        }`}
                      >
                        {page.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="date-column">
                      {new Date(page.createdAt).toLocaleDateString()}
                    </td>
                    <td className="actions-column">
                      <div className="flex space-x-2 justify-end">
                        <button 
                          onClick={() => handleEditClick(page)}
                          className="admin-icon-button bg-blue-600 hover:bg-blue-700"
                          type="button"
                          aria-label={`Edit ${page.title}`}
                        >
                          <FaEdit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(page.id)}
                          className="admin-icon-button bg-red-600 hover:bg-red-700"
                          type="button"
                          aria-label={`Delete ${page.title}`}
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customPages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No custom pages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Page Form Modal */}
        {isModalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {currentPage ? 'Edit Custom Page' : 'Add New Custom Page'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="admin-modal-close"
                  type="button"
                >
                  &times;
                </button>
              </div>
              
              <div className="admin-modal-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        className="admin-input w-full"
                        required
                      />
                    </div>
                      
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="admin-input w-full"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <FuturisticCheckbox
                        id="published"
                        name="published"
                        checked={formData.published}
                        onChange={handleCheckboxChange}
                        label="Published"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Content</label>
                      <HtmlEditor
                        value={formData.content}
                        onChange={handleContentChange}
                      />
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-3">SEO Settings</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">SEO Title</label>
                        <input
                          type="text"
                          name="seoTitle"
                          value={formData.seoTitle}
                          onChange={handleInputChange}
                          className="admin-input w-full"
                          placeholder="Leave empty to use page title"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">SEO Description</label>
                        <textarea
                          name="seoDescription"
                          value={formData.seoDescription}
                          onChange={handleInputChange}
                          className="admin-input w-full"
                          rows={3}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                        <input
                          type="text"
                          name="seoKeywords"
                          value={formData.seoKeywords}
                          onChange={handleInputChange}
                          className="admin-input w-full"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="admin-button-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-button"
                    >
                      {currentPage ? 'Update Page' : 'Create Page'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return renderContent();
} 
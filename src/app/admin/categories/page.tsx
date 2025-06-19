'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';
import FuturisticCheckbox from '@/components/ui/FuturisticCheckbox';

// Define the Category type
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  showOnHomepage: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    showOnHomepage: false,
  });

  const utils = trpc.useUtils();

  const { data: categories, isLoading } = trpc.admin.getCategories.useQuery();

  const createCategory = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      utils.admin.getCategories.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateCategory = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      utils.admin.getCategories.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteCategory = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      utils.admin.getCategories.invalidate();
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-generate slug when name changes
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    if (currentCategory) {
      updateCategory.mutate({ id: currentCategory.id, ...formData });
    } else {
      createCategory.mutate(formData);
    }
  };

  const openEditModal = (category: Category) => {
    console.log('Edit clicked for category:', category.name);
    setCurrentCategory(category);
    
    // Make sure we use the relative path stored in the database for the form
    const imageUrl = category.image || '';
    
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: imageUrl,
      showOnHomepage: category.showOnHomepage || false,
    });
    
    // Ensure the modal opens after setting the form data
    setTimeout(() => {
    setIsModalOpen(true);
    }, 0);
  };

  const openCreateModal = () => {
    setCurrentCategory(null);
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      showOnHomepage: false,
    });
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) {
      toast.error('Cannot delete category with products');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory.mutate({ id });
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, image: imageUrl }));
  };

  // Fix image URLs if they're stored as relative paths
  useEffect(() => {
    if (categories?.length) {
      categories.forEach(category => {
        if (category.image && !category.image.startsWith('http')) {
          // This is just for display purposes, doesn't change the database
          category.image = `${window.location.origin}${category.image}`;
        }
      });
    }
  }, [categories]);

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Product Categories</h1>
        <p>Manage your product categories and organization</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
        <button
          onClick={openCreateModal}
            className="admin-button flex items-center gap-2"
        >
            <FaPlus size={14} /> Add New Category
        </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="image-column">Image</th>
                <th className="name-column">Name</th>
                <th className="slug-column">Slug</th>
                <th className="homepage-column">Homepage</th>
                <th className="products-column">Products</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((category: Category) => (
                <tr key={category.id}>
                  <td className="image-column">
                    {category.image ? (
                      <div className="relative w-20 h-12 rounded-md overflow-hidden">
                        <Image 
                          src={category.image} 
                          alt={category.name} 
                          fill 
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-12 bg-gray-800 rounded-md flex items-center justify-center">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="name-column font-medium">{category.name}</td>
                  <td className="slug-column text-sm text-gray-400">{category.slug}</td>
                  <td className="homepage-column">
                    {category.showOnHomepage ? (
                      <span className="admin-badge admin-badge-success flex items-center gap-1 w-fit">
                        <FaCheck size={10} /> Yes
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-warning flex items-center gap-1 w-fit">
                        <FaTimes size={10} /> No
                      </span>
                    )}
                  </td>
                  <td className="products-column text-center">{category._count?.products || 0}</td>
                  <td className="actions-column">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Edit button clicked for:', category.name);
                          openEditModal(category);
                        }}
                        className="admin-icon-button bg-blue-600 hover:bg-blue-700"
                        type="button"
                        aria-label={`Edit ${category.name}`}
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(category.id, category._count?.products || 0);
                        }}
                        className={`admin-icon-button ${
                          category._count?.products ? 'admin-icon-button-disabled' : 'bg-red-600 hover:bg-red-700'
                        }`}
                        disabled={category._count?.products ? true : false}
                        type="button"
                        aria-label={`Delete ${category.name}`}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No categories found. Create your first category!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Form Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {currentCategory ? 'Edit Category' : 'Add New Category'}
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
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                        className="admin-input w-full"
                    required
                  />
                </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <div className="flex gap-2">
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                          className="admin-input w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                    
                    <div className="mb-4">
                      <FuturisticCheckbox
                    id="showOnHomepage"
                    name="showOnHomepage"
                    checked={formData.showOnHomepage}
                    onChange={handleCheckboxChange}
                        label="Show on Homepage"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Image</label>
                      <ImageUploader
                        onImageUploaded={handleImageUploaded}
                        currentImage={formData.image}
                        type="categories"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="admin-input w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="admin-modal-footer">
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
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {createCategory.isPending || updateCategory.isPending
                    ? 'Saving...'
                    : currentCategory
                    ? 'Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
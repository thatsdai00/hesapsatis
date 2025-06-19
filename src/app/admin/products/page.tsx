'use client';

import * as React from 'react';

import {useState} from 'react';
import { trpc } from '@/lib/trpc-client';
import { FaEdit, FaTrash, FaPlus, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';
import Link from 'next/link';
import FuturisticCheckbox from '@/components/ui/FuturisticCheckbox';
import HtmlEditor from '@/components/admin/HtmlEditor';

// Define a more specific interface that matches what comes back from the server
interface ProductFromServer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number; // This will be a string from server due to Decimal serialization
  image: string | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  stockCount: number;
  published: boolean;
  isFeatured: boolean;
  [key: string]: unknown; // Allow any additional properties
}

export default function ProductsPage() {
  // Always call hooks at the top level, before any conditional logic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductFromServer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    categoryId: '',
    stockCount: 0,
    published: false,
    isFeatured: false,
    image: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const utils = trpc.useUtils();

  // Query hooks - always call these at the top level
  const { 
    data: productsData, 
    isLoading: productsLoading,
    error: productsError
  } = trpc.admin.getProducts.useQuery(
    { limit: 10 },
    { retry: false }
  );
  
  const { 
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError 
  } = trpc.admin.getCategories.useQuery(
    undefined,
    { retry: false }
  );

  // Mutation hooks - always call these at the top level
  const createProduct = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      utils.admin.getProducts.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      utils.admin.getProducts.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      utils.admin.getProducts.invalidate();
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  
  const products = productsData?.products || [];
  const isLoading = productsLoading || categoriesLoading;

  // Fix image URLs if they're stored as relative paths
  useEffect(() => {
    if (products?.length) {
      products.forEach(product => {
        if (product.image && !product.image.startsWith('http')) {
          // This is just for display purposes, doesn't change the database
          product.image = `${window.location.origin}${product.image}`;
        }
      });
    }
  }, [products]);

  // Event handlers
  const handleAddNewClick = () => {
    resetForm();
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product: unknown) => {
    console.log('Edit clicked for product:', product);
    setCurrentProduct(product);
    
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      categoryId: product.categoryId || '',
      stockCount: product.stockCount || 0,
      published: product.published || false,
      isFeatured: product.isFeatured || false,
      image: product.image || '',
      seoDescription: product.seoDescription || '',
      seoKeywords: product.seoKeywords || '',
    });
    
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync({ id: productId });
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.slug || !formData.categoryId) {
      toast.error('Name, slug, and category are required');
      return;
    }
    
    // Ensure price is a positive number
    const price = parseFloat(formData.price.toString());
    if (isNaN(price) || price < 0) {
      toast.error('Price must be a valid positive number');
      return;
    }
    
    try {
      if (currentProduct) {
        await updateProduct.mutateAsync({
          id: currentProduct.id,
          ...formData,
          price,
        });
      } else {
        await createProduct.mutateAsync({
          ...formData,
          price,
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      categoryId: '',
      stockCount: 0,
      published: false,
      isFeatured: false,
      image: '',
      seoDescription: '',
      seoKeywords: '',
    });
  };

  // Event handlers for form inputs with auto slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate slug when name changes
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Allow empty field (will be validated before submission)
    if (value === '') {
      setFormData(prev => ({ ...prev, price: 0 }));
      return;
    }
    
    // Handle valid numbers including decimals
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, price: numValue }));
    }
  };

  // Render function with conditional content
  function renderContent() {
    if (isLoading) {
      return <div className="text-center py-10">Loading products...</div>;
    }

    if (productsError || categoriesError) {
      return (
        <div className="text-center py-10 text-red-500">
          Error loading data: {productsError?.message || categoriesError?.message}
        </div>
      );
    }

    return (
      <>
        <div className="admin-header">
          <h1>Products Management</h1>
          <p>Add, edit, and manage your product inventory</p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
          <button 
            onClick={handleAddNewClick}
              className="admin-button flex items-center gap-2"
          >
              <FaPlus size={14} /> Add New Product
          </button>
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
            <thead>
                <tr>
                  <th className="image-column">Image</th>
                  <th className="name-column">Name</th>
                  <th className="category-column">Category</th>
                  <th className="price-column">Price</th>
                  <th className="stock-column">Stock</th>
                  <th className="status-column">Status</th>
                  <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                  <tr key={product.id}>
                    <td className="image-column">
                    {product.image ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                        <Image 
                          src={product.image} 
                          alt={product.name}
                          fill
                            sizes="48px"
                            className="object-cover"
                        />
                      </div>
                    ) : (
                        <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center">
                        <FaImage className="text-gray-500" />
                      </div>
                    )}
                  </td>
                    <td className="name-column">
                      <Link 
                        href={`/admin/products/${product.id}`} 
                        className="font-medium hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">{product.slug}</div>
                    </td>
                    <td className="category-column">
                      {product.category?.name || 'No Category'}
                    </td>
                    <td className="price-column">
                      ₺{typeof product.price === 'string' 
                      ? parseFloat(product.price).toFixed(2) 
                      : product.price.toFixed(2)}
                  </td>
                    <td className="stock-column">
                      <span className={product.stockCount <= 5 ? 'text-red-500' : ''}>
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="status-column">
                      <span
                        className={`admin-badge ${
                          product.published ? 'admin-badge-success' : 'admin-badge-warning'
                        }`}
                      >
                      {product.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                    <td className="actions-column">
                      <div className="flex space-x-2 justify-end">
                      <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Edit button clicked for:', product.name);
                            handleEditClick(product);
                          }}
                          className="admin-icon-button bg-blue-600 hover:bg-blue-700"
                          type="button"
                          aria-label={`Edit ${product.name}`}
                      >
                          <FaEdit size={16} />
                      </button>
                      <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(product.id);
                          }}
                          className={`admin-icon-button ${
                            product._count?.orderItems > 0 ? 'admin-icon-button-disabled' : 'bg-red-600 hover:bg-red-700'
                          }`}
                          disabled={product._count?.orderItems > 0}
                          type="button"
                          aria-label={`Delete ${product.name}`}
                      >
                          <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-4">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Product Form Modal */}
        {isModalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {currentProduct ? 'Edit Product' : 'Add New Product'}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                          name="name"
                        value={formData.name}
                        onChange={handleNameChange}
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
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleSelectChange}
                          className="admin-input w-full"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories?.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Price</label>
                      <input
                        type="number"
                          name="price"
                        value={formData.price}
                        onChange={handlePriceChange}
                          step="0.01"
                          min="0"
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
                        <FuturisticCheckbox
                          id="isFeatured"
                          name="isFeatured"
                          checked={formData.isFeatured}
                          onChange={handleCheckboxChange}
                          label="Featured"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Image</label>
                        <ImageUploader
                          onImageUploaded={(url) => {
                            setFormData({ ...formData, image: url });
                          }}
                          currentImage={formData.image}
                          type="products"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <HtmlEditor
                        value={formData.description}
                          onChange={(value: string) => setFormData(prev => ({ ...prev, description: value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 mt-6 pt-6">
                    <h3 className="text-lg font-medium mb-4">SEO Settings</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">SEO Description</label>
                        <textarea
                          name="seoDescription"
                          value={formData.seoDescription}
                          onChange={handleInputChange}
                          rows={2}
                          className="admin-input w-full"
                      />
                    </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                      <input
                          type="text"
                          name="seoKeywords"
                          value={formData.seoKeywords}
                          onChange={handleInputChange}
                          className="admin-input w-full"
                          placeholder="Comma separated keywords"
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
                    disabled={createProduct.isPending || updateProduct.isPending}
                  >
                      {createProduct.isPending || updateProduct.isPending
                        ? 'Saving...'
                        : currentProduct
                        ? 'Update Product'
                        : 'Create Product'}
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

  // Main return - this ensures hooks are always called in the same order
  return renderContent();
} 
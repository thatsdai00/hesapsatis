'use client';

import * as React from 'react';

import {useState} from 'react';
import { FaEdit, FaTrash, FaPlus, FaImage, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';
import FuturisticCheckbox from '@/components/ui/FuturisticCheckbox';
import ImageUploader from '@/components/ImageUploader';

interface QuickAccessItem {
  id: string;
  title: string;
  color: string | null;
  imageUrl: string | null;
  destinationUrl: string;
  visible: boolean;
  order: number;
}

export default function QuickAccessPage() {
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<QuickAccessItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    color: '#1a202c',
    imageUrl: '',
    destinationUrl: '',
    visible: true,
    order: 0,
  });

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/quick-access');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error('Failed to fetch quick access items.');
      }
    } catch (error) {
      toast.error('An error occurred while fetching items.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-expect-error - API call needs validation - API call needs validation - API call needs validation
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
  };
  
  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }));
  };

  const handleAddNewClick = () => {
    setCurrentItem(null);
    setFormData({
      title: '',
      color: '#1a202c',
      imageUrl: '',
      destinationUrl: '',
      visible: true,
      order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (item: QuickAccessItem) => {
    setCurrentItem(item);
    setFormData({
      title: item.title,
      color: item.color || '#1a202c',
      imageUrl: item.imageUrl || '',
      destinationUrl: item.destinationUrl,
      visible: item.visible,
      order: item.order,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await fetch(`/api/admin/quick-access/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success('Item deleted successfully.');
          fetchItems();
        } else {
          toast.error('Failed to delete item.');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the item.');
        console.error(error);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.destinationUrl) {
      toast.error('Title and Destination URL are required');
      return;
    }

    const method = currentItem ? 'PUT' : 'POST';
    const url = currentItem
      ? `/api/admin/quick-access/${currentItem.id}`
      : '/api/admin/quick-access';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            order: Number(formData.order)
        }),
      });

      if (res.ok) {
        toast.success(`Item ${currentItem ? 'updated' : 'created'} successfully.`);
        fetchItems();
        setIsModalOpen(false);
      } else {
        const errorData = await res.json();
        toast.error(`Failed to ${currentItem ? 'update' : 'create'} item: ${errorData.error}`);
      }
    } catch (error) {
      toast.error(`An error occurred while saving the item.`);
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Quick Access Management</h1>
        <p>Manage the quick access items on your homepage</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button onClick={handleAddNewClick} className="admin-button flex items-center gap-2">
          <FaPlus size={14} /> Add New Item
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-1/12 text-center">#</th>
                <th className="w-2/12">Preview</th>
                <th className="w-3/12">Title</th>
                <th className="w-4/12">Link</th>
                <th className="w-1/12 text-center">Visible</th>
                <th className="w-1/12 actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="text-center font-medium text-gray-400">{index + 1}</td>
                  <td>
                    <div 
                      className="relative w-24 h-14 rounded-md overflow-hidden"
                      style={{ backgroundColor: item.color || '#1a202c' }}
                    >
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.title} 
                          fill 
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaImage className="text-gray-500" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{item.title}</td>
                  <td className="text-sm text-gray-400 truncate max-w-xs">{item.destinationUrl}</td>
                  <td className="text-center">
                     {item.visible ? (
                      <span className="admin-badge admin-badge-success flex items-center justify-center gap-1 w-fit mx-auto">
                        <FaCheck size={10} /> Yes
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-warning flex items-center justify-center gap-1 w-fit mx-auto">
                        <FaTimes size={10} /> No
                      </span>
                    )}
                  </td>
                  <td className="actions-column">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="admin-icon-button bg-blue-600 hover:bg-blue-700"
                        type="button"
                        aria-label={`Edit ${item.title}`}
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="admin-icon-button bg-red-600 hover:bg-red-700"
                        type="button"
                        aria-label={`Delete ${item.title}`}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal p-8">
            <h2 className="admin-modal-title">{currentItem ? 'Edit' : 'Add'} Quick Access Item</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} className="admin-input" required />
                </div>
                <div className="form-group">
                  <label htmlFor="destinationUrl">Destination URL</label>
                  <input type="text" id="destinationUrl" name="destinationUrl" value={formData.destinationUrl} onChange={handleInputChange} className="admin-input" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="order">Order</label>
                  <input type="number" id="order" name="order" value={formData.order} onChange={handlePriceChange} className="admin-input" />
                </div>
                 <div className="form-group">
                  <label htmlFor="color">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" id="color" name="color" value={formData.color} onChange={handleInputChange} className="w-10 h-10 p-1 rounded" />
                    <input type="text" value={formData.color} onChange={handleInputChange} name="color" className="admin-input" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Image</label>
                <ImageUploader 
                    onImageUploaded={handleImageUploaded} 
                    currentImage={formData.imageUrl}
                    uploadPath="/api/upload/quick"
                />
              </div>

              <div className="form-group">
                <FuturisticCheckbox 
                  id="visible" 
                  name="visible" 
                  label="Visible on Homepage" 
                  checked={formData.visible} 
                  onChange={handleInputChange}
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-button-secondary">Cancel</button>
                <button type="submit" className="admin-button">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
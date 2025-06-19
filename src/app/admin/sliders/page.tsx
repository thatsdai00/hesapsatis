'use client';

import * as React from 'react';

import {useState} from 'react';
import { trpc } from '@/lib/trpc-client';
import {FaEdit, FaTrash, FaPlus, FaCheck, FaTimes} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';
import FuturisticCheckbox from '@/components/ui/FuturisticCheckbox';

// Define the Slider type
interface Slider {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function SlidersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    active: true,
    order: 0,
  });

  const utils = trpc.useUtils();

  const { data: sliders, isLoading } = trpc.admin.getSliders.useQuery();

  // Fix image URLs if they're stored as relative paths
  useEffect(() => {
    if (sliders?.length) {
      sliders.forEach(slider => {
        if (slider.image && !slider.image.startsWith('http')) {
          // This is just for display purposes, doesn't change the database
          slider.image = `${window.location.origin}${slider.image}`;
        }
      });
    }
  }, [sliders]);

  const createSlider = trpc.admin.createSlider.useMutation({
    onSuccess: () => {
      utils.admin.getSliders.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Slider created successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateSlider = trpc.admin.updateSlider.useMutation({
    onSuccess: () => {
      utils.admin.getSliders.invalidate();
      setIsModalOpen(false);
      resetForm();
      toast.success('Slider updated successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteSlider = trpc.admin.deleteSlider.useMutation({
    onSuccess: () => {
      utils.admin.getSliders.invalidate();
      toast.success('Slider deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'order') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, image: imageUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image) {
      toast.error('Title and image are required');
      return;
    }

    if (currentSlider) {
      updateSlider.mutate({ id: currentSlider.id, ...formData });
    } else {
      createSlider.mutate(formData);
    }
  };

  const openEditModal = (slider: Slider) => {
    setCurrentSlider(slider);
    
    // Make sure we use the relative path stored in the database for the form
    const imageUrl = slider.image || '';
    
    setFormData({
      title: slider.title,
      subtitle: slider.subtitle || '',
      image: imageUrl,
      link: slider.link || '',
      active: slider.active,
      order: slider.order,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentSlider(null);
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      active: true,
      order: sliders?.length || 0,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this slider?')) {
      deleteSlider.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Homepage Sliders</h1>
        <p>Manage the sliding banners displayed on your homepage</p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={openCreateModal}
          className="admin-button flex items-center gap-2"
        >
          <FaPlus size={14} /> Add New Slider
        </button>
      </div>

      {/* Sliders List */}
      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Subtitle</th>
                <th>Link</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sliders?.map((slider: Slider) => (
                <tr key={slider.id}>
                  <td>
                    <div className="relative w-20 h-12 rounded-md overflow-hidden">
                      <Image 
                        src={slider.image} 
                        alt={slider.title} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td>{slider.title}</td>
                  <td>{slider.subtitle || '-'}</td>
                  <td>
                    {slider.link ? (
                      <a href={slider.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        {slider.link.substring(0, 30)}...
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{slider.order}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        slider.active ? 'admin-badge-success' : 'admin-badge-error'
                      }`}
                    >
                      {slider.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(slider)}
                        className="admin-icon-button"
                        aria-label="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(slider.id)}
                        className="admin-icon-button admin-icon-button-danger"
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sliders?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No sliders found. Create your first slider!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl admin-modal">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {currentSlider ? 'Edit Slider' : 'Create New Slider'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="admin-input w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subtitle" className="block text-sm font-medium mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slider Image *
                  </label>
                  <ImageUploader
                    type="sliders"
                    currentImage={formData.image}
                    onImageUploaded={handleImageUploaded}
                  />
                </div>
                <div>
                  <label htmlFor="link" className="block text-sm font-medium mb-2">
                    Link
                  </label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className="admin-input w-full"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="order" className="block text-sm font-medium mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      id="order"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      className="admin-input w-full"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center">
                    <FuturisticCheckbox
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleCheckboxChange}
                      label="Active"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button flex items-center gap-2"
                  disabled={createSlider.isPending || updateSlider.isPending}
                >
                  {createSlider.isPending || updateSlider.isPending ? (
                    'Processing...'
                  ) : (
                    <>
                      <FaCheck size={14} />
                  {currentSlider ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
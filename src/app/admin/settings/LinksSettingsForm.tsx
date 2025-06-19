"use client";

import * as React from 'react';
import {useState} from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {FaSave, FaPlus, FaTrash} from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';


// Define types for our links
type LinkItem = {
  id?: string;
  text: string;
  url: string;
  order?: number;
  isNew?: boolean;
  toDelete?: boolean;
};

interface LinkData {
  id: string;
  text: string;
  url: string;
  order: number;
}

export default function LinksSettingsForm() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // Fetch data
  const { data: settings, isLoading: isSettingsLoading } = trpc.admin.getSiteSettings.useQuery(undefined, {
    refetchOnWindowFocus: false });
  
  const { data: headerLinks, isLoading: isHeaderLinksLoading } = trpc.admin.getHeaderLinks.useQuery(undefined, {
    refetchOnWindowFocus: false });
  
  const { data: footerLinks, isLoading: isFooterLinksLoading } = trpc.admin.getFooterLinks.useQuery(undefined, {
    refetchOnWindowFocus: false });

  // State for institutional title
  const [institutionalTitle, setInstitutionalTitle] = useState("");
  
  // State for footer links
  const [footerLinkItems, setFooterLinkItems] = useState<LinkItem[]>([]);
  
  // State for header links
  const [headerLinkItems, setHeaderLinkItems] = useState<LinkItem[]>([]);

  // Mutations
  const { mutate: updateSettings, isPending: isUpdatingSettings } = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Institutional title updated successfully." });
      utils.admin.getSiteSettings.invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive" });
    } });

  const { mutate: updateHeaderLinks, isPending: isUpdatingHeaderLinks } = trpc.admin.updateHeaderLinks.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Header links updated successfully." });
      utils.admin.getHeaderLinks.invalidate();
      // Force reload to update the header
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update header links.",
        variant: "destructive" });
    } });

  const { mutate: updateFooterLinks, isPending: isUpdatingFooterLinks } = trpc.admin.updateFooterLinks.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Footer links updated successfully." });
      utils.admin.getFooterLinks.invalidate();
      // Force reload to update the footer
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update footer links.",
        variant: "destructive" });
    } });

  // Initialize state when data is loaded
  useEffect(() => {
    if (settings) {
      // Make sure we're using the actual value from the database, not just a default
      setInstitutionalTitle(settings.footerInstitutionalTitle || "Kurumsal");
    }
    
    if (footerLinks) {
      setFooterLinkItems(footerLinks.map((link: LinkData) => ({
        id: link.id,
        text: link.text,
        url: link.url
      })));
    }
    
    if (headerLinks) {
      setHeaderLinkItems(headerLinks.map((link: LinkData) => ({
        id: link.id,
        text: link.text,
        url: link.url
      })));
    }
  }, [settings, footerLinks, headerLinks]);

  // Add new link item
  const addFooterLink = () => {
    setFooterLinkItems([...footerLinkItems, { text: "", url: "", isNew: true }]);
  };

  const addHeaderLink = () => {
    setHeaderLinkItems([...headerLinkItems, { text: "", url: "", isNew: true }]);
  };

  // Update link item
  const updateFooterLink = (index: number, field: 'text' | 'url', value: string) => {
    const updatedLinks = [...footerLinkItems];
    updatedLinks[index][field] = value;
    setFooterLinkItems(updatedLinks);
  };

  const updateHeaderLink = (index: number, field: 'text' | 'url', value: string) => {
    const updatedLinks = [...headerLinkItems];
    updatedLinks[index][field] = value;
    setHeaderLinkItems(updatedLinks);
  };

  // Delete link item
  const deleteFooterLink = (index: number) => {
    const updatedLinks = [...footerLinkItems];
    if (updatedLinks[index].id) {
      updatedLinks[index].toDelete = true;
    } else {
      updatedLinks.splice(index, 1);
    }
    setFooterLinkItems(updatedLinks);
  };

  const deleteHeaderLink = (index: number) => {
    const updatedLinks = [...headerLinkItems];
    if (updatedLinks[index].id) {
      updatedLinks[index].toDelete = true;
    } else {
      updatedLinks.splice(index, 1);
    }
    setHeaderLinkItems(updatedLinks);
  };

  // Move link item
  const moveFooterLink = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === footerLinkItems.length - 1)) {
      return;
    }
    
    const updatedLinks = [...footerLinkItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedLinks[index], updatedLinks[newIndex]] = [updatedLinks[newIndex], updatedLinks[index]];
    setFooterLinkItems(updatedLinks);
  };

  const moveHeaderLink = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === headerLinkItems.length - 1)) {
      return;
    }
    
    const updatedLinks = [...headerLinkItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedLinks[index], updatedLinks[newIndex]] = [updatedLinks[newIndex], updatedLinks[index]];
    setHeaderLinkItems(updatedLinks);
  };

  // Save changes
  const saveInstitutionalTitle = () => {
    updateSettings({
      footerInstitutionalTitle: institutionalTitle
    });
  };

  const saveFooterLinks = () => {
    const links = footerLinkItems
      .filter(link => !link.toDelete)
      .map((link, index) => ({
        id: link.id,
        text: link.text,
        url: link.url,
        order: index,
        isNew: link.isNew
      }));
    
    const deletedIds = footerLinkItems
      .filter(link => link.toDelete && link.id)
      .map(link => link.id as string);
    
    updateFooterLinks({ links, deletedIds });
  };

  const saveHeaderLinks = () => {
    const links = headerLinkItems
      .filter(link => !link.toDelete)
      .map((link, index) => ({
        id: link.id,
        text: link.text,
        url: link.url,
        order: index,
        isNew: link.isNew
      }));
    
    const deletedIds = headerLinkItems
      .filter(link => link.toDelete && link.id)
      .map(link => link.id as string);
    
    updateHeaderLinks({ links, deletedIds });
  };

  if (isSettingsLoading || isHeaderLinksLoading || isFooterLinksLoading) {
    return <div className="flex justify-center items-center py-10">
      <div className="animate-pulse text-center">
        <div className="h-6 w-32 bg-gray-700 rounded mb-2 mx-auto"></div>
        <div className="h-4 w-48 bg-gray-700 rounded mx-auto"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Footer Institutional Links Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Yönlendirmeler</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institutionalTitle" className="text-white">Section Title</Label>
            <div className="flex space-x-2">
              <Input 
                id="institutionalTitle" 
                value={institutionalTitle}
                onChange={(e) => setInstitutionalTitle(e.target.value)}
                className="admin-input flex-grow"
              />
              <Button 
                onClick={saveInstitutionalTitle}
                disabled={isUpdatingSettings}
                className="admin-button"
              >
                <FaSave size={16} className="mr-2" />
                Save
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-white">Links</Label>
            
            {footerLinkItems.filter(link => !link.toDelete).map((link, index) => (
              <div key={link.id || `new-${index}`} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input 
                    placeholder="Link Text"
                    value={link.text}
                    onChange={(e) => updateFooterLink(index, 'text', e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="col-span-5">
                  <Input 
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="col-span-2 flex space-x-1">
                  <Button 
                    onClick={() => moveFooterLink(index, 'up')}
                    disabled={index === 0}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8"
                  >
                    <FaArrowUp size={12} />
                  </Button>
                  <Button 
                    onClick={() => moveFooterLink(index, 'down')}
                    disabled={index === footerLinkItems.filter(l => !l.toDelete).length - 1}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8"
                  >
                    <FaArrowDown size={12} />
                  </Button>
                  <Button 
                    onClick={() => deleteFooterLink(index)}
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <FaTrash size={12} />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <Button 
                onClick={addFooterLink}
                variant="outline"
                className="flex items-center"
              >
                <FaPlus size={12} className="mr-2" />
                Add Link
              </Button>
              <Button 
                onClick={saveFooterLinks}
                disabled={isUpdatingFooterLinks}
                className="admin-button"
              >
                <FaSave size={16} className="mr-2" />
                Save Links
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header Navigation Links Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Header Navigation Links</h2>
        
        <div className="space-y-4">
          {headerLinkItems.filter(link => !link.toDelete).map((link, index) => (
            <div key={link.id || `new-${index}`} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <Input 
                  placeholder="Link Text"
                  value={link.text}
                  onChange={(e) => updateHeaderLink(index, 'text', e.target.value)}
                  className="admin-input"
                />
              </div>
              <div className="col-span-5">
                <Input 
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateHeaderLink(index, 'url', e.target.value)}
                  className="admin-input"
                />
              </div>
              <div className="col-span-2 flex space-x-1">
                <Button 
                  onClick={() => moveHeaderLink(index, 'up')}
                  disabled={index === 0}
                  size="sm"
                  variant="outline"
                  className="w-8 h-8"
                >
                  <FaArrowUp size={12} />
                </Button>
                <Button 
                  onClick={() => moveHeaderLink(index, 'down')}
                  disabled={index === headerLinkItems.filter(l => !l.toDelete).length - 1}
                  size="sm"
                  variant="outline"
                  className="w-8 h-8"
                >
                  <FaArrowDown size={12} />
                </Button>
                <Button 
                  onClick={() => deleteHeaderLink(index)}
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white"
                >
                  <FaTrash size={12} />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button 
              onClick={addHeaderLink}
              variant="outline"
              className="flex items-center"
            >
              <FaPlus size={12} className="mr-2" />
              Add Link
            </Button>
            <Button 
              onClick={saveHeaderLinks}
              disabled={isUpdatingHeaderLinks}
              className="admin-button"
            >
              <FaSave size={16} className="mr-2" />
              Save Links
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
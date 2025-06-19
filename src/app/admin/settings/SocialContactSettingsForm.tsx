"use client";

import * as React from 'react';
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {useState} from "react";
import { FaSave, FaFacebook, FaTwitter, FaInstagram, FaDiscord, FaYoutube, FaEnvelope, FaPhone, FaWhatsapp, FaMapMarkerAlt } from "react-icons/fa";

export default function SocialContactSettingsForm() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // Social media state
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  
  const [socialFacebookVisible, setSocialFacebookVisible] = useState(false);
  const [socialTwitterVisible, setSocialTwitterVisible] = useState(false);
  const [socialInstagramVisible, setSocialInstagramVisible] = useState(false);
  const [socialDiscordVisible, setSocialDiscordVisible] = useState(false);
  const [socialYoutubeVisible, setSocialYoutubeVisible] = useState(false);
  
  // Contact information state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactAddress, setContactAddress] = useState("");

  const { data: settings, isLoading } = trpc.admin.getSiteSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { mutate: updateSettings, isPending: isUpdating } = trpc.admin.updateSiteSettings.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Settings updated successfully." });
      utils.admin.getSiteSettings.invalidate();
      // Force reload to update the header and footer
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings) {
      // Update social media state
      setSocialFacebook(settings.socialFacebook || "");
      setSocialTwitter(settings.socialTwitter || "");
      setSocialInstagram(settings.socialInstagram || "");
      setSocialDiscord(settings.socialDiscord || "");
      setSocialYoutube(settings.socialYoutube || "");
      
      setSocialFacebookVisible(settings.socialFacebookVisible || false);
      setSocialTwitterVisible(settings.socialTwitterVisible || false);
      setSocialInstagramVisible(settings.socialInstagramVisible || false);
      setSocialDiscordVisible(settings.socialDiscordVisible || false);
      setSocialYoutubeVisible(settings.socialYoutubeVisible || false);
      
      // Update contact information state
      setContactEmail(settings.contactEmail || "");
      setContactPhone(settings.contactPhone || "");
      setContactWhatsapp(settings.contactWhatsapp || "");
      setContactAddress(settings.contactAddress || "");
    }
  }, [settings]);

  const saveSocialMediaSettings = () => {
    updateSettings({
      socialFacebook,
      socialTwitter,
      socialInstagram,
      socialDiscord,
      socialYoutube,
      socialFacebookVisible,
      socialTwitterVisible,
      socialInstagramVisible,
      socialDiscordVisible,
      socialYoutubeVisible
    });
  };

  const saveContactSettings = () => {
    updateSettings({
      contactEmail,
      contactPhone,
      contactWhatsapp,
      contactAddress
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10">
      <div className="animate-pulse text-center">
        <div className="h-6 w-32 bg-gray-700 rounded mb-2 mx-auto"></div>
        <div className="h-4 w-48 bg-gray-700 rounded mx-auto"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Social Media Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Sosyal Medya İkonları</h2>
        <p className="text-gray-400">Site footer kısmında görüntülenecek sosyal medya ikonlarını yönetin.</p>
        
        <div className="space-y-4">
          {/* Facebook */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600">
                <FaFacebook className="text-white" size={18} />
              </div>
            </div>
            <div className="col-span-8 md:col-span-9">
              <Input 
                placeholder="Facebook URL" 
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={socialFacebookVisible}
                    onChange={() => setSocialFacebookVisible(!socialFacebookVisible)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${socialFacebookVisible ? "bg-purple-600" : "bg-gray-600"}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${socialFacebookVisible ? "transform translate-x-4" : ""}`}></div>
                </div>
                <div className="ml-3 text-gray-300 text-sm">
                  {socialFacebookVisible ? "Aktif" : "Kapalı"}
                </div>
              </label>
            </div>
          </div>
          
          {/* Twitter */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-sky-500">
                <FaTwitter className="text-white" size={18} />
              </div>
            </div>
            <div className="col-span-8 md:col-span-9">
              <Input 
                placeholder="Twitter URL" 
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={socialTwitterVisible}
                    onChange={() => setSocialTwitterVisible(!socialTwitterVisible)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${socialTwitterVisible ? "bg-purple-600" : "bg-gray-600"}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${socialTwitterVisible ? "transform translate-x-4" : ""}`}></div>
                </div>
                <div className="ml-3 text-gray-300 text-sm">
                  {socialTwitterVisible ? "Aktif" : "Kapalı"}
                </div>
              </label>
            </div>
          </div>
          
          {/* Instagram */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-600">
                <FaInstagram className="text-white" size={18} />
              </div>
            </div>
            <div className="col-span-8 md:col-span-9">
              <Input 
                placeholder="Instagram URL" 
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={socialInstagramVisible}
                    onChange={() => setSocialInstagramVisible(!socialInstagramVisible)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${socialInstagramVisible ? "bg-purple-600" : "bg-gray-600"}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${socialInstagramVisible ? "transform translate-x-4" : ""}`}></div>
                </div>
                <div className="ml-3 text-gray-300 text-sm">
                  {socialInstagramVisible ? "Aktif" : "Kapalı"}
                </div>
              </label>
            </div>
          </div>
          
          {/* Discord */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600">
                <FaDiscord className="text-white" size={18} />
              </div>
            </div>
            <div className="col-span-8 md:col-span-9">
              <Input 
                placeholder="Discord URL" 
                value={socialDiscord}
                onChange={(e) => setSocialDiscord(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={socialDiscordVisible}
                    onChange={() => setSocialDiscordVisible(!socialDiscordVisible)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${socialDiscordVisible ? "bg-purple-600" : "bg-gray-600"}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${socialDiscordVisible ? "transform translate-x-4" : ""}`}></div>
                </div>
                <div className="ml-3 text-gray-300 text-sm">
                  {socialDiscordVisible ? "Aktif" : "Kapalı"}
                </div>
              </label>
            </div>
          </div>
          
          {/* YouTube */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-600">
                <FaYoutube className="text-white" size={18} />
              </div>
            </div>
            <div className="col-span-8 md:col-span-9">
              <Input 
                placeholder="YouTube URL" 
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="col-span-3 md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={socialYoutubeVisible}
                    onChange={() => setSocialYoutubeVisible(!socialYoutubeVisible)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${socialYoutubeVisible ? "bg-purple-600" : "bg-gray-600"}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${socialYoutubeVisible ? "transform translate-x-4" : ""}`}></div>
                </div>
                <div className="ml-3 text-gray-300 text-sm">
                  {socialYoutubeVisible ? "Aktif" : "Kapalı"}
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={saveSocialMediaSettings}
              disabled={isUpdating}
              className="admin-button flex items-center gap-2"
            >
              <FaSave size={16} />
              {isUpdating ? "Kaydediliyor..." : "Sosyal Medya Ayarlarını Kaydet"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contact Information Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">İletişim Bilgileri</h2>
        <p className="text-gray-400">Site footer kısmında görüntülenecek iletişim bilgilerini yönetin.</p>
        
        <div className="space-y-4">
          {/* Email */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-600">
                <FaEnvelope className="text-white" size={16} />
              </div>
            </div>
            <div className="col-span-11">
              <Label htmlFor="contactEmail" className="text-white mb-2 block">E-posta Adresi</Label>
              <Input 
                id="contactEmail"
                placeholder="örn: destek@thatsdai.com" 
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
          
          {/* Phone */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-600">
                <FaPhone className="text-white" size={16} />
              </div>
            </div>
            <div className="col-span-11">
              <Label htmlFor="contactPhone" className="text-white mb-2 block">Telefon Numarası</Label>
              <Input 
                id="contactPhone"
                placeholder="örn: +90 (XXX) XXX XX XX" 
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
          
          {/* WhatsApp */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600">
                <FaWhatsapp className="text-white" size={16} />
              </div>
            </div>
            <div className="col-span-11">
              <Label htmlFor="contactWhatsapp" className="text-white mb-2 block">WhatsApp Numarası veya Bağlantısı</Label>
              <Input 
                id="contactWhatsapp"
                placeholder="örn: https://wa.me/905xxxxxxxxx" 
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
          
          {/* Address */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-600">
                <FaMapMarkerAlt className="text-white" size={16} />
              </div>
            </div>
            <div className="col-span-11">
              <Label htmlFor="contactAddress" className="text-white mb-2 block">Adres</Label>
              <Input 
                id="contactAddress"
                placeholder="örn: İstanbul, Türkiye" 
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={saveContactSettings}
              disabled={isUpdating}
              className="admin-button flex items-center gap-2"
            >
              <FaSave size={16} />
              {isUpdating ? "Kaydediliyor..." : "İletişim Bilgilerini Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
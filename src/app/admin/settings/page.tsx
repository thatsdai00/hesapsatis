'use client';

import * as React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettings from "./GeneralSettingsForm";
import LinksSettings from "./LinksSettingsForm";
import SocialContactSettings from "./SocialContactSettingsForm";
import { FaLink, FaShareAlt, FaCog } from 'react-icons/fa';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="admin-header">
        <h1>Site Settings</h1>
        <p>Configure your site&apos;s appearance, branding, and content</p>
      </div>
      
      <div className="admin-card mb-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="px-4 py-2">
              <FaCog className="mr-2" /> General Settings
            </TabsTrigger>
            <TabsTrigger value="links" className="px-4 py-2">
              <FaLink className="mr-2" /> Links
            </TabsTrigger>
            <TabsTrigger value="social" className="px-4 py-2">
              <FaShareAlt className="mr-2" /> Sosyal & İletişim
            </TabsTrigger>
            {/* Add more tabs here in the future */}
          </TabsList>
          <TabsContent value="general" className="pt-4">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="links" className="pt-4">
            <LinksSettings />
          </TabsContent>
          <TabsContent value="social" className="pt-4">
            <SocialContactSettings />
          </TabsContent>
          {/* Add more tab content here */}
        </Tabs>
      </div>
    </div>
  );
} 
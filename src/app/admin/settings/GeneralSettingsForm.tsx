"use client";

import * as React from 'react';
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {useState} from "react";
import { Textarea } from "@/components/ui/textarea";
import { FaSave } from "react-icons/fa";

const settingsSchema = z.object({
  logoWhiteText: z.string().min(1, "Logo white text is required"),
  logoAccentText: z.string().min(1, "Logo accent text is required"),
  logoWhiteColor: z.string().min(1, "Logo white color is required"),
  logoAccentColor: z.string().min(1, "Logo accent color is required"),
  siteName: z.string().min(1, "Site name is required"),
  footerDescription: z.string().min(1, "Footer description is required"),
  footerBottomText: z.string().min(1, "Footer bottom text is required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function GeneralSettingsForm() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // State to track color values for synchronization
  const [logoWhiteColor, setLogoWhiteColor] = useState("#FFFFFF");
  const [logoAccentColor, setLogoAccentColor] = useState("#7e22ce");

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (settings) {
      // Cast the settings object to match our form values type
      const formValues: SettingsFormValues = {
        logoWhiteText: settings.logoWhiteText,
        logoAccentText: settings.logoAccentText,
        logoWhiteColor: settings.logoWhiteColor,
        logoAccentColor: settings.logoAccentColor,
        siteName: settings.siteName,
        footerDescription: settings.footerDescription,
        footerBottomText: settings.footerBottomText,
      };
      reset(formValues);
      
      // Update local state for color pickers
      setLogoWhiteColor(settings.logoWhiteColor);
      setLogoAccentColor(settings.logoAccentColor);
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
  };
  
  // Handle color changes from both text input and color picker
  const handleWhiteColorChange = (value: string) => {
    setLogoWhiteColor(value);
    setValue("logoWhiteColor", value);
  };
  
  const handleAccentColorChange = (value: string) => {
    setLogoAccentColor(value);
    setValue("logoAccentColor", value);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="logoWhiteText" className="text-white">Logo White Text</Label>
          <Input 
            id="logoWhiteText" 
            {...register("logoWhiteText")} 
            className="admin-input"
          />
          {errors.logoWhiteText && <p className="text-sm text-red-500">{errors.logoWhiteText.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoAccentText" className="text-white">Logo Accent Text</Label>
          <Input 
            id="logoAccentText" 
            {...register("logoAccentText")} 
            className="admin-input"
          />
          {errors.logoAccentText && <p className="text-sm text-red-500">{errors.logoAccentText.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="logoWhiteColor" className="text-white">Logo White Text Color</Label>
          <div className="flex">
            <Input 
              id="logoWhiteColor"
              value={logoWhiteColor}
              onChange={(e) => handleWhiteColorChange(e.target.value)}
              className="admin-input rounded-r-none"
            />
            <Input 
              type="color" 
              value={logoWhiteColor}
              onChange={(e) => handleWhiteColorChange(e.target.value)}
              className="w-12 p-1 rounded-l-none border border-gray-700"
            />
          </div>
          {/* Hidden input to register with react-hook-form */}
          <input type="hidden" {...register("logoWhiteColor")} value={logoWhiteColor} />
          {errors.logoWhiteColor && <p className="text-sm text-red-500">{errors.logoWhiteColor.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoAccentColor" className="text-white">Logo Accent Text Color</Label>
          <div className="flex">
            <Input 
              id="logoAccentColor"
              value={logoAccentColor}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="admin-input rounded-r-none"
            />
            <Input 
              type="color"
              value={logoAccentColor}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="w-12 p-1 rounded-l-none border border-gray-700"
            />
          </div>
          {/* Hidden input to register with react-hook-form */}
          <input type="hidden" {...register("logoAccentColor")} value={logoAccentColor} />
          {errors.logoAccentColor && <p className="text-sm text-red-500">{errors.logoAccentColor.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="siteName" className="text-white">Site Name</Label>
        <Input 
          id="siteName" 
          {...register("siteName")} 
          className="admin-input"
        />
        {errors.siteName && <p className="text-sm text-red-500">{errors.siteName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="footerDescription" className="text-white">Footer Description</Label>
        <Textarea 
          id="footerDescription" 
          {...register("footerDescription")} 
          className="admin-input min-h-[100px]"
        />
        {errors.footerDescription && <p className="text-sm text-red-500">{errors.footerDescription.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="footerBottomText" className="text-white">Footer Bottom Text</Label>
        <Textarea 
          id="footerBottomText" 
          {...register("footerBottomText")} 
          className="admin-input min-h-[100px]"
        />
        {errors.footerBottomText && <p className="text-sm text-red-500">{errors.footerBottomText.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isUpdating}
          className="admin-button flex items-center gap-2"
        >
          <FaSave size={16} />
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
} 
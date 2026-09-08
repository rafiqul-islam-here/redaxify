"use client";
import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  videoCostPercent: number;
  constantDescription: string;
}

const Page = () => {
  const [settings, setSettings] = useState<Settings>({
    videoCostPercent: 10,
    constantDescription: "This is a description for the video cost.",
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Settings>({ ...settings });

  const handleEditClick = (): void => {
    setFormData({ ...settings });
    setIsEditing(true);
  };

  const handleCancel = (): void => {
    setIsEditing(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "videoCostPercent" ? Number(value) : value,
    });
  };

  const handleSave = (): void => {
    setSettings(formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Bill Settings
      </h1>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Video Cost Percent</p>
            <p className="text-lg font-medium">{settings.videoCostPercent}%</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Constant Description</p>
            <p className="text-lg font-medium">
              {settings.constantDescription}
            </p>
          </div>

          <Button
            onClick={handleEditClick}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            Edit Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Video Cost Percent
            </label>
            <Input
              type="number"
              name="videoCostPercent"
              value={formData.videoCostPercent}
              onChange={handleInputChange}
              className="border-gray-300 focus:ring-gray-800 focus:border-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Constant Description
            </label>
            <Input
              type="text"
              name="constantDescription"
              value={formData.constantDescription}
              onChange={handleInputChange}
              className="border-gray-300 focus:ring-gray-800 focus:border-gray-800"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-black hover:bg-gray-800 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;

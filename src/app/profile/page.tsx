"use client";
import React, { useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import "@aws-amplify/ui-react/styles.css";
import { list } from "aws-amplify/storage";
import { client } from "@/src/utils/amplifyClient";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";

const Profile = () => {
  const [icons, setIcons] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();

  const getAllIcons = async () => {
    const s3Icons: string[] = [];

    const result = await list({
      path: ({ identityId }) => `icons/${identityId}/`,
      options: {
        listAll: true,
      },
    });

    if (result) {
      result.items.forEach((icon) => {
        s3Icons.push(icon.path);
      });

      setIcons(s3Icons);
    }
  };

  const updateUserIcon = async () => {
    try {
      const { data, errors: errorUpdateUserIcon } =
        await client.models.User.update({
          id: user?.id,
          icon: selectedIcon,
        });

      if (errorUpdateUserIcon) {
        console.error(errorUpdateUserIcon);
      }
      if (data) {
        console.log("Successfully updated profile icon for " + user?.username);
      }
    } catch (error) {
      console.error("Unknown Error: " + error);
    }
  };

  return (
    <div className="my-5 mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-center">Profile</h1>

      <section className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-xl text-center font-semibold text-gray-800 mb-4">
          Upload a New Profile Icon
        </h2>
        <FileUploader
          acceptedFileTypes={[".jpeg", ".jpg", ".png"]}
          path={({ identityId }) => `icons/${identityId}/`}
          autoUpload={false}
          maxFileCount={1}
          isResumable
        />
      </section>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <button onClick={getAllIcons} className="btn btn-sm btn-info">
          Load All Icons
        </button>
        <select
          defaultValue="Pick an icon"
          className="select select-secondary w-full sm:w-64"
          onChange={(e) => setSelectedIcon(e.target.value)}
          disabled={icons.length === 0}
        >
          <option disabled value="Pick an icon">
            Pick an icon
          </option>
          {icons.map((icon, index) => {
            const iconName = icon.split("/").pop();
            return (
              <option key={index} value={icon}>
                {iconName}
              </option>
            );
          })}
        </select>
      </div>
      {selectedIcon && (
        <button className="btn btn-md btn-primary" onClick={updateUserIcon}>
          Update Profile Image
        </button>
      )}
    </div>
  );
};

export default Profile;

"use client";
import React, { useEffect, useRef, useState } from "react";
import { FileUploader } from "@aws-amplify/ui-react-storage";
import "@aws-amplify/ui-react/styles.css";
import { list } from "aws-amplify/storage";
import { client } from "@/src/utils/amplifyClient";
import { useAmplifyAuthenticatedUser } from "@/src/hooks/useAmplifyAuthenticatedUser";
import gsap from "gsap";

const Profile = () => {
  const { dbUser: user } = useAmplifyAuthenticatedUser();
  const [icons, setIcons] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [displayMessage, setDisplayMessage] = useState<boolean>(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Animate message in
  useEffect(() => {
    if (displayMessage && messageRef.current && backdropRef.current) {
      gsap.fromTo(
        messageRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3 }
      );
    }
  }, [displayMessage]);

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
      setLoading(true);
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
        setTimeout(() => {
          setLoading(false);
          setDisplayMessage(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Unknown Error: " + error);
      setLoading(false);
      setDisplayMessage(false);
    }
  };

  return (
    <div className="my-5 mx-auto flex flex-col">
      <h1 className="text-3xl font-extrabold mb-6 text-center">Profile</h1>

      <section className="bg-white shadow-lg rounded-lg p-6 mb-6">
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

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <button onClick={getAllIcons} className="btn btn-sm btn-accent">
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
        <button
          className="btn btn-md btn-primary"
          onClick={updateUserIcon}
          disabled={loading}
        >
          {!loading ? (
            "Update Profile Image"
          ) : (
            <span className="loading loading-spinner loading-xs"></span>
          )}
        </button>
      )}
      {displayMessage && (
        <>
          <div ref={backdropRef} className="fixed inset-0 bg-black z-40"></div>
          <div
            ref={messageRef}
            id="messageUpdateIconSuccessful"
            role="alert"
            className="fixed z-50 alert alert-success top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <span>Icon updated successfully! Please refresh to view.</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;

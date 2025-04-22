import { downloadData } from "aws-amplify/storage";

export const getUserIcon = async (iconPath?: string) => {
  if (!iconPath) {
    return null;
  }

  try {
    const { body } = await downloadData({ path: iconPath }).result;
    return URL.createObjectURL(await body.blob());
  } catch (error) {
    console.error("Couldn't download icon. Path:", iconPath, "Error:", error);
    return null;
  }
};
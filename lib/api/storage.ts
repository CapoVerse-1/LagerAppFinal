import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * @param bucket The storage bucket name
 * @param file The file to upload
 * @param path Optional path within the bucket
 * @returns Promise with the file path
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<string> {
  try {
    // Generate a unique filename to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(error.message);
    }

    return filePath;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

/**
 * Get a public URL for a file in Supabase Storage
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @returns The public URL for the file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a brand logo to Supabase Storage
 * @param file The logo file to upload
 * @returns Promise with the public URL of the uploaded logo
 */
export async function uploadBrandLogo(file: File): Promise<string> {
  const filePath = await uploadFile('brand-logos', file);
  return getPublicUrl('brand-logos', filePath);
}

/**
 * Upload an item image to Supabase Storage
 * @param file The image file to upload
 * @returns Promise with the public URL of the uploaded image
 */
export async function uploadItemImage(file: File): Promise<string> {
  const filePath = await uploadFile('item-images', file);
  return getPublicUrl('item-images', filePath);
}

/**
 * Update an existing file in Supabase Storage
 * @param bucket The storage bucket name
 * @param file The new file to upload
 * @param oldPath The path of the file to replace
 * @returns Promise with the file path
 */
export async function updateFile(
  bucket: string,
  file: File,
  oldPath: string
): Promise<string> {
  try {
    // Delete the old file if it exists
    if (oldPath) {
      await supabase.storage.from(bucket).remove([oldPath]);
    }

    // Upload the new file
    return await uploadFile(bucket, file);
  } catch (error) {
    console.error('Error in updateFile:', error);
    throw error;
  }
}

/**
 * Update a brand logo in Supabase Storage
 * @param file The new logo file
 * @param oldUrl The URL of the current logo
 * @returns Promise with the public URL of the updated logo
 */
export async function updateBrandLogo(file: File, oldUrl?: string): Promise<string> {
  // Extract the path from the old URL if it exists
  let oldPath = '';
  if (oldUrl) {
    try {
      const url = new URL(oldUrl);
      const pathParts = url.pathname.split('/');
      // The last two parts should be the bucket name and the file path
      if (pathParts.length >= 2) {
        oldPath = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      console.warn('Could not parse old URL:', e);
    }
  }

  // Update the file
  const filePath = await updateFile('brand-logos', file, oldPath);
  return getPublicUrl('brand-logos', filePath);
}

/**
 * Update an item image in Supabase Storage
 * @param file The new image file
 * @param oldUrl The URL of the current image
 * @returns Promise with the public URL of the updated image
 */
export async function updateItemImage(file: File, oldUrl?: string): Promise<string> {
  // Extract the path from the old URL if it exists
  let oldPath = '';
  if (oldUrl) {
    try {
      const url = new URL(oldUrl);
      const pathParts = url.pathname.split('/');
      // The last two parts should be the bucket name and the file path
      if (pathParts.length >= 2) {
        oldPath = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      console.warn('Could not parse old URL:', e);
    }
  }

  // Update the file
  const filePath = await updateFile('item-images', file, oldPath);
  return getPublicUrl('item-images', filePath);
}

/**
 * Delete a file from Supabase Storage
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Error deleting file:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw error;
  }
}

/**
 * Delete a brand logo from Supabase Storage
 * @param url The public URL of the logo
 */
export async function deleteBrandLogo(url: string): Promise<void> {
  if (!url) return;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part should be the file path
    if (pathParts.length >= 1) {
      const filePath = pathParts[pathParts.length - 1];
      await deleteFile('brand-logos', filePath);
    }
  } catch (e) {
    console.warn('Could not parse URL for deletion:', e);
  }
}

/**
 * Delete an item image from Supabase Storage
 * @param url The public URL of the image
 */
export async function deleteItemImage(url: string): Promise<void> {
  if (!url) return;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part should be the file path
    if (pathParts.length >= 1) {
      const filePath = pathParts[pathParts.length - 1];
      await deleteFile('item-images', filePath);
    }
  } catch (e) {
    console.warn('Could not parse URL for deletion:', e);
  }
}

/**
 * Upload a promoter photo to Supabase Storage
 * @param file The photo file to upload
 * @returns Promise with the public URL of the uploaded photo
 */
export async function uploadPromoterPhoto(file: File): Promise<string> {
  const filePath = await uploadFile('promoter-photos', file);
  return getPublicUrl('promoter-photos', filePath);
}

/**
 * Update a promoter photo in Supabase Storage
 * @param file The new photo file
 * @param oldUrl The URL of the current photo
 * @returns Promise with the public URL of the updated photo
 */
export async function updatePromoterPhoto(file: File, oldUrl?: string): Promise<string> {
  // Extract the path from the old URL if it exists
  let oldPath = '';
  if (oldUrl) {
    try {
      const url = new URL(oldUrl);
      const pathParts = url.pathname.split('/');
      // The last two parts should be the bucket name and the file path
      if (pathParts.length >= 2) {
        oldPath = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      console.warn('Could not parse old URL:', e);
    }
  }

  // Update the file
  const filePath = await updateFile('promoter-photos', file, oldPath);
  return getPublicUrl('promoter-photos', filePath);
}

/**
 * Delete a promoter photo from Supabase Storage
 * @param url The public URL of the photo
 */
export async function deletePromoterPhoto(url: string): Promise<void> {
  if (!url) return;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part should be the file path
    if (pathParts.length >= 1) {
      const filePath = pathParts[pathParts.length - 1];
      await deleteFile('promoter-photos', filePath);
    }
  } catch (e) {
    console.warn('Could not parse URL for deletion:', e);
  }
}
import { basename, dirname, join, sep } from 'path';

export interface Post {
  info: PostInfo,
  photos: Photo[]
}

export interface PostInfo {
  title: string,
  date: Date,
  tags?: string[],
  cover?: string,
  post: string
}

export interface Photo {
  id: string,
  path: string,
  caption: string
}

export interface PostPreview {
  path: string,
  title: string,
  tags?: string[],
  date: Date,
  cover?: string,
  shortDescription: string
}

export interface PostPreviewDirectory {
  posts: PostPreview[]
}

export const getPostName = (postObject: Post) => {
  const symbolFreeTitle = postObject.info.title.replace(/[^\w\s]/gi, "");
  const allLowercase = symbolFreeTitle.toLowerCase();
  const hypenated = allLowercase.replace(/\s+/g, "-");
  return hypenated;
}

export const getPhotoDest = (destDir: string, photoPath: string) => {
  const fullPath = photoPath.split(sep);
  const photosIndex = fullPath.indexOf("photos");
  const pathSubSection = join(...fullPath.slice(photosIndex));
  const joinedPath = join(destDir, pathSubSection);
  const newFileName = basename(joinedPath, ".jpg") + ".webp";
  return join(dirname(joinedPath), newFileName);
}

export const getPhotoDestDir = (destDir: string, photoPath: string) => {
  const fullPath = photoPath.split(sep);
  const photosIndex = fullPath.indexOf("photos");
  const pathSubSection = join(
    ...fullPath.slice(photosIndex, fullPath.length - 1)
  );
  return join(destDir, pathSubSection);
}

export const getPhotoPath = (photoId: string | undefined, photos: Photo[]): string | undefined => {
  const photo = photos.find((photo) => photo.id === photoId);
  if (photo) {
    return photo.path
  }

  return undefined;
}

export const previewFromPost = (post: Post): PostPreview => ({
  path: getPostName(post),
  title: post.info.title,
  tags: post.info.tags,
  date: post.info.date,
  cover: getPhotoPath(post.info.cover, post.photos),
  shortDescription: post.info.post.split(" ").slice(0, 20).join(" ")
})

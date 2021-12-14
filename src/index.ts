import fg from 'fast-glob';
import { parse } from 'toml';
import { Compilation, Compiler } from 'webpack';
import sharp from 'sharp';

import { existsSync } from 'fs';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { basename, dirname, join, sep } from 'path';
import { getPhotoDest, getPhotoDestDir, getPostName, Post, PostPreview, PostPreviewDirectory, previewFromPost } from './lib';

class JunePlugin {
  fileGlob: string;
  photoGlob: string;
  destDir: string;
  destPhotosPath: string;

  constructor(fileGlob: string, photoGlob: string, destDir: string) {
    this.fileGlob = fileGlob;
    this.photoGlob = photoGlob;
    this.destDir = destDir;
    
    this.destPhotosPath = join(this.destDir, "photos")
  }

  async parseToml(filePath: string): Promise<Post> {
    const file = await readFile(filePath, "utf-8");
    return parse(file);
  }

  async writePostFile(post: Post): Promise<PostPreview> {
    const fileName = getPostName(post);
    const writePath = join(this.destDir, fileName + ".json");
    await writeFile(writePath, JSON.stringify(post));
    return previewFromPost(post);
  }

  apply (compiler: Compiler) {
    compiler.hooks.run.tapPromise("Post Prep", async (compilation: Compiler) => {
      console.log("Compiling Posts...");

      if (existsSync(this.destDir)) {
        await rm(this.destDir, { recursive: true, force: true });
      }

      await mkdir(this.destDir);

      // Convert TOML Posts to Post Objects
      const files = await fg(this.fileGlob);
      const filesToConvert = files.map((file) => this.parseToml(file));
      const posts = await Promise.all(filesToConvert);

      // Write Posts, get Previews
      const writeFiles = posts.map((post) => this.writePostFile(post));
      const postPreviews = await Promise.all(writeFiles);
      const previewDirectory: PostPreviewDirectory = {
        posts: postPreviews
      };

      // Write Preview File
      await writeFile(join(this.destDir, "posts.json"), JSON.stringify(previewDirectory));

      // Process Photos
      const photos = await fg(this.photoGlob);

      // Create photo subdirectories
      const preparePostPhotoDirs = photos.map((photo) => mkdir(getPhotoDestDir(this.destDir, photo), { recursive: true }));
      await Promise.all(preparePostPhotoDirs);
      
      console.log("Optimizing Photos...");
      const mainPhotos = photos.map((photo) => sharp(photo).resize(900).webp().toFile(getPhotoDest(this.destDir, photo)));
      const smallPhotos = photos.map((photo) => sharp(photo).resize(240).webp().toFile(getPhotoDest(this.destDir, photo.replace(".jpg", ".small.jpg"))));
      await Promise.all([...mainPhotos, ...smallPhotos]); 
    });
  }
}

export = JunePlugin;

"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageModal } from "@/components/ui";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./ProjectCoverImage.module.scss";

interface ProjectCoverImageProps {
  src: string;
  alt: string;
  title: string;
}

export function ProjectCoverImage({ src, alt, title }: ProjectCoverImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Prefix src with base path if it's a regular path (not a data URI or external URL)
  const imageSrc = src.startsWith("data:") || src.startsWith("http") 
    ? src 
    : withBasePath(src);

  return (
    <>
      <div className={styles.coverImage} onClick={handleImageClick}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority
          className={styles.image}
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div className={styles.overlay}>
          <div className={styles.icon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          imageSrc={imageSrc}
          imageAlt={alt}
        />
      )}
    </>
  );
}

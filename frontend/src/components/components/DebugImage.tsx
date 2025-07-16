import React from 'react';
import NextImage from 'next/image'; // Renamed to avoid conflict

const DebugImage = (props: any) => {
  console.log("Rendering image with props:", props);

  // Check if the src is a placehold.co URL
  const isPlaceholder = typeof props.src === 'string' && props.src.includes('placehold.co');

  if (isPlaceholder) {
    // If it's a placeholder, render a native <img> tag
    // This bypasses Next.js Image Optimization for placeholders
    return (
      <img
        src={props.src}
        alt={props.alt || 'Placeholder Image'}
        style={{
          objectFit: props.style?.objectFit || 'cover',
          width: '100%',
          height: '100%',
          borderRadius: props.className?.includes('rounded-lg') ? '0.5rem' : '0', // Apply border-radius if class exists
        }}
        onError={props.onError} // Pass through onError for native img
        className={props.className} // Pass through other classes
      />
    );
  } else {
    // Otherwise, use the Next.js Image component as usual
    return <NextImage {...props} />;
  }
};

export default DebugImage;

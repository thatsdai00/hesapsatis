'use client';

import DOMPurify from 'isomorphic-dompurify';

interface ProductDescriptionProps {
  description: string | null | undefined;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) {
    return null;
  }

  const sanitizedDescription = DOMPurify.sanitize(description);

  return (
    <div className="prose prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
      <div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
    </div>
  );
} 
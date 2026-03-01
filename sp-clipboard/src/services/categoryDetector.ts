import { ClipboardCategory } from '../types';

const URL_REGEX = /^(https?:\/\/|www\.)[^\s]+$/i;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[\d\s\-+()]{7,15}$/;
const CODE_INDICATORS = [
  /^(import|export|const|let|var|function|class|interface|type)\s/m,
  /[{}\[\]];?\s*$/m,
  /=>\s*[{(]/m,
  /\.(ts|js|tsx|jsx|py|rb|go|rs|java|swift|kt)$/m,
  /<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/m,
];

export function detectCategory(content: string): ClipboardCategory {
  const trimmed = content.trim();

  if (URL_REGEX.test(trimmed)) {
    return 'url';
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return 'email';
  }

  if (PHONE_REGEX.test(trimmed)) {
    return 'phone';
  }

  for (const pattern of CODE_INDICATORS) {
    if (pattern.test(trimmed)) {
      return 'code';
    }
  }

  return 'text';
}

export function generatePreview(content: string, maxLength = 100): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.substring(0, maxLength) + '...';
}

import { formatFileSize } from '@/lib/utils';

interface DigitalProductInfoProps {
  fileFormat: string;
  fileSize: number;
  maxDownloads?: number;
  expiryDays?: number;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📄',
  docx: '📄',
  txt: '📄',
  zip: '🗜️',
  rar: '🗜️',
  '7z': '🗜️',
  tar: '🗜️',
  gz: '🗜️',
  mp3: '🎵',
  wav: '🎵',
  flac: '🎵',
  aac: '🎵',
  mp4: '🎬',
  mov: '🎬',
  avi: '🎬',
  mkv: '🎬',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  webp: '🖼️',
  svg: '🖼️',
};

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Document',
  doc: 'Word Document',
  docx: 'Word Document',
  txt: 'Text File',
  zip: 'ZIP Archive',
  rar: 'RAR Archive',
  '7z': '7-Zip Archive',
  tar: 'TAR Archive',
  gz: 'GZip Archive',
  mp3: 'MP3 Audio',
  wav: 'WAV Audio',
  flac: 'FLAC Audio',
  aac: 'AAC Audio',
  mp4: 'MP4 Video',
  mov: 'QuickTime Video',
  avi: 'AVI Video',
  mkv: 'MKV Video',
  jpg: 'JPEG Image',
  jpeg: 'JPEG Image',
  png: 'PNG Image',
  gif: 'GIF Image',
  webp: 'WebP Image',
  svg: 'SVG Image',
};

export function DigitalProductInfo({
  fileFormat,
  fileSize,
  maxDownloads,
  expiryDays,
}: DigitalProductInfoProps) {
  const fmt = fileFormat.toLowerCase();
  const icon = FILE_TYPE_ICONS[fmt] ?? '📁';
  const label = FILE_TYPE_LABELS[fmt] ?? `${fileFormat.toUpperCase()} File`;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl" role="img" aria-label={label}>
          {icon}
        </span>
        <div>
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
        </div>
      </div>

      <div className="space-y-1 border-t border-blue-100 pt-3">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Instant download after purchase</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span>No shipping required</span>
        </div>

        {maxDownloads !== undefined && (
          <div className="text-sm text-gray-600">
            Up to {maxDownloads} download{maxDownloads !== 1 ? 's' : ''}
          </div>
        )}

        {expiryDays !== undefined && (
          <div className="text-sm text-gray-600">
            Access expires after {expiryDays} day{expiryDays !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

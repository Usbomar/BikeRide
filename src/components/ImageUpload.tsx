import { useCallback, useId } from 'react';
import type { ImatgeRuta } from '../types/ruta';

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

interface ImageUploadProps {
  label: string;
  value: ImatgeRuta[];
  onChange: (images: ImatgeRuta[]) => void;
  accept?: string;
}

export default function ImageUpload({ label, value, onChange, accept = 'image/*' }: ImageUploadProps) {
  const id = useId();

  const onSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const newImages: ImatgeRuta[] = [];
      try {
        for (let i = 0; i < files.length; i++) {
          const url = await readFile(files[i]);
          newImages.push({ id: crypto.randomUUID(), url });
        }
        onChange([...value, ...newImages]);
      } catch {
        window.alert(
          'No s’han pogut llegir una o més imatges (fitxer massa gran, format no suportat o error del navegador). Prova amb JPG/PNG més petits.'
        );
      }
      e.target.value = '';
    },
    [value, onChange]
  );

  const remove = useCallback(
    (imageId: string) => {
      onChange(value.filter((img) => img.id !== imageId));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple
        onChange={onSelect}
        className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--superficie-soft)] file:text-[var(--superficie)] cursor-pointer"
      />
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
          {value.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
              <img src={img.url} alt="" className="w-full aspect-square object-cover" />
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-sm hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { FileText, Languages, Moon, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const capabilities = [
  { key: 'local', icon: FileText },
  { key: 'search', icon: Search },
  { key: 'theme', icon: Moon },
  { key: 'i18n', icon: Languages },
] as const;

export default function App() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950 antialiased">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-emerald-700 text-lg font-semibold text-white">
            B
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {t('app.name')}
            </h1>
            <p className="text-sm text-zinc-600">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map(({ key, icon: Icon }) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              key={key}
            >
              <Icon className="mb-4 size-5 text-emerald-700" aria-hidden />
              <h2 className="text-base font-semibold">
                {t(`capabilities.${key}.title`)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t(`capabilities.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

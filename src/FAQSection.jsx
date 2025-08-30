// FAQSection.jsx
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Jak wygląda proces zamówienia?",
    a: "Wybierasz pakiet, dodajesz zdjęcia i opis. Otrzymujesz darmowy projekt do akceptacji. Płacisz dopiero po akceptacji projektu.",
  },
  {
    q: "Ile trwa realizacja?",
    a: "Standardowo 3–5 dni roboczych od akceptacji projektu. Terminy ekspresowe ustalamy indywidualnie.",
  },
  {
    q: "Czy mogę wprowadzić poprawki?",
    a: "Tak. Na etapie wizualizacji zgłaszasz uwagi — wprowadzimy je i odeślemy poprawioną wersję.",
  },
  {
    q: "Jakie zdjęcia najlepiej wysłać?",
    a: "Min. 2–3 zdjęcia twarzy (przód + półprofil), w dobrym świetle. Mile widziane zdjęcia sylwetki i ubioru.",
  },
  {
    q: "Czy mogę zamówić figurkę dla 2+ osób lub ze zwierzakiem?",
    a: "Tak — wybierz pakiet STANDARD (do 2 osób) lub PREMIUM (do 2 osób + zwierzak) i/lub skorzystaj z pola personalizacji.",
  },
  {
    q: "Jakie są metody płatności?",
    a: "Po akceptacji projektu przekierujemy Cię do bezpiecznej płatności online (obecnie w wersji testowej/wyłączonej — finalne bramki dodamy na produkcji).",
  },
  {
    q: "Gdzie sprawdzę status zamówienia?",
    a: "Po wysłaniu formularza otrzymasz e-mail z linkiem do statusu. Link zapisujemy też lokalnie i pokazujemy po wysyłce formularza.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-4 md:px-0">
        <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <span className="inline-flex w-8 h-8 rounded-full bg-blue-600/10 items-center justify-center">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </span>
          Najczęstsze pytania (FAQ)
        </h2>

        <div className="mt-6 divide-y rounded-2xl border bg-white">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group p-4 md:p-5"
              aria-label={`Pytanie ${i + 1}: ${item.q}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-base md:text-lg font-medium text-slate-900">
                  {item.q}
                </span>
                <ChevronDown
                  className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180 text-slate-500"
                  aria-hidden="true"
                />
              </summary>
              <div className="pt-3 text-slate-600 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

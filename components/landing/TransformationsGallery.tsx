"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

type Item = { src: string; alt: string; story?: string };

export function TransformationsGallery({ items }: { items: readonly Item[] }) {
  const [selected, setSelected] = useState<Item | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const repeatedItems = Array.from({ length: 3 }, () => items).flat();

  const stopAndSelect = (item: Item) => {
    swiperRef.current?.autoplay.stop();
    setSelected(item);
  };

  const stopAndNavigate = (direction: "next" | "prev") => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.autoplay.stop();
    if (direction === "next") {
      swiper.slideNext();
      return;
    }
    swiper.slidePrev();
  };

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      <div className="transformations-carousel relative mt-10 px-8 sm:px-12">
        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: false, stopOnLastSlide: false, waitForTransition: true }}
          speed={750}
          centeredSlides
          loop
          loopAdditionalSlides={repeatedItems.length}
          loopPreventsSliding={false}
          rewind={false}
          watchOverflow={false}
          grabCursor
          spaceBetween={14}
          slidesPerView={1.08}
          breakpoints={{ 640: { slidesPerView: 2.1, spaceBetween: 18 }, 1024: { slidesPerView: 3, spaceBetween: 22 } }}
          className="!overflow-visible"
        >
          {repeatedItems.map((item, index) => (
            <SwiperSlide key={`${item.src}-${index}`} className="transformation-slide">
              <button type="button" className="transformation-card group" onClick={() => stopAndSelect(item)} aria-label={`عرض قصة ${item.alt}`}>
                <div className="transformation-slide-media">
                  <Image src={item.src} alt={item.alt} fill priority={index === 0} loading={index === 0 ? undefined : "lazy"} sizes="(max-width: 639px) 88vw, (max-width: 1023px) 48vw, 31vw" className="object-contain" />
                  <span className="absolute inset-x-3 bottom-3 rounded-sm bg-black/70 px-3 py-2 text-right text-xs font-bold text-white">اضغط لعرض القصة</span>
                </div>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        <button type="button" className="transformations-prev carousel-arrow right-0" onClick={() => stopAndNavigate("prev")} aria-label="النتيجة السابقة"><ChevronRight size={22} /></button>
        <button type="button" className="transformations-next carousel-arrow left-0" onClick={() => stopAndNavigate("next")} aria-label="النتيجة التالية"><ChevronLeft size={22} /></button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={selected.alt} onClick={() => setSelected(null)}>
          <button type="button" onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 p-3 text-white hover:text-[var(--accent)]" aria-label="إغلاق"><X size={22} /></button>
          <div className="transformation-modal grid max-h-[calc(100svh-1rem)] w-full max-w-6xl gap-4 overflow-y-auto border border-[var(--border-hairline)] bg-[var(--surface)] p-3 sm:gap-6 sm:p-6 lg:grid-cols-[1.35fr_.65fr] lg:items-center" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-[42svh] min-h-[220px] sm:h-[65vh]"><Image src={selected.src} alt={selected.alt} fill sizes="(max-width: 1024px) 100vw, 65vw" className="object-contain" priority /></div>
            <div className="border-t border-[var(--border-hairline)] pt-5 text-right lg:border-r lg:border-t-0 lg:pr-6 lg:pt-0"><span className="eyebrow">قصة التحول</span><h3 className="mt-3 text-2xl font-black">{selected.alt}</h3>{selected.story ? <p className="mt-5 whitespace-pre-line leading-8 text-[var(--text-secondary)]">{selected.story}</p> : <p className="mt-5 leading-8 text-[var(--text-muted)]">لم تُكتب قصة هذا التحول بعد. أضفها في حقل <code className="text-[var(--accent)]">story</code> داخل ملف محتوى الصفحة.</p>}</div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

type Item = { src: string; alt: string };

export function TransformationsGallery({ items }: { items: readonly Item[] }) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const repeatedItems = Array.from({ length: 5 }, () => items).flat();

  const keepAutoplayRunning = (swiper: SwiperInstance) => {
    if (!swiper.destroyed && !swiper.autoplay.running) swiper.autoplay.start();
  };

  const navigate = (direction: "next" | "prev") => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    if (direction === "next") {
      swiper.slideNext();
      return;
    }
    swiper.slidePrev();
  };

  return (
    <>
      <div className="transformations-carousel relative mt-10 px-8 sm:px-12">
        <Swiper
          modules={[Autoplay]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            keepAutoplayRunning(swiper);
          }}
          onAutoplayStop={keepAutoplayRunning}
          onReachEnd={keepAutoplayRunning}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: false, stopOnLastSlide: false, waitForTransition: false }}
          speed={750}
          centeredSlides
          loop
          loopAdditionalSlides={items.length * 2}
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
              <div className="transformation-card" aria-label={item.alt}>
                <div className="transformation-slide-media">
                  <Image src={item.src} alt={item.alt} fill priority={index === 0} loading={index === 0 ? undefined : "lazy"} sizes="(max-width: 639px) 88vw, (max-width: 1023px) 48vw, 31vw" className="object-contain" />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <button type="button" className="transformations-prev carousel-arrow right-0" onClick={() => navigate("prev")} aria-label="النتيجة السابقة"><ChevronRight size={22} /></button>
        <button type="button" className="transformations-next carousel-arrow left-0" onClick={() => navigate("next")} aria-label="النتيجة التالية"><ChevronLeft size={22} /></button>
      </div>

    </>
  );
}

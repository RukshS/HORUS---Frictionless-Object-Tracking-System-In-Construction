"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const slides = [
  {
    title: "Asset Tracking",
    description: [
      "Effortlessly track assets with AI-powered *RFID* and",
      "*Computer Vision* for real-time, accurate",
      "monitoring. Automate identification, enhance",
      "security, reduce losses, and streamline",
      "inventory management.",
    ],
  },
  {
    title: "Workforce Safety",
    description: [
      "Monitor production lines in real-time with",
      "*Computer Vision* for better accuracy and",
      "efficiency. Automate defect detection, track",
      "workflows, and improve quality control",
      "effortlessly.",
    ],
  },
  {
    title: "Production Line Monitoring",
    description: [
      "Keep workplaces safe with *AI-powered*",
      "monitoring that detects risks in real-time. Get",
      "instant alerts on safety infractions to prevent",
      "accidents and ensure compliance effortlessly.",
    ],
  },
  {
    title: "Quality Control",
    description: [
      "Use computer vision to monitor production",
      "quality in real time and ensure high",
      "standards. Automatically detect defects and",
      "receive instant notifications for any",
      "damaged products, improving efficiency",
      "and reducing waste.",
    ],
  },
];

export default function Functionality() {
  const formatDescription = (desc: string) => {
    return desc.split("*").map((part, index) =>
      index % 2 === 1 ? (
        <span key={index} className="text-blue-800 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      id="Functionality"
      className="w-full min-h-screen flex flex-col items-center justify-center px-5 py-8 lg:py-16 lg:mt-[-300px] xl:mt-[-300px] sm:mt-[-80px]"
    >
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 lg:mb-20">
          <span className="text-blue-800">Functionality </span> 
          <span className="block sm:inline">of Modules</span>
        </h1>

        <div className="relative w-full">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            centeredSlides={true}
            autoplay={{
              delay: 1000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              reverseDirection: false,
            }}
            loop={true}
            loopAdditionalSlides={2}
            speed={800}
            navigation={{
              nextEl: ".custom-next",
              prevEl: ".custom-prev",
            }}
            breakpoints={{
              640: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 1.2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 1.5,
                spaceBetween: 30,
              },
              1280: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1536: {
                slidesPerView: 2.2,
                spaceBetween: 30,
              },
            }}
            className="overflow-hidden pb-16"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="shadow-xl p-6 sm:p-8 lg:p-10 rounded-2xl text-center transition-all duration-300 hover:shadow-2xl bg-white border-2 hover:border-blue-200 mx-2 h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col justify-between">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-6 lg:mb-8 flex-shrink-0">
                    {slide.title}
                  </h2>
                  <div className="text-gray-700 text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-relaxed flex-grow flex flex-col justify-center">
                    {slide.description.map((line, i) => (
                      <span key={i} className="block mb-1">
                        {formatDescription(line)}
                      </span>
                    ))}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="flex justify-center items-center gap-6 mt-8">
            <button className="custom-prev bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 text-lg sm:text-xl">
              ⬅
            </button>
            <button className="custom-next bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 text-lg sm:text-xl">
              ➡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

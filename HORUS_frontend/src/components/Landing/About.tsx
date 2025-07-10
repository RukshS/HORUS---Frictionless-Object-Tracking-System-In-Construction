import { useEffect, useRef, useState } from 'react';
import heroImg from '../../assets/heroimage.png';

const About = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animate-id');
            if (elementId) {
              setVisibleElements(prev => new Set(prev).add(elementId));
            }
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      const elements = sectionRef.current.querySelectorAll('[data-animate-id]');
      elements.forEach(el => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);
  return (
    <div 
      ref={sectionRef}
      id="About" 
      className="w-full min-h-screen flex items-center py-8 lg:py-15 mt-[-100px] lg:mt-[-130px]"
    >
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div 
            className={`order-1 lg:order-1 flex justify-center transition-all duration-1000 ease-out ${
              visibleElements.has('hero-image') 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`}
            data-animate-id="hero-image"
          >
            <img
              src={heroImg}
              alt="HORUS tracking system hero illustration"
              className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-auto object-contain"
            />
          </div>
          <div className="order-2 lg:order-2 text-black space-y-4 lg:space-y-6">
            <h2 
              className={`text-2xl sm:text-3xl lg:text-5xl xl:text-7xl font-bold leading-tight text-center lg:text-left transition-all duration-1000 ease-out ${
                visibleElements.has('heading') 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              data-animate-id="heading"
            >
              Computer-Vision
              <span className="text-blue-800 font-bold"> tracking</span>
              {" "}system
            </h2>
            <div className="space-y-3 lg:space-y-4">
              <p 
                className={`text-base sm:text-lg lg:text-xl xl:text-3xl text-center lg:text-left transition-all duration-1000 ease-out ${
                  visibleElements.has('paragraph-1') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                data-animate-id="paragraph-1"
                style={{ transitionDelay: visibleElements.has('paragraph-1') ? '0.5s' : '0s' }}
              >
                Tracks construction workers with their identities intact.
              </p>
              <p 
                className={`text-base sm:text-lg lg:text-2xl xl:text-3xl text-center lg:text-left transition-all duration-1000 ease-out ${
                  visibleElements.has('paragraph-2') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                data-animate-id="paragraph-2"
                style={{ transitionDelay: visibleElements.has('paragraph-2') ? '1.0s' : '0s' }}
              >
                Aids in worker safety and compliance via PPE (Personal Protective Equipment) detection.
              </p>
              <p 
                className={`text-base sm:text-lg lg:text-2xl xl:text-3xl text-center lg:text-left transition-all duration-1000 ease-out ${
                  visibleElements.has('paragraph-3') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                data-animate-id="paragraph-3"
                style={{ transitionDelay: visibleElements.has('paragraph-3') ? '1.5s' : '0s' }}
              >
                Takes charge of worker attendance management.
              </p>
              <p 
                className={`text-base sm:text-lg lg:text-2xl xl:text-3xl text-center lg:text-left transition-all duration-1000 ease-out ${
                  visibleElements.has('paragraph-4') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                data-animate-id="paragraph-4"
                style={{ transitionDelay: visibleElements.has('paragraph-4') ? '2.0s' : '0s' }}
              >
                Provides AI-driven summary report and insights.
              </p>
              <p 
                className={`text-base sm:text-lg lg:text-2xl xl:text-3xl text-center lg:text-left transition-all duration-1000 ease-out ${
                  visibleElements.has('paragraph-5') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                data-animate-id="paragraph-5"
                style={{ transitionDelay: visibleElements.has('paragraph-5') ? '2.5s' : '0s' }}
              >
                Boost productivity with smart management!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;


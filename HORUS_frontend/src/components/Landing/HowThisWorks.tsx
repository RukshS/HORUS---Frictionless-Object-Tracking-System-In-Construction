import Shot1 from "../../assets/shot1.png";
import Shot2 from "../../assets/shot2.png";
import Shot3 from "../../assets/shot3.png";
import Shot4 from "../../assets/shot4.png";

const HowThisWorks = () => {
  return (
    <div id="HowThisWorks" className="w-full min-h-screen py-8 lg:py-16 lg:mt-[-25px] sm:mt-[-80px]">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8 lg:-mt-12 lg:ml-30 xl:ml-50">
            <div className="space-y-2 ">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold">
                How
              </h2>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-blue-800 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold">this</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-black">works</span>
              </div>
            </div>
            
            <ul className="space-y-4 lg:space-y-5 max-w-lg lg:max-w-xl mx-auto lg:mx-0">
              <li className="bg-slate-300 p-5 lg:p-7 rounded-lg text-center text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold">
                1. Sign-up & Business Setup
              </li>
              <li className="bg-slate-300 p-5 lg:p-7 rounded-lg text-center text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold">
                2. Module Selection
              </li>
              <li className="bg-slate-300 p-5 lg:p-7 rounded-lg text-center text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold">
                3. Plugin & Integration
              </li>
              <li className="bg-slate-300 p-5 lg:p-7 rounded-lg text-center text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold">
                4. Ongoing Management
              </li>
            </ul>
          </div>

          {/* Right side - Image grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto lg:mx-0">
            <div className="relative group cursor-pointer">
              <div className="absolute top-[-12px] left-[-12px] lg:top-[-15px] lg:left-[-15px] bg-blue-800 text-white flex items-center justify-center rounded-full w-12 h-12 lg:w-16 lg:h-16 text-base lg:text-lg font-bold z-10 transition-all duration-300 group-hover:scale-110">
                1
              </div>
              <img
                src={Shot1}
                alt="Business setup module"
                className="w-full h-auto rounded-lg shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl"
              />
            </div>
            <div className="relative group cursor-pointer">
              <div className="absolute top-[-12px] left-[-12px] lg:top-[-15px] lg:left-[-15px] bg-blue-800 text-white flex items-center justify-center rounded-full w-12 h-12 lg:w-16 lg:h-16 text-base lg:text-lg font-bold z-10 transition-all duration-300 group-hover:scale-110">
                2
              </div>
              <img
                src={Shot2}
                alt="Module selection"
                className="w-full h-auto rounded-lg shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl"
              />
            </div>
            <div className="relative group cursor-pointer">
              <div className="absolute top-[-12px] left-[-12px] lg:top-[-15px] lg:left-[-15px] bg-blue-800 text-white flex items-center justify-center rounded-full w-12 h-12 lg:w-16 lg:h-16 text-base lg:text-lg font-bold z-10 transition-all duration-300 group-hover:scale-110">
                3
              </div>
              <img
                src={Shot3}
                alt="Plugin integration"
                className="w-full h-auto rounded-lg shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl"
              />
            </div>
            <div className="relative group cursor-pointer">
              <div className="absolute top-[-12px] left-[-12px] lg:top-[-15px] lg:left-[-15px] bg-blue-800 text-white flex items-center justify-center rounded-full w-12 h-12 lg:w-16 lg:h-16 text-base lg:text-lg font-bold z-10 transition-all duration-300 group-hover:scale-110">
                4
              </div>
              <img
                src={Shot4}
                alt="Ongoing management"
                className="w-full h-auto rounded-lg shadow-md transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HowThisWorks;

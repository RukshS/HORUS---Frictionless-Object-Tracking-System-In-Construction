import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
} from "react-icons/fa6";
// import Image from "next/image";

const Footer = () => {
  return (
    <footer
      className="w-full relative bg-cover bg-center bg-no-repeat text-white rounded-t-2xl p-6 sm:p-8 lg:p-10 min-h-[250px] sm:min-h-[300px] lg:min-h-[350px] mt-[-8] lg:mt-[-16]"
      style={{ backgroundImage: "url('/footerimage.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md rounded-t-2xl"></div>
      <div className="relative py-4 lg:py-6 px-2 sm:px-5 text-center h-full flex flex-col justify-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold mb-4 lg:mb-6">
          Epochs
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-200 max-w-xs sm:max-w-xl lg:max-w-2xl mx-auto mb-6 lg:mb-8 leading-relaxed">
          Enhance efficiency and safety with modular plugins for tracking, monitoring, and optimization using IoT, BLE, and AI
        </p>
        <div className="flex justify-center gap-6 sm:gap-8 lg:gap-12 mb-6 lg:mb-8">
          <FaInstagram className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition cursor-pointer" />
          <FaFacebookF className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-red-500 border border-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition cursor-pointer" />
          <FaXTwitter className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition cursor-pointer" />
          <FaLinkedinIn className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition cursor-pointer" />
        </div>
        <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white font-semibold">
          Designed by - <span className="text-red-500">Epochs</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

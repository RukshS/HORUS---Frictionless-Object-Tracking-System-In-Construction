import { FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import footerImage from '../../assets/footerimage.png'; // adjust the path if needed

const Footer = () => {
  return (
    <footer
      className='relative bg-cover bg-center bg-no-repeat text-white rounded-t-2xl p-10 min-h-[300px] mx-[-150px] mb-[-30px] brightness-300 '
      style={{ backgroundImage: `url(${footerImage})` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md rounded-t-2xl"></div>
      <div className="relative py-1 px-5 text-center">
        <h2 className="text-5xl font-semibold">Epochs</h2>
        <p className="mt-3 text-gray-200 max-w-xl mx-auto py-4">
          Enhance efficiency and safety with modular plugins for tracking, monitoring, and
          optimization using IoT, RFID, and AI.
        </p>
        <div className="flex justify-center gap-12 mt-3">
          <FaInstagram className="w-9 h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition" />
          <FaFacebookF className="w-9 h-9 text-red-500 border border-red-500 p- 1.5 rounded-full hover:bg-red-500 hover:text-white transition" />
          <FaTwitter className="w-9 h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition" />
          <FaLinkedinIn className="w-9 h-9 text-red-500 border border-red-500 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition" />
        </div>
        <p className="mt-9 text-white text-2xl font-semibold">
          Designed by - <span className="text-red-500">Epochs</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

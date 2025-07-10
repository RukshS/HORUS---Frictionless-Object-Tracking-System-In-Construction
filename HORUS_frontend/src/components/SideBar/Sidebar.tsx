import React from "react";
import { FaHome, FaUserShield, FaCogs } from "react-icons/fa";
import logo from "../../assets/logo2.svg";

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  href?: string;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem = "workforce", onItemClick }) => {
  const menuItems: MenuItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <FaHome />,
      href: "#",
      className: "ml-[-70px]"
    },
    {
      id: "asset-tracking",
      label: "Asset Tracking",
      icon: <FaCogs />,
      href: "#",
    },
    {
      id: "workforce",
      label: "Workforce Safety",
      icon: <FaUserShield />,
      href: "#",
      className: "ml-7"
    }
  ];

  const handleItemClick = (item: MenuItem) => {
    if (onItemClick) {
      onItemClick(item.id);
    }
  };

  return (
    <aside className="w-80 bg-slate-200 text-black flex flex-col items-center ml-[-650px] mt-[-40px] py-6">
      <img src={logo} alt="Logo" className="w-50 h-auto mb-10 mt-5" />
      
      <nav className="flex flex-col gap-8 text-lg w-full items-center mt-50">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              handleItemClick(item);
            }}
            className={`flex items-center gap-5 transition-colors duration-200 cursor-pointer ${
              activeItem === item.id 
                ? "text-blue-800 font-semibold" 
                : "hover:text-blue-800"
            } ${item.className || ""}`}
          >
            {item.icon} {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

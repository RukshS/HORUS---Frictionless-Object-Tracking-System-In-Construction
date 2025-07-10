import React, { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Cloud, X } from "lucide-react";
import Sidebar from "../SideBar/Sidebar";

interface Camera {
  id: number;
  name: string;
  location: string;
}

interface DragAndDropBoxProps {
  id: string;
  onDropFiles: (files: File[]) => void;
}

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCamera: (camera: Camera) => void;
}

const DragAndDropBox: React.FC<DragAndDropBoxProps> = ({ id, onDropFiles }) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    onDropFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onDropFiles(files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer w-64 h-40 transition-all duration-200 ease-in-out ${
        isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-100"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        id={id}
      />
      <div className="flex flex-col items-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
          <Cloud className="text-white w-5 h-5" />
        </div>
        <p className="text-sm text-gray-700">
          Drag & drop or{" "}
          <span className="text-blue-600 underline hover:text-blue-800">
            choose file
          </span>
        </p>
      </div>
    </div>
  );
};

const AddCameraModal: React.FC<AddCameraModalProps> = ({ isOpen, onClose, onAddCamera }) => {
  const [cameraName, setCameraName] = useState<string>("");
  const [cameraLocation, setCameraLocation] = useState<string>("");

  const handleSubmit = () => {
    if (cameraName.trim() && cameraLocation.trim()) {
      onAddCamera({
        id: Date.now(),
        name: cameraName,
        location: cameraLocation,
      });
      setCameraName("");
      setCameraLocation("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm backdrop-brightness-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-150 h-90  mx-4 shadow-5xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 ml-45 ">ADD Camera</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 space-y-4 mt-15 gap-5">
          <div className="">
           
            <input
              type="text"
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              className="w-60 px-3 py-2 border-b-2 border-black-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter camera name"
            />
          </div>

          <div>
            
            <input
              type="text"
              value={cameraLocation}
              onChange={(e) => setCameraLocation(e.target.value)}
              className="w-60 px-3 py-2 border-b-2 border-black-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter camera location"
            />
          </div>

         
        </div>
        <button
          onClick={handleSubmit}
          className="w-80 bg-blue-600 text-white py-2 px-4 rounded-5xl hover:bg-blue-700 transition-colors font-medium mt-10"
        >
          Add Camera
        </button>
      </div>
    </div>
  );
};

const Workforce: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [activeMenuItem, setActiveMenuItem] = useState<string>("workforce");

  const handleFileUpload = (files: File[]) => {
    console.log("Uploaded:", files);
  };

  const handleAddCamera = (camera: Camera) => {
    setCameras((prev) => [...prev, camera]);
  };

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId);
    console.log(`Navigating to: ${itemId}`);
    // Here you can add navigation logic, such as:
    // - Routing to different pages
    // - Changing the main content area
    // - Updating the dashboard view
  };

  return (
    <div className="flex h-screen bg-gray-100 gap-20">
      <Sidebar 
        activeItem={activeMenuItem} 
        onItemClick={handleMenuItemClick} 
      />

      <main className="flex-1 p-10 ml-10">
        <h1 className="text-5xl text-blue-800 mb-2 ml-[-20px]">
          Work Force <span className="text-black text-4xl">Safety</span>
        </h1>

        <section className="bg-slate-200 rounded-2xl p-8 mt-6  w-200 h-130 mr-[-400px]">
          <h2 className="text-2xl font-semibold text-gray-700 ml-[-550px] mb-8">
            Upload Video
          </h2>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 flex flex-col gap-6">
              <DragAndDropBox id="upload1" onDropFiles={handleFileUpload} />
              <DragAndDropBox id="upload2" onDropFiles={handleFileUpload} />
            </div>

            <div className="flex flex-col justify-center items-center gap-6 mt-[-100px] ml-[-100px]">
              <button className="bg-blue-800 text-black px-6 py-3 rounded-md w-40 transition-all ease-linear hover:bg-blue-600 hover:shadow hover:text-white ">
                Track
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-800 text-black px-6 py-3 rounded-md w-40 transition-all ease-linear hover:bg-blue-600 hover:shadow hover:text-white"
              >
                Add Camera
              </button>
            </div>
          </div>
        </section>
      </main>

      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCamera={handleAddCamera}
      />
    </div>
  );
};

export default Workforce;

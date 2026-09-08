import { Loader as LoaderIcon } from "lucide-react"; // You can choose any icon you prefer

const Loader = () => {
  return (
    <div className="flex justify-center items-center space-x-2">
      <LoaderIcon className="animate-spin text-slate-900" size={32} />
      <span>Loading...</span>
    </div>
  );
};

export default Loader;

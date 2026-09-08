import { Search } from "lucide-react";
import React, { useState } from "react";

interface SearchbarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const CustomSearchbar: React.FC<SearchbarProps> = ({
  onSearch,
  placeholder = "Search...",
}) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
      />
      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-300" />
    </div>
  );
};

export default CustomSearchbar;

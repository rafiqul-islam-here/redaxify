import { ReactNode } from "react";

// Table Root Component
interface TableProps {
  children: ReactNode;
  className?: string;
}

const CustomTable: React.FC<TableProps> = ({ children, className }) => (
  <div className="overflow-hidden rounded-sm shadow-lg border border-gray-200 dark:border-gray-700">
    <table
      className={`w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 ${
        className || ""
      }`}
    >
      {children}
    </table>
  </div>
);

// Table Header Component
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

const CustomTableHeader: React.FC<TableHeaderProps> = ({
  children,
  className,
}) => (
  <thead className={`bg-black text-center text-white   ${className || ""}`}>
    {children}
  </thead>
);

// Table Body Component
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

const CustomTableBody: React.FC<TableBodyProps> = ({ children, className }) => (
  <tbody
    className={`divide-y divide-gray-200 dark:divide-gray-700 ${
      className || ""
    }`}
  >
    {children}
  </tbody>
);

// Table Row Component
interface TableRowProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "striped";
}

const CustomTableRow: React.FC<TableRowProps> = ({
  children,
  className,
  variant = "default",
}) => {
  const variantClasses = {
    default: " dark:hover:bg-gray-800",
    striped: "even:bg-gray-50 dark:even:bg-gray-800",
  };

  return (
    <tr
      className={`transition-colors duration-200 text-sm ${
        variantClasses[variant]
      } ${className || ""}`}
    >
      {children}
    </tr>
  );
};

// Table Head Component
interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

const CustomTableHead: React.FC<TableHeadProps> = ({ children, className }) => (
  <th
    className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center ${
      className || ""
    }`}
  >
    {children}
  </th>
);

// Table Cell component
interface TableCellProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

const CustomTableCell: React.FC<TableCellProps> = ({
  children,
  className,
  scrollable,
}) => (
  <td
    className={`px-6 py-4 text-sm whitespace-nowrap text-center ${
      className || ""
    }`}
  >
    <div
      className={`${
        scrollable
          ? "h-14 overflow-y-auto p-2 whitespace-normal break-words"
          : ""
      }  `}
    >
      {children}
    </div>
  </td>
);

export {
  CustomTable,
  CustomTableBody,
  CustomTableCell,
  CustomTableHead,
  CustomTableHeader,
  CustomTableRow,
};

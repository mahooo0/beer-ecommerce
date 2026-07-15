import {
  Award,
  Banknote,
  BarChart3,
  Boxes,
  Calendar,
  ChartBar,
  Component,
  Fingerprint,
  FolderTree,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  ShoppingCart,
  SquareArrowUpRight,
  Tags,
  Truck,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Таранка",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Products",
        url: "/dashboard/products",
        icon: Package,
        subItems: [
          { title: "All Products", url: "/dashboard/products" },
          { title: "Add Product", url: "/dashboard/products/new" },
        ],
      },
      {
        title: "Categories",
        url: "/dashboard/categories",
        icon: FolderTree,
      },
      {
        title: "Collections",
        url: "/dashboard/collections",
        icon: Layers,
      },
      {
        title: "Brands",
        url: "/dashboard/brands",
        icon: Award,
      },
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: ShoppingCart,
      },
      {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Boxes,
        subItems: [
          { title: "Overview", url: "/dashboard/inventory" },
          { title: "Warehouses", url: "/dashboard/inventory/warehouses" },
          { title: "Movements", url: "/dashboard/inventory/movements" },
          { title: "Adjustments", url: "/dashboard/inventory/adjustments" },
        ],
      },
      {
        title: "Shipping",
        url: "/dashboard/shipping/zones",
        icon: Truck,
      },
      {
        title: "Tags",
        url: "/dashboard/tags",
        icon: Tags,
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        title: "Search",
        url: "/dashboard/search",
        icon: Search,
      },
    ],
  },
  {
    id: 2,
    label: "Template · Dashboards",
    items: [
      {
        title: "Default",
        url: "/dashboard/templates/default",
        icon: LayoutDashboard,
      },
      {
        title: "CRM",
        url: "/dashboard/templates/crm",
        icon: ChartBar,
      },
      {
        title: "Finance",
        url: "/dashboard/templates/finance",
        icon: Banknote,
      },
      {
        title: "Analytics",
        url: "/dashboard/templates/analytics",
        icon: Gauge,
      },
      {
        title: "Productivity",
        url: "/dashboard/templates/productivity",
        icon: ListTodo,
      },
      {
        title: "Draggable",
        url: "/dashboard/templates/draggable",
        icon: LayoutGrid,
        isNew: true,
      },
      {
        title: "E-commerce",
        url: "/dashboard/templates/coming-soon",
        icon: ShoppingBag,
        comingSoon: true,
      },
      {
        title: "Academy",
        url: "/dashboard/templates/coming-soon",
        icon: GraduationCap,
        comingSoon: true,
      },
      {
        title: "Logistics",
        url: "/dashboard/templates/coming-soon",
        icon: Forklift,
        comingSoon: true,
      },
    ],
  },
  {
    id: 3,
    label: "Template · Pages",
    items: [
      {
        title: "Email",
        url: "/dashboard/templates/mail",
        icon: Mail,
        isNew: true,
      },
      {
        title: "Chat",
        url: "/dashboard/templates/chat",
        icon: MessageSquare,
        isNew: true,
      },
      {
        title: "Calendar",
        url: "/dashboard/templates/calendar",
        icon: Calendar,
        isNew: true,
      },
      {
        title: "Kanban",
        url: "/dashboard/templates/kanban",
        icon: Kanban,
      },
      {
        title: "Invoice",
        url: "/dashboard/templates/coming-soon",
        icon: ReceiptText,
        comingSoon: true,
      },
      {
        title: "Users",
        url: "/dashboard/templates/coming-soon",
        icon: Users,
        comingSoon: true,
      },
      {
        title: "Roles",
        url: "/dashboard/templates/coming-soon",
        icon: Lock,
        comingSoon: true,
      },
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Login v2", url: "/auth/v2/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
          { title: "Register v2", url: "/auth/v2/register", newTab: true },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Template · Legacy",
    items: [
      {
        title: "Dashboards",
        url: "/dashboard/templates/default-v1",
        subItems: [
          { title: "Default V1", url: "/dashboard/templates/default-v1" },
          { title: "CRM V1", url: "/dashboard/templates/crm-v1" },
          { title: "Finance V1", url: "/dashboard/templates/finance-v1" },
          { title: "Analytics V1", url: "/dashboard/templates/analytics-v1" },
        ],
      },
    ],
  },
  {
    id: 5,
    label: "Template · Misc",
    items: [
      {
        title: "Components",
        url: "/dashboard/templates/components",
        icon: Component,
        isNew: true,
      },
      {
        title: "Others",
        url: "/dashboard/templates/coming-soon",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },
];

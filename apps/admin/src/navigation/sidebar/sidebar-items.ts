import {
  Award,
  Banknote,
  BarChart3,
  Calendar,
  ChartBar,
  Component,
  Contact,
  FileText,
  Fingerprint,
  FolderTree,
  Forklift,
  Gauge,
  GraduationCap,
  Images,
  Inbox,
  Kanban,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  List,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  Megaphone,
  BadgePercent,
  MessageSquare,
  Newspaper,
  PackagePlus,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  SquareArrowUpRight,
  Tags,
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
        title: "nav.overview",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "nav.section.sales",
    items: [
      {
        title: "nav.orders",
        url: "/dashboard/orders",
        icon: ShoppingCart,
        subItems: [
          { title: "nav.ordersList", url: "/dashboard/orders", icon: List },
          { title: "nav.ordersBoard", url: "/dashboard/orders?view=board", icon: Kanban },
        ],
      },
      {
        title: "nav.analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: 3,
    label: "nav.catalog",
    items: [
      { title: "nav.allProducts", url: "/dashboard/products", icon: PackageSearch },
      { title: "nav.addProduct", url: "/dashboard/products/new", icon: PackagePlus },
      { title: "nav.categories", url: "/dashboard/categories", icon: FolderTree },
      { title: "nav.collections", url: "/dashboard/collections", icon: Layers },
      { title: "nav.brands", url: "/dashboard/brands", icon: Award },
      { title: "nav.tags", url: "/dashboard/tags", icon: Tags },
      // Inventory (multi-warehouse) hidden from the nav: stock/availability is
      // tracked on the product itself (trackQuantity/quantity, isAvailable,
      // variant.stock) and the live order flow never touches Warehouse/
      // InventoryItem. Pages still exist under /dashboard/inventory/* by URL.
      { title: "nav.promoBanners", url: "/dashboard/promo-banners", icon: Megaphone },
    ],
  },
  {
    id: 4,
    label: "nav.section.customers",
    items: [
      { title: "nav.customers", url: "/dashboard/customers", icon: Contact },
      { title: "nav.team", url: "/dashboard/users", icon: Users },
      { title: "nav.loyaltyTiers", url: "/dashboard/loyalty-tiers", icon: BadgePercent },
      { title: "nav.leads", url: "/dashboard/leads", icon: Inbox },
    ],
  },
  {
    id: 5,
    label: "nav.section.content",
    items: [
      {
        title: "nav.blog",
        url: "/dashboard/blog",
        icon: Newspaper,
        subItems: [
          { title: "nav.blogPosts", url: "/dashboard/blog", icon: Newspaper },
          { title: "nav.blogCategories", url: "/dashboard/blog/categories", icon: FolderTree },
          { title: "nav.blogMedia", url: "/dashboard/blog/media", icon: Images },
        ],
      },
      { title: "nav.pages", url: "/dashboard/pages", icon: FileText },
    ],
  },
  // Ops group (Shipping zones + Search) hidden from the nav. The live checkout
  // uses flat PL delivery methods (kurier/wlasna/poczta), not the multi-country
  // ShippingZone/ShippingMethod models (only the unrouted generic checkout used
  // those). Storefront search hits /products?search= (DB filter), not the
  // Meilisearch settings this page tunes. Pages remain at /dashboard/shipping/*
  // and /dashboard/search by URL.
  {
    id: 7,
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
    id: 8,
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
    id: 9,
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
    id: 10,
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

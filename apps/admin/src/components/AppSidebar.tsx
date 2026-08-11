"use client";

import {
  Home,
  Search,
  User,
  Shirt,
  FolderTree,
  Layers,
  Tags,
  ShoppingBasket,
  Truck,
  Package,
  BookmarkIcon,
  BarChart3,
  ChevronsUpDown,
  LogOut,
  BadgeCheck,
  Bell,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useClerk, useUser } from "@clerk/nextjs";
import { hasPermission, PERMISSIONS, type Permission } from "@repo/types/rbac";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission: Permission;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home, permission: PERMISSIONS.DASHBOARD },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, permission: PERMISSIONS.ANALYTICS },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", url: "/dashboard/products", icon: Shirt, permission: PERMISSIONS.PRODUCTS },
      { title: "Categories", url: "/dashboard/categories", icon: FolderTree, permission: PERMISSIONS.CATEGORIES },
      { title: "Collections", url: "/dashboard/collections", icon: Layers, permission: PERMISSIONS.COLLECTIONS },
      { title: "Brands", url: "/dashboard/brands", icon: BookmarkIcon, permission: PERMISSIONS.BRANDS },
      { title: "Tags", url: "/dashboard/tags", icon: Tags, permission: PERMISSIONS.TAGS },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Orders", url: "/dashboard/orders", icon: ShoppingBasket, permission: PERMISSIONS.ORDERS },
      { title: "Shipping", url: "/dashboard/shipping/zones", icon: Truck, permission: PERMISSIONS.SHIPPING },
      { title: "Inventory", url: "/dashboard/inventory", icon: Package, permission: PERMISSIONS.INVENTORY },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Users", url: "/dashboard/users", icon: User, permission: PERMISSIONS.USERS_VIEW },
      { title: "Search", url: "/dashboard/search", icon: Search, permission: PERMISSIONS.SEARCH },
    ],
  },
];

const AppSidebar = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const role = user?.publicMetadata?.role as string | undefined;

  // Only show nav items the current role has permission for.
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "A"
    : "A";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "Admin"} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.fullName || "Admin"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress || "admin@store.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || "Admin"} />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.fullName || "Admin"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress || "admin@store.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;

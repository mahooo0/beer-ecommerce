// English (source language). Keys are shared across pl.ts / uk.ts.
export const en = {
  nav: {
    blog: "Blog",
    leads: "Leads",
    blogPosts: "Posts",
    blogCategories: "Categories",
    blogMedia: "Media",
    pages: "Pages",
    overview: "Overview",
    catalog: "Catalog",
    allProducts: "All Products",
    addProduct: "Add Product",
    categories: "Categories",
    collections: "Collections",
    brands: "Brands",
    promoBanners: "Promo Banners",
    users: "Users",
  },
  language: {
    title: "Language",
    en: "English",
    pl: "Polski",
    uk: "Українська",
  },
  common: {
    noResults: "No results found.",
    search: "Search",
  },
  quickCreate: {
    tooltip: "Quick Create",
    placeholder: "Type a command or search…",
    createGroup: "Create",
    button: "Quick action",
    actions: {
      product: "Add product",
      category: "Add category",
      collection: "Add collection",
      brand: "Add brand",
      user: "Add user",
    },
  },
  search: {
    placeholder: "Search dashboards, users, and more…",
  },
  categories: {
    title: "Categories",
    add: "Add Category",
    hierarchy: "Category Hierarchy",
    searchLabel: "Search",
    searchPlaceholder: "Search categories...",
    createTitle: "Create Category",
    editTitle: "Edit Category",
    createDesc: "Fill in the details to create a new category.",
    editDesc: "Update the category details below.",
    form: {
      name: "Name",
      description: "Description",
      parent: "Parent Category",
      none: "None (Root Category)",
      image: "Image",
      seo: "SEO Settings",
      slug: "URL Slug",
      slugPreview: "Preview: /categories/{{slug}}",
      metaTitle: "Meta Title",
      metaDescription: "Meta Description",
      create: "Create Category",
      update: "Update Category",
      cancel: "Cancel",
      saving: "Saving...",
      errors: {
        nameRequired: "Name is required",
        nameMax: "Name must be 100 characters or less",
        urlInvalid: "Must be a valid URL",
        metaTitleMax: "Meta title must be 60 characters or less",
        metaDescMax: "Meta description must be 160 characters or less",
        slugInvalid: "Slug must contain only lowercase letters, numbers, and hyphens",
        notAuth: "Not authenticated",
        saveFailed: "Failed to save category",
      },
    },
  },
  overview: {
    "title": "Dashboard",
    "dateRange": {
      "last7d": "Last 7d",
      "last30d": "Last 30d",
      "last90d": "Last 90d",
      "thisYear": "This Year"
    },
    "kpi": {
      "totalRevenue": "Total Revenue",
      "totalOrders": "Total Orders",
      "avgOrderValue": "Avg Order Value",
      "totalCustomers": "Total Customers"
    },
    "revenue": {
      "title": "Revenue Over Time",
      "label": "Revenue",
      "empty": "No data for selected period"
    },
    "orderStatus": {
      "title": "Order Status",
      "orders": "Orders",
      "empty": "No order data"
    },
    "lowStock": {
      "title": "Low Stock Alerts",
      "viewAll": "View All",
      "empty": "No low stock alerts",
      "availableThreshold": "{{available}} available · Threshold: {{threshold}}",
      "out": "Out",
      "low": "Low"
    },
    "recentOrders": {
      "title": "Recent Orders",
      "empty": "No recent orders",
      "columns": {
        "orderNumber": "Order #",
        "customer": "Customer",
        "total": "Total",
        "status": "Status",
        "date": "Date"
      }
    },
    "topProducts": {
      "title": "Top Products",
      "empty": "No product data",
      "unitsSold": "{{count}} units sold"
    },
    "status": {
      "pending": "Pending",
      "paid": "Paid",
      "processing": "Processing",
      "shipped": "Shipped",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
      "returned": "Returned",
      "refund_requested": "Refund requested"
    }
  },
  products: {
    "title": "Products",
    "count": "{{count}} products",
    "incomplete": "{{count}} not fully filled",
    "incompleteCurrentPage": "{{count}} not fully filled (for the current page)",
    "newProduct": "New product",
    "empty": "No products found.",
    "columns": {
      "selectAll": "Select all",
      "selectRow": "Select row",
      "image": "Image",
      "name": "Name",
      "category": "Category",
      "price": "Price",
      "availability": "Availability",
      "completeness": "Completeness",
      "status": "Status",
      "actions": "Actions"
    },
    "status": {
      "DRAFT": "Draft",
      "ACTIVE": "Active",
      "ARCHIVED": "Archived"
    },
    "type": {
      "SIMPLE": "Simple",
      "VARIABLE": "Variable",
      "WEIGHTED": "Weighted",
      "DIGITAL": "Digital",
      "BUNDLED": "Bundled"
    },
    "availability": {
      "inStock": "In stock",
      "outOfStock": "Out of stock",
      "units": "{{count}} pcs"
    },
    "filters": {
      "title": "Filters",
      "clear": "Clear",
      "category": "Category",
      "allCategories": "All categories",
      "status": "Status",
      "allStatuses": "All statuses",
      "allTypes": "All types",
      "availability": "Availability",
      "anyAvailability": "Any",
      "completeness": "Completeness",
      "allCompleteness": "All",
      "completenessComplete": "Filled (100%)",
      "completenessIncomplete": "Not filled",
      "price": "Price (₴)",
      "priceFrom": "from",
      "priceTo": "to"
    },
    "actions": {
      "edit": "Edit",
      "delete": "Delete",
      "deleteConfirm": "Delete this product?"
    },
    "bulk": {
      "actions": "Bulk actions",
      "setActive": "Set to Active",
      "setDraft": "Set to Draft",
      "setArchived": "Set to Archived",
      "deleteSelected": "Delete selected",
      "selectedCount": "{{count}} selected",
      "confirmUpdate": "Update {{count}} products to {{status}}?",
      "confirmDelete": "Delete {{count}} products? This action cannot be undone."
    },
    "table": {
      "searchPlaceholder": "Search products...",
      "createProduct": "Create product",
      "empty": "No products found"
    },
    "pagination": {
      "previous": "Previous",
      "next": "Next",
      "back": "Back",
      "forward": "Next",
      "pageOf": "Page {{page}} of {{total}}",
      "perPage": "{{count}} per page"
    },
    "toasts": {
      "deleteFailed": "Failed to delete product",
      "selectToUpdate": "Please select products to update",
      "selectToDelete": "Please select products to delete",
      "updateFailed": "Failed to update products: {{message}}",
      "deleteFailedDetail": "Failed to delete products: {{message}}"
    }
  },
  productForm: {
    "pageTitle": {
      "create": "Create product",
      "edit": "Edit product"
    },
    "sections": {
      "basicInfo": "Basic information",
      "pricing": "Price",
      "stock": "Availability / Stock",
      "attributes": "Attributes",
      "organization": "Organization",
      "images": "Images",
      "keywords": "Keywords",
      "wholesale": "Wholesale pricing"
    },
    "wholesale": {
      "description": "Quantity-based pricing for wholesale customers (WHOLESALE). Retail customers always pay the regular price.",
      "minQty": "Qty from",
      "price": "Price for lot (cents)",
      "perUnit": "≈ {{value}} zł/unit",
      "addTier": "Add tier",
      "remove": "Remove tier",
      "empty": "No tiers yet. Add your first wholesale price tier."
    },
    "fields": {
      "name": "Name",
      "description": "Description",
      "composition": "Composition",
      "slug": "Slug (URL)",
      "price": "Price (kopecks)",
      "salePrice": "Sale price (kopecks)",
      "baseUnit": "Unit of measure",
      "category": "Category",
      "manufacturer": "Manufacturer",
      "brand": "Brand",
      "status": "Status"
    },
    "placeholders": {
      "name": "Enter product name",
      "description": "Describe the product",
      "composition": "Composition / ingredients",
      "slug": "product-url",
      "category": "Select a category",
      "manufacturer": "Manufacturer name",
      "brand": "Select a brand (optional)",
      "keywords": "Generated automatically on the server"
    },
    "hints": {
      "slug": "Generated from the name. The server checks uniqueness on save."
    },
    "stock": {
      "quantityTab": "Quantity",
      "availabilityTab": "Availability",
      "quantityLabel": "Quantity in stock",
      "quantityHint": "Tracked by number; deducted on order.",
      "inStock": "In stock",
      "outOfStock": "Out of stock",
      "availabilityHint": "Manual availability toggle without quantity tracking."
    },
    "status": {
      "draft": "Draft",
      "active": "Active",
      "archived": "Archived"
    },
    "actions": {
      "cancel": "Cancel",
      "saving": "Saving…",
      "update": "Update product",
      "create": "Create product"
    },
    "toasts": {
      "created": "Product created",
      "updated": "Product updated",
      "saveFailed": "Failed to save product"
    },
    "attributes": {
      "selectCategoryFirst": "Select a category to set product attributes.",
      "loading": "Loading attributes…",
      "loadError": "Failed to load attributes for this category.",
      "empty": "No attributes are defined for this category. Add them on the category page.",
      "noValues": "No values. Add \"shared options\" on the category page.",
      "notSet": "— not set —"
    },
    "images": {
      "count": "{{count}}/{{max}} images",
      "reorderHint": " · drag to reorder",
      "clearAll": "Clear all",
      "alt": "Product image",
      "mainBadge": "Main",
      "dragTitle": "Drag",
      "setMainTitle": "Set as main",
      "removeTitle": "Remove"
    },
    "completeness": {
      "filled": "{{percent}}% complete",
      "allFilled": "All fields are filled"
    }
  },
  collections: {
    "title": "Collections",
    "add": "Add Collection",
    "empty": "No collections found. Create one to get started.",
    "filters": {
      "search": "Search",
      "searchPlaceholder": "Search collections..."
    },
    "analytics": {
      "title": "Collection Analytics",
      "total": "Total Collections",
      "active": "Active",
      "inactive": "Inactive"
    },
    "columns": {
      "name": "Name",
      "slug": "Slug",
      "products": "Products",
      "status": "Status",
      "actions": "Actions"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive"
    },
    "actions": {
      "edit": "Edit",
      "products": "Products",
      "delete": "Delete",
      "deleteConfirm": "Are you sure you want to delete this collection?"
    },
    "sheet": {
      "editTitle": "Edit Collection",
      "createTitle": "Create Collection",
      "editDescription": "Update the collection details below.",
      "createDescription": "Fill in the details to create a new collection."
    },
    "form": {
      "name": "Name",
      "namePlaceholder": "Summer Collection",
      "slug": "Slug",
      "slugPlaceholder": "summer-collection",
      "description": "Description",
      "descriptionPlaceholder": "Curated products for the summer season",
      "image": "Image",
      "active": "Active",
      "saving": "Saving...",
      "update": "Update Collection",
      "create": "Create Collection",
      "cancel": "Cancel"
    },
    "products": {
      "manageTitle": "Manage Products in \"{{name}}\"",
      "current": "Current Products",
      "empty": "No products in this collection yet.",
      "add": "Add Products",
      "addButton": "Add",
      "remove": "Remove",
      "searchPlaceholder": "Search products by name or SKU...",
      "noResults": "No products found",
      "sku": "SKU: {{sku}}",
      "addFailed": "Failed to add product",
      "removeFailed": "Failed to remove product"
    },
    "errors": {
      "nameRequired": "Name is required",
      "slugRequired": "Slug is required",
      "urlInvalid": "Must be a valid URL",
      "notAuth": "Not authenticated",
      "saveFailed": "Failed to save collection",
      "deleteFailed": "Failed to delete collection"
    }
  },
  leads: {
    title: "Leads",
    empty: "No submissions yet.",
    searchPlaceholder: "Search submissions…",
    analytics: { title: "Form Submissions", total: "Total", forms: "Forms" },
    columns: { date: "Date", form: "Form", data: "Submitted data" },
  },
  blog: {
    title: "Blog",
    add: "New Post",
    empty: "No posts yet.",
    searchPlaceholder: "Search by title or slug…",
    analytics: { title: "Blog Overview", total: "Total", published: "Published", drafts: "Drafts" },
    columns: { title: "Title", categories: "Categories", status: "Status", updated: "Updated", actions: "Actions" },
    status: { published: "Published", draft: "Draft" },
    actions: { edit: "Edit", delete: "Delete", deleteConfirm: "Delete this post?" },
    errors: { deleteFailed: "Failed to delete post" },
  },
  pages: {
    title: "Content Pages",
    editTitle: "Edit Page",
    cancel: "Cancel",
    saveDraft: "Save Draft",
    publish: "Publish",
    saving: "Saving…",
    saved: "Page saved",
    empty: "No pages yet.",
    edit: "Edit",
    analytics: { title: "Pages", total: "Total" },
    columns: { title: "Title", slug: "Slug", status: "Status", actions: "Actions" },
    status: { published: "Published", draft: "Draft" },
    fields: { title: "Title", slug: "Slug", seoTitle: "SEO title", seoDescription: "SEO description" },
    layout: "Content blocks",
    noBlocks: "No blocks yet. Add one below.",
    contentPlaceholder: "Write…",
    form: "Form",
    blockReadonly: "Block edited in Payload",
    addContent: "Add text",
    addForm: "Add form",
    blocks: { content: "Text", form: "Form" },
    errors: { titleRequired: "Title (PL) is required", layoutRequired: "Add at least one block (PL)", saveFailed: "Failed to save page" },
  },
  blogPost: {
    createTitle: "New Post",
    editTitle: "Edit Post",
    cancel: "Cancel",
    saveDraft: "Save Draft",
    publish: "Publish",
    saving: "Saving…",
    saved: "Post saved",
    fields: {
      title: "Title",
      slug: "Slug",
      content: "Content",
      contentPlaceholder: "Write the post…",
      categories: "Categories",
      noCategories: "No categories yet — create one first.",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      hero: "Cover image",
      heroUpload: "Upload",
      heroUploading: "Uploading…",
      heroRemove: "Remove",
    },
    errors: { titleRequiredPl: "Title (PL) is required", titleRequiredUk: "Title (UK) is required", contentRequiredPl: "Content (PL) is required", contentRequiredUk: "Content (UK) is required", saveFailed: "Failed to save post" },
  },
  mediaPicker: {
    title: "Media library",
    choose: "Choose from media",
    upload: "Upload",
    uploading: "Uploading…",
    remove: "Remove",
    search: "Search…",
    empty: "No media yet.",
    errors: { load: "Failed to load media", upload: "Upload failed" },
  },
  blogMedia: {
    title: "Media Library",
    upload: "Upload",
    uploading: "Uploading…",
    uploaded: "Uploaded",
    empty: "No media yet.",
    delete: "Delete",
    deleteConfirm: "Delete this image?",
    errors: { uploadFailed: "Upload failed", deleteFailed: "Failed to delete" },
  },
  blogCategories: {
    title: "Blog Categories",
    add: "New Category",
    empty: "No categories yet.",
    saved: "Category saved",
    analytics: { title: "Categories", total: "Total" },
    columns: { title: "Title", slug: "Slug", actions: "Actions" },
    sheet: { createTitle: "New Category", editTitle: "Edit Category", description: "Title in PL/UK and a URL slug." },
    form: { titlePl: "Title (PL)", titleUk: "Title (UK)", slug: "Slug", cancel: "Cancel", saving: "Saving…", create: "Create", update: "Update" },
    actions: { edit: "Edit", delete: "Delete", deleteConfirm: "Delete this category?" },
    errors: { titleRequired: "Title (PL) is required", titleRequiredUk: "Title (UK) is required", saveFailed: "Failed to save category", deleteFailed: "Failed to delete category" },
  },
  promoBanners: {
    title: "Promo Banners",
    add: "Add Banner",
    empty: "No promo banners yet. Create one to get started.",
    target: { product: "Product", category: "Category" },
    analytics: { title: "Banner Analytics", total: "Total", active: "Active", linked: "Linked" },
    columns: { image: "Image", title: "Title", target: "Target", position: "Position", status: "Status", actions: "Actions" },
    status: { active: "Active", inactive: "Inactive" },
    sheet: {
      createTitle: "Create Promo Banner",
      editTitle: "Edit Promo Banner",
      createDescription: "Upload an image, add text and link it to a product or category.",
      editDescription: "Update the promo banner below.",
    },
    form: {
      image: "Image",
      titlePl: "Title (PL)",
      titleUk: "Title (UK)",
      titlePlaceholder: "Sweets Ridna Ukraina",
      subtitlePl: "Text (PL)",
      subtitleUk: "Text (UK)",
      subtitlePlaceholder: "One of the most popular products in our store.",
      ctaPl: "Button (PL)",
      ctaUk: "Button (UK)",
      ctaPlaceholder: "Learn more",
      linkType: "Link",
      linkNone: "No link",
      linkProduct: "Product",
      linkCategory: "Category",
      linkHref: "Custom URL",
      product: "Product",
      selectProduct: "Select a product…",
      category: "Category",
      selectCategory: "Select a category…",
      href: "URL",
      isActive: "Active",
      position: "Position",
      saving: "Saving…",
      create: "Create",
      update: "Update",
    },
    actions: { edit: "Edit", delete: "Delete", deleteConfirm: "Delete this promo banner?" },
    errors: {
      imageRequired: "Image is required",
      notAuth: "Not authenticated",
      saveFailed: "Failed to save banner",
      deleteFailed: "Failed to delete banner",
    },
  },
  brands: {
    "title": "Brands",
    "addBrand": "Add Brand",
    "visit": "Visit",
    "noLogo": "No logo",
    "empty": "No brands found. Create one to get started.",
    "filters": {
      "search": "Search",
      "searchPlaceholder": "Search brands..."
    },
    "analytics": {
      "title": "Brand Analytics",
      "totalBrands": "Total Brands",
      "withLogos": "With Logos",
      "withWebsites": "With Websites"
    },
    "columns": {
      "name": "Name",
      "slug": "Slug",
      "logo": "Logo",
      "website": "Website",
      "products": "Products",
      "actions": "Actions"
    },
    "form": {
      "name": "Name",
      "namePlaceholder": "Nike",
      "slug": "Slug",
      "slugPlaceholder": "nike",
      "description": "Description",
      "descriptionPlaceholder": "A leading sports brand",
      "logo": "Logo",
      "website": "Website",
      "websitePlaceholder": "https://example.com",
      "saving": "Saving...",
      "create": "Create Brand",
      "update": "Update Brand",
      "cancel": "Cancel"
    },
    "sheet": {
      "createTitle": "Create Brand",
      "editTitle": "Edit Brand",
      "createDescription": "Fill in the details to create a new brand.",
      "editDescription": "Update the brand details below."
    },
    "actions": {
      "edit": "Edit",
      "delete": "Delete",
      "deleteConfirm": "Are you sure you want to delete this brand?"
    },
    "errors": {
      "nameRequired": "Name is required",
      "slugRequired": "Slug is required",
      "urlInvalid": "Must be a valid URL",
      "notAuth": "Not authenticated",
      "saveFailed": "Failed to save brand",
      "deleteFailed": "Failed to delete brand"
    }
  },
  users: {
    "title": "Users",
    "addUser": "Add User",
    "empty": "No users found.",
    "roles": {
      "CUSTOMER": "Customer",
      "ADMIN": "Admin",
      "SUPER_ADMIN": "Super Admin"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "disabled": "Disabled"
    },
    "columns": {
      "id": "ID",
      "user": "User",
      "email": "Email",
      "role": "Role",
      "status": "Status",
      "created": "Created",
      "actions": "Actions"
    },
    "actions": {
      "view": "View"
    },
    "filters": {
      "search": "Search",
      "searchPlaceholder": "Search users...",
      "role": "Role",
      "allRoles": "All Roles"
    },
    "analytics": {
      "title": "User Analytics",
      "totalUsers": "Total Users",
      "active": "Active",
      "inactive": "Inactive",
      "admins": "Admins"
    },
    "pagination": {
      "previous": "Previous",
      "next": "Next",
      "pageOf": "Page {{page}} of {{totalPages}}"
    },
    "form": {
      "title": "Create New User",
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email",
      "password": "Password",
      "role": "Role",
      "cancel": "Cancel",
      "submit": "Create User",
      "creating": "Creating..."
    },
    "roleForm": {
      "label": "User Role",
      "update": "Update Role",
      "updating": "Updating..."
    },
    "statusToggle": {
      "title": "Account Status",
      "currentStatus": "Current status:",
      "enable": "Enable Account",
      "disable": "Disable Account",
      "processing": "Processing..."
    },
    "toasts": {
      "createFailed": "Failed to create user",
      "roleUpdated": "Role updated successfully",
      "roleUpdateFailed": "Failed to update role",
      "accountEnabled": "User account enabled",
      "accountDisabled": "User account disabled",
      "statusUpdateFailed": "Failed to update account status"
    },
    "detail": {
      "back": "← Back to Users",
      "userInformation": "User Information",
      "phone": "Phone",
      "memberSince": "Member Since",
      "lastLogin": "Last Login",
      "addresses": "Addresses",
      "noAddresses": "No addresses added yet",
      "default": "Default",
      "activityStatistics": "Activity Statistics",
      "reviews": "Reviews",
      "wishlists": "Wishlists",
      "roleManagement": "Role Management",
      "accountControl": "Account Control",
      "userId": "User ID",
      "email": "Email",
      "role": "Role",
      "status": "Status",
      "copy": "Copy ID",
      "copied": "Copied",
      "inDatabase": "Synced to database",
      "clerkOnly": "Clerk only"
    }
  },
  categoryPage: {
    "views": {
      "tree": "Tree view",
      "table": "Table view"
    },
    "tree": {
      "processing": "Processing..."
    },
    "table": {
      "columns": {
        "name": "Name",
        "slug": "Slug",
        "path": "Path",
        "depth": "Depth",
        "actions": "Actions"
      },
      "empty": "No categories found."
    },
    "actions": {
      "edit": "Edit",
      "attributesAndFilters": "Attributes & filters",
      "delete": "Delete"
    },
    "confirm": {
      "deleteGeneric": "Are you sure you want to delete this category?",
      "deleteNamed": "Are you sure you want to delete \"{{name}}\"?"
    },
    "toasts": {
      "notAuthenticated": "Not authenticated",
      "moveFailed": "Failed to move category",
      "deleteFailed": "Failed to delete category"
    },
    "detail": {
      "errorPrefix": "Error",
      "loadFailed": "Failed to load",
      "notFound": "Category not found",
      "backToCategories": "Back to categories",
      "editTitle": "Edit category: {{name}}",
      "attributesHeading": "Attributes",
      "filtersHeading": "Category filters"
    },
    "attributes": {
      "add": "Add attribute",
      "empty": "No attributes defined yet.",
      "yes": "Yes",
      "no": "No",
      "errors": {
        "nameRequired": "Name is required",
        "keyInvalid": "Key must start with a letter and contain only lowercase letters, numbers, and underscores"
      },
      "toasts": {
        "saveFailed": "Failed to save attribute",
        "deleteFailed": "Failed to delete attribute"
      },
      "confirm": {
        "delete": "Are you sure you want to delete this attribute?"
      },
      "table": {
        "columns": {
          "name": "Name",
          "key": "Key",
          "type": "Type",
          "values": "Values",
          "filterable": "Filterable",
          "actions": "Actions"
        }
      },
      "types": {
        "select": "Select (dropdown)",
        "range": "Range (min-max)",
        "boolean": "Boolean (yes/no)",
        "text": "Text (free input)"
      },
      "form": {
        "addTitle": "Add attribute",
        "editTitle": "Edit attribute",
        "name": "Name",
        "namePlaceholder": "Screen size",
        "key": "Key",
        "keyPlaceholder": "screen_size",
        "type": "Type",
        "unit": "Unit",
        "unitPlaceholder": "inch, GB, etc.",
        "values": "Values (one per line)",
        "filterable": "Filterable",
        "required": "Required",
        "saving": "Saving...",
        "update": "Update",
        "add": "Add",
        "cancel": "Cancel"
      }
    }
  },
};

export type Resources = typeof en;

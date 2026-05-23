import Link from "next/link";

const footerLinks = {
    shop: {
        title: "Shop",
        links: [
            { label: "All Products", href: "/products" },
            { label: "New Arrivals", href: "/products?sort=createdAt:desc" },
            { label: "Best Sellers", href: "/products?sort=salesCount:desc" },
            { label: "Sale", href: "/products?onSale=true" },
        ],
    },
    support: {
        title: "Support",
        links: [
            { label: "Contact Us", href: "/contact" },
            { label: "FAQs", href: "/faq" },
            { label: "Shipping & Returns", href: "/shipping" },
            { label: "Order Tracking", href: "/orders" },
        ],
    },
    company: {
        title: "Company",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Blog", href: "/blog" },
            { label: "Press", href: "/press" },
        ],
    },
    legal: {
        title: "Legal",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Cookie Policy", href: "/cookies" },
        ],
    },
};

export function Footer() {
    return (
        <footer className="border-t border-neutral-200 bg-neutral-900">
            <div className="mx-auto max-w-container px-4 pt-16 pb-12 sm:px-6 lg:px-8">
                {/* Top section */}
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
                    {Object.values(footerLinks).map((section) => (
                        <div key={section.title}>
                            <h3 className="text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase">{section.title}</h3>
                            <ul className="mt-4 space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-neutral-500 transition hover:text-neutral-300">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="mt-12 border-t border-neutral-800 pt-8">
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase">Stay up to date</h3>
                            <p className="mt-1 text-sm text-neutral-500">Subscribe for updates and exclusive offers.</p>
                        </div>
                        <form className="flex w-full gap-0 sm:w-auto" action="#">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="w-full border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none sm:w-56"
                            />
                            <button
                                type="submit"
                                className="bg-white px-5 py-2.5 text-xs font-medium tracking-wider text-neutral-900 uppercase transition hover:bg-neutral-200"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row">
                    <p className="text-xs text-neutral-600">&copy; {new Date().getFullYear()} STORE. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        {[
                            {
                                label: "Twitter",
                                path: "M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17A4.77 4.77 0 0015.5 4c-2.65 0-4.8 2.15-4.8 4.8 0 .38.04.74.13 1.1A13.6 13.6 0 011.64 4.9a4.82 4.82 0 001.49 6.4A4.73 4.73 0 011 10.7v.06c0 2.33 1.65 4.27 3.84 4.7-.4.11-.83.17-1.27.17-.31 0-.61-.03-.9-.09.61 1.93 2.4 3.33 4.52 3.37a9.58 9.58 0 01-7.1 1.98A13.54 13.54 0 007.55 23c8.8 0 13.62-7.3 13.62-13.62 0-.21 0-.42-.02-.62.94-.68 1.75-1.52 2.4-2.49-.87.38-1.8.64-2.77.76z",
                            },
                            {
                                label: "Instagram",
                                path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.44.41.61.24 1.05.52 1.51.98.46.46.74.9.98 1.51.17.47.36 1.27.41 2.44.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.41 2.44-.24.61-.52 1.05-.98 1.51-.46.46-.9.74-1.51.98-.47.17-1.27.36-2.44.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.44-.41a4.08 4.08 0 01-1.51-.98 4.08 4.08 0 01-.98-1.51c-.17-.47-.36-1.27-.41-2.44C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.41-2.44.24-.61.52-1.05.98-1.51.46-.46.9-.74 1.51-.98.47-.17 1.27-.36 2.44-.41C8.84 2.17 9.22 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.79 5.79 0 00-2.11 1.37A5.79 5.79 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.72 1.47 1.37 2.11a5.79 5.79 0 002.11 1.37c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.79 5.79 0 002.11-1.37 5.79 5.79 0 001.37-2.11c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.79 5.79 0 00-1.37-2.11A5.79 5.79 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z",
                            },
                        ].map((social) => (
                            <a
                                key={social.label}
                                href="#"
                                aria-label={social.label}
                                className="text-neutral-600 transition hover:text-neutral-400"
                            >
                                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d={social.path} />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

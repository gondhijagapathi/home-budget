import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    Package2,
    LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";


const SideNav = () => {
    const location = useLocation();

    const navLinks = [
        {
            href: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/reports",
            label: "Reports",
            icon: LineChart,
        },
        {
            href: "/manage",
            label: "Manage",
            icon: Settings,
        },
    ];

    return (
        <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link to="/" className="flex items-center gap-2 font-semibold">
                        <Package2 className="h-6 w-6" />
                        <span className="">Home Budget</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    location.pathname === link.href && "bg-muted text-primary"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default SideNav;

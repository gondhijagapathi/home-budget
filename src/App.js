import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Home, Package2, PanelLeft, Settings, Moon, Sun, LineChart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDispatch, useSelector } from 'react-redux';

// Components
import SideNav from "./components/SideNav";
import AddItemDialog from "./components/AddItemDialog";
import { useTheme } from "./components/theme-provider";

// Pages
import DashboardPage from "./pages/DashboardPage";
import ManagePage from "./pages/ManagePage";
import ReportsPage from "./pages/ReportsPage";
import UploadReceiptsPage from "./pages/UploadReceiptsPage";

// Services & Store
import { financeService } from './services/financeService';
import { userService } from './services/userService';
import { setCategories, setAllSubCategories, setIncomeSources, setUsers, invalidateData } from './store/financeSlice'; // Actually users is in userSlice
import { setUsers as setUsersAction } from './store/userSlice';

const App = () => {
    const { setTheme } = useTheme();
    const dispatch = useDispatch();
    const lastUpdated = useSelector(state => state.finance.lastUpdated); // Listen to updates from finance slice
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch with high limit to populate "all" options for dropdowns
                // Re-fetched whenever lastUpdated changes to ensure consistent state
                const [categoriesRes, allSubCategoriesRes, usersRes, incomeSourcesRes] = await Promise.all([
                    financeService.getCategories(1, 1000),
                    financeService.getSubCategories(0, 1, 1000), // Check signature: getSubCategories(id, page, limit). ID 0 for all? Need to check service.
                    userService.getUsers(1, 1000),
                    financeService.getIncomeSources(1, 1000)
                ]);

                // Backend now returns { data: [...], ... } for paginated calls.
                dispatch(setCategories(categoriesRes.data || []));
                dispatch(setAllSubCategories(allSubCategoriesRes.data || []));
                dispatch(setUsersAction(usersRes.data || []));
                dispatch(setIncomeSources(incomeSourcesRes.data || []));
            } catch (error) {
                console.error("Failed to fetch initial data in App.js", error);
            }
        };

        fetchData();
    }, [dispatch, lastUpdated]);

    return (
        <Router>
            <div className="flex min-h-screen w-full flex-row bg-muted/40">
                <SideNav />
                <div className="flex flex-col flex-1">
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button size="icon" variant="outline" className="sm:hidden">
                                    <PanelLeft className="h-5 w-5" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[280px] sm:w-[300px] sm:max-w-xs">
                                <nav className="grid gap-6 text-lg font-medium">
                                    <Link
                                        to="#"
                                        className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                                        <span className="sr-only">Home Budget</span>
                                    </Link>
                                    <Link
                                        to="/"
                                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Home className="h-5 w-5" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/reports"
                                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <LineChart className="h-5 w-5" />
                                        Reports
                                    </Link>
                                    <Link
                                        to="/manage"
                                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-5 w-5" />
                                        Manage
                                    </Link>
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                            <div className="ml-auto flex-1 sm:flex-initial">
                                {/* Future header content can go here */}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                        <span className="sr-only">Toggle theme</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTheme("light")}>
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                                        Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")}>
                                        System
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AddItemDialog />
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/manage" element={<ManagePage />} />
                            <Route path="/upload-receipts" element={<UploadReceiptsPage />} />
                        </Routes>
                    </main>
                </div>
                <Toaster />
            </div>
        </Router>
    );
};

export default App;



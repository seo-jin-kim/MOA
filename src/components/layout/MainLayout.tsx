import {Outlet, useNavigate} from "react-router"
import {useState, useEffect} from "react";
import Header from "./Header.tsx"
import Sidebar from "./Sidebar.tsx";
import {layoutApi} from "../../apis/LayoutService.tsx";
import CalendarAlarm from "../../pages/mypage/CalendarAlarm.tsx";
import {useAuthStore} from "../../stores/useAuthStore.tsx";
import {useLocation} from "react-router-dom";

interface LayoutData {
    userName: string;
    employeeId: string;
    departmentName: string;
    gradeName: string;
    menuList: {
        menuId: number;
        menuTitle: string;
        menuNum: number;
        pagePath: string;
    }[];
}

const MainLayout = () => {

    const navigate = useNavigate();
    const location = useLocation();

    // 2. localStorage에서 저장값 가져오기
    // const [activeMenu, setActiveMenu] = useState<number>(() => {
    //     const saved = localStorage.getItem("activeMenu");
    //     return saved ? Number(saved) : 1;
    // });

    const { activeMenu, setActiveMenu } = useAuthStore();
    //추가 -> 메인페이지카드에서 다른 페이지로 이동할 때 navigate만 사용하면 url은 바뀌지만
    //activemenu는 그대로여서 사이드바가 안 바뀜 >> 그래서 쥬스탠드에 저장하고 바로 꺼내씀
    const [layoutData, setLayoutData] = useState<LayoutData>();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isMainPage = location.pathname === "/home";

    //뒤로가기 눌렀을 때 메인 사이드바가 1이 되도록
    useEffect(() => {
        if (location.pathname === '/home') {
            setActiveMenu(1);
        }
    }, [location.pathname, setActiveMenu]);

    // 1. localStorage에 activeMenu 저장하기
    // useEffect(() => {
    //     localStorage.setItem("activeMenu", String(activeMenu));
    // }, [activeMenu]);

// [2] 백엔드 데이터 호출 (세션 방식)

    useEffect(() => {
        const init = async () => {
            try {
                const data = await layoutApi();
                setLayoutData(data);
                console.log("레이아웃 데이터 로딩 완료", data);
            } catch (error) {
                console.error("레이아웃 데이터 로딩 실패:", error);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleMenuClick = (menuNum: number) => {
        setActiveMenu(menuNum);

        const paths: Record<number, string> = {
            1: '/home',
            2: '/my/profile',
            3: '/gw/approvals',
            4: '/admin/levels',
            5: '/hr/cards',
            6: '/inventory/status',
            7: '/sales/journals',
            8: '/base/form'

        };

        navigate(paths[menuNum] || '/home');
    };


    return (
        <div className="layout-wrapper">
            <Header
                userDept={layoutData?.departmentName || ""}
                activeMenu={activeMenu || 0}
                menuList={layoutData?.menuList || []}
                onMenuClick={handleMenuClick}
                onHamburgerClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="main-content-layout" style={{ display: 'flex', height:"100%" }}>
                {layoutData && (activeMenu !== 1 || isSidebarOpen) && (
                    <Sidebar
                        activeMenu={activeMenu}
                        layoutData={layoutData}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onMenuClick={handleMenuClick}
                    />
                )}
                <main className={isMainPage ? "main-home" : "main"}>
                    <Outlet />
                </main>
                
            </div>
            <CalendarAlarm/>
        </div>
    )
}

export default MainLayout
import { useNavigate } from "react-router";
import {useState} from "react";
import "../../assets/styles/layout.css";
import {logoutApi} from "../../apis/LoginService.tsx";
import {useAuthStore} from "../../stores/useAuthStore.tsx";
import {IoLogOutOutline} from "react-icons/io5";
import {SlArrowDown} from "react-icons/sl";

interface CategoryConfig {
    id: string;
    title: string;
    keywords: string[];
}

interface MenuData {
    userName:string;
    employeeId:string;
    departmentName:string;
    gradeName:string;

    menuList:{
        menuId: number;
        menuTitle: string;
        menuNum: number;
        pagePath: string;
    }[];
}

interface SidebarProps {
    layoutData: MenuData;
    activeMenu: number;
    isOpen: boolean;
    onClose: () => void;
    onMenuClick: (menuNum: number) => void;
}

const Sidebar = ({layoutData, activeMenu,isOpen, onClose, onMenuClick}:SidebarProps) => {
    const navigate = useNavigate();
    const [openMainMenu, setOpenMainMenu] = useState<number | null>(null);
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const { logout } = useAuthStore();

    const uniqueMainMenus = layoutData.menuList.filter((item, index, self) =>
        index === self.findIndex((t) => t.menuNum === item.menuNum)

    )
        .sort((a, b) => a.menuNum - b.menuNum);

    const handleMainMenuClick = (menuNum: number) => {
        setOpenMainMenu(openMainMenu === menuNum ? null : menuNum);
        setOpenCategory(null);
        onMenuClick(menuNum);
    };
    const handleSubMenuClick = (pagePath: string) => {
        navigate(pagePath);
        onClose();
    };
    const handleCategoryClick = (catId: string) => {
        setOpenCategory(openCategory === catId ? null : catId);
    };

    const mainMenuData: Record<number, { name: string; depts: string | string[] }> = {
        2: {name: 'My page', depts: 'all'},
        3: {name: '그룹웨어', depts: 'all'},
        4: {name: '관리', depts: ['이사회']},
        5: {name: '인사', depts: ['인사-1팀', '이사회']},
        6: {name: '물류', depts: ['물류-1팀', '이사회']},
        7: {name: '영업', depts: ['영업-1팀', '이사회']},
        8: {name: '기본사항', depts: 'all'}
    };


    // 상위메뉴
    const categorys:Record<number, CategoryConfig[]> = {

        2: [ // 마이페이지
            { id: 'my-info',title:'내정보',keywords:['profile','approvals','calendars']}
        ],
        3: [ // 그룹웨어
            { id: 'gw-request',title:'신청',keywords:['approvals']},
            { id: 'gw-forms',title:'양식',keywords:['approvalForms']},
            { id: 'gw-wait',title:'결재대기',keywords:['approvalWait']},
            { id: 'gw-member',title:'소속팀원관리',keywords:['teamMembers']}
        ],
        4: [ // 관리자
            { id: 'admin',title:'정보관리',keywords:['levels']}
        ],
        5: [ // 인사
            { id: 'hr-pay', title: '급여관리', keywords: ['attendances'] },
            { id: 'hr-leavers', title: '퇴사자관리', keywords: ['leavers'] },
            { id: 'hr-info', title: '인사관리', keywords: ['cards', 'certificates', 'evaluations', 'payroll'] },
            { id: 'hr-work', title: '근태관리', keywords: ['approvalWait', 'annualLeaves', 'Print'] }
        ],
        6: [ // 물류
            { id: 'inven-status', title: '재고현황', keywords: ['status', 'disposals'] },
            { id: 'inven-bounds', title: '구매관리', keywords: ['orders', 'inbounds','outbounds'] }
        ],
        7: [ // 영업
            { id: 'sales-jour', title: '회계거래관리', keywords: ['journals'] },
            { id: 'inven-tax', title: '전자세금계산서', keywords: ['taxInv'] },
            { id: 'inven-expense', title: '월별매입집계표', keywords: ['expense'] },
            { id: 'inven-revenue', title: '월별매출집계표', keywords: ['revenue'] }
        ],
        8: [ // 기본사항
            { id: 'base-hr', title: '인사', keywords: ['allow','dept'] },
            { id: 'base-inven', title: '재고관리', keywords: ['whse','item','partner'] },
            { id: 'base-sales', title: '영업', keywords: ['account'] },
            { id: 'base-gw', title: '그룹웨어', keywords: ['form'] },
            { id: 'base-admin', title: '관리자', keywords: ['role'] }
        ]
    };

    const currentConfig = categorys[activeMenu] || [];
    const rawMenus = layoutData.menuList.filter(item => item.menuNum === activeMenu);

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose}/>}
            <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-user-card">
                    <div className="user-avatar-circle">
                        {layoutData.userName ? layoutData.userName[0] : "U"}
                    </div>
                    <div className="user-info-detail">
                        <div className="user-name-row">
                            <span className="u-name">{layoutData.userName}님</span>
                        </div>
                        <p className="u-sub-info">
                            {layoutData.departmentName} | {layoutData.gradeName} | {layoutData.employeeId}
                        </p>
                    </div>
                </div>
                {isOpen && (
                    <ul className="sidebar-main-menu">
                        <li
                            className={`sidebar-main-item ${activeMenu === 1 ? 'is-Active' : ''}`}
                            onClick={() => { onMenuClick(1); onClose(); }}
                        >
                            홈
                        </li>
                        {uniqueMainMenus.map((item) => {
                            const config = mainMenuData[item.menuNum];
                            if (!config) return null;
                            const hasAccess = config.depts === 'all' ||
                                (Array.isArray(config.depts) && config.depts.includes(layoutData.departmentName));
                            if (!hasAccess) return null;
                            const isMainOpen = openMainMenu === item.menuNum;
                            const subConfig = categorys[item.menuNum] || [];
                            const subRawMenus = layoutData.menuList.filter(m => m.menuNum === item.menuNum);

                            return (
                                <li key={item.menuId}>
                                    <div
                                        className={`sidebar-main-item ${activeMenu === item.menuNum ? 'is-Active' : ''}`}
                                        onClick={() => handleMainMenuClick(item.menuNum)}
                                    >
                                        <span style={{flex: 1}}>{config.name}</span>
                                        <span className="icon-Arrow">
                                            {isMainOpen
                                                ? <SlArrowDown/>
                                                : <SlArrowDown style={{transform: "rotate(270deg)"}}/>
                                            }
                                        </span>
                                    </div>
                                    {isMainOpen && (
                                        <ul className="sidebar-sub-menu">
                                            {subConfig.map((cat) => {
                                                const subItems = subRawMenus.filter(menu =>
                                                    cat.keywords.some(key => menu.pagePath.includes(key))
                                                );
                                                if (subItems.length === 0) return null;
                                                const isCatOpen = openCategory === cat.id;
                                                return (
                                                    <li key={cat.id}>
                                                        <div
                                                            className={`sidebar-sub-item ${isCatOpen ? 'is-Active' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCategoryClick(cat.id);
                                                            }}
                                                        >
                                                            <span style={{flex: 1}}>{cat.title}</span>
                                                            <span className="icon-Arrow" style={{fontSize: "10px"}}>
                                                                {isCatOpen
                                                                    ? <SlArrowDown/>
                                                                    : <SlArrowDown style={{transform: "rotate(270deg)"}}/>
                                                                }
                                                            </span>
                                                        </div>
                                                        {isCatOpen && (
                                                            <ul className="sidebar-leaf-menu">
                                                                {subItems.map((sub, idx) => (
                                                                    <li
                                                                        key={idx}
                                                                        className={`sidebar-leaf-item ${location.pathname === sub.pagePath ? 'is-Active' : ''}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSubMenuClick(sub.pagePath);
                                                                        }}
                                                                    >
                                                                        {sub.menuTitle}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}


                <ul className="side-menu-List">
                    {currentConfig.map((cat) => {
                        // 현재 카테고리 키워드와 일치하는 소메뉴들 소집
                        const subItems = rawMenus.filter(menu =>
                            cat.keywords.some(key => menu.pagePath.includes(key))
                        );

                        // 해당 카테고리에 해당하는 메뉴가 없으면 렌더링 안 함
                        if (subItems.length === 0) return null;

                        const isOpen = openCategory === cat.id;
                        return (
                            <li key={cat.id} className="side-menu-Group">
                                {/* 상위 카테고리 (클릭 시 토글) */}
                                <div
                                    className={`side-menu-Item group-Title ${isOpen ? 'is-Active' : ''}`}
                                    onClick={() => handleCategoryClick(cat.id)}
                                >
                                    <span className="icon-Arrow">{isOpen ? <SlArrowDown/> : <SlArrowDown style={{transform:"rotate(270deg)"}} />}</span>
                                    {cat.title}
                                </div>
                                {isOpen && (
                                    <ul className="sub-menu-List">
                                        {subItems.map((sub, idx) => (
                                            <li
                                                key={idx}
                                                className={`sub-menu-Item ${location.pathname === sub.pagePath ? 'is-Active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 부모 클릭 이벤트 방지
                                                    navigate(sub.pagePath);
                                                }}
                                            >
                                                {sub.menuTitle}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <div className="sidebar-footer" onClick={async () => {
                    await logoutApi();
                    logout();
                    navigate("/");
                }}>
                    <span>로그아웃</span>
                    <span><IoLogOutOutline className="icon-logout"/></span>
                </div>
            </aside>
        </>
    )
}

export default Sidebar;

import '../../assets/styles/layout.css';
import {RxHamburgerMenu} from "react-icons/rx";

interface HeaderProps {
    menuList: any[];
    userDept: string;
    activeMenu: number; // 현재 활성화된 메뉴 번호
    onMenuClick: (menuId: number) => void; // 부모의 setActiveMenu를 실행할 함수
    onHamburgerClick: () => void;
}



const Header = ({menuList, userDept, onMenuClick,onHamburgerClick}:HeaderProps) => {

    // || !userDept 부서명이 없는 경우도 있어서 삭제

  if (!menuList || menuList.length === 0 ) {
        return <header>로딩 중...</header>;
  }

  const menuData:Record<number, {name: string; depts: string | string[]}> = { // id는 메뉴 테이블의 menu_num 참고
      2: {name: 'My page', depts: 'all'},
      3: {name: '그룹웨어', depts: 'all'},
      4: {name: '관리', depts: ['이사회']},
      5: {name: '인사', depts: ['인사-1팀', '이사회']},
      6: {name: '물류', depts: ['물류-1팀', '이사회']},
      7: {name: '영업', depts: ['영업-1팀', '이사회']},
      8: {name: '기본사항', depts: 'all'}
  };

    const uniqueMenuList = Array.isArray(menuList)
        ? menuList.filter((item, index, self) =>
            index === self.findIndex((t) => t.menuNum === item.menuNum)
        )
            .sort((a, b) => a.menuNum - b.menuNum)
        : []

    return (
    <header className="header-container">
        <div className="header-left">
            <div className="header-logo" onClick={()=>onMenuClick(1)}>MOA</div>
                <ul className="header-nav">
                    {Array.isArray(uniqueMenuList) && uniqueMenuList.map((item) => {
                        const config = menuData[item.menuNum];
                        if (!config) return null;
                        console.log(userDept);
                        const hasAccess = config.depts === 'all' ||
                            (Array.isArray(config.depts) && config.depts.includes(userDept));

                        if (!hasAccess) return null;

                        return (
                            <li
                                key={item.menuId}
                                className="header-nav-item"
                                onClick={() => onMenuClick(item.menuNum)}
                            >
                                {config.name}
                            </li>
                        );
                    })}
                </ul>
            </div>
        <div className="header-hamburger" onClick={onHamburgerClick}>
            <RxHamburgerMenu size={19}/>
        </div>
    </header>
  );
}

export default Header;

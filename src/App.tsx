import {useNavigate, useLocation , Route, Routes} from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import {useAuthStore} from "./stores/useAuthStore.tsx";
import {useEffect, useState} from "react";
import {authCheck} from "./apis/LoginService.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import MainPage from "./pages/main/MainPage.tsx";
import axios from "axios";
import Base from "./pages/base/Base.tsx";
import Admin from './pages/admin/Admin.tsx';
import HRLists from "./pages/hr2/HRLists.tsx";
import HrCardListPage from "./pages/hr/HrCardListPage.tsx";
import LeaverCardListPage from "./pages/hr/LeaverCardListPage.tsx";
import CertificatesCardListPage from "./pages/hr/CertificatesCardListPage.tsx";
import EvaluationsCardListPage from "./pages/hr/EvaluationsCardListPage.tsx";
import PayRollListPage from "./pages/hr/PayRollListPage.tsx";

// import SalesJournals from "./pages/sales/SalesJournals.tsx";
// import TaxInvoicePage from "./pages/sales/TaxInvoicePage.tsx";
// import MonthlyExpensePage from "./pages/sales/MonthlyExpensePage.tsx";
// import MonthlyRevenuePage from "./pages/sales/MonthlyRevenuePage.tsx";

// 라우터 모움
import InventoryRouter from "./routes/InventoryRoutes.tsx";
import GwRouter from './routes/GwRoutes.tsx';
import SalesRoutes from "./routes/SalesRoutes.tsx";
import MyRoutes from "./routes/MyRoutes.tsx";
import HRCalendar from './pages/hr2/HRCalendar.tsx';


const App = () => {
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true)
    
  
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
    fetch('/api/')
        .then(() => console.log('서버가 깨어났습니다.'))
        .catch(err => console.error('깨우기 실패:', err));
    }, []);


    useEffect(()=>{
        authCheck()
            .then((data) => {
                login(data);
                 if (location.pathname === "/") {
                    navigate("/", { replace: true });
                }
            })
            .catch((error)=>{
                if(axios.isAxiosError(error) && error.response?.status === 401) {
                    if (location.pathname !== "/") {
                     navigate("/", { replace: true });
                    }
                }else{
                    console.error("authCheck error",error);
                }
            })
            .finally(()=>{
                setIsLoading(false)
            });
    },[login, navigate, location.pathname]);

    if (isLoading) return <span>로딩중</span>;

    return (
    <>
        <Routes>
                <Route path="/" element={<Login/>} />

                <Route element={<PrivateRoute />}>

                    <Route element={<MainLayout />}>

                        <Route path="/home" element={<MainPage />} />
                        <Route path="/my/*" element={<MyRoutes />} />
                        <Route path="/base/:type" element={<Base />} />
                        <Route path="/admin/levels" element={<Admin />} />
                        <Route path="/hr/annualLeaves" element={<Base apiType="annualLeaves" />} />
                        <Route path="/hr/:type" element={<HRLists />} />
                    </Route>
                </Route>

                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/hr">
                            {/* 윤아 */}
                             <Route path="attendances/calendar" element={<HRCalendar />} />

                            {/* 성현 */}
                            <Route path="cards" element={<HrCardListPage />} />
                            <Route path="leavers" element={<LeaverCardListPage />} />
                            <Route path="certificates" element={<CertificatesCardListPage />} />
                            <Route path="evaluations" element={<EvaluationsCardListPage />} />
                            <Route path="payroll" element={<PayRollListPage />} />
                        </Route>
                    </Route>
                </Route>


                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/inventory/*" element={<InventoryRouter />} />
                        <Route path="/gw/*" element={<GwRouter />} />
                        <Route path="/sales/*" element={<SalesRoutes />} />
                    </Route>
                </Route>
                
            
            
            

            

        </Routes>    
    </>
  )
}

export default App

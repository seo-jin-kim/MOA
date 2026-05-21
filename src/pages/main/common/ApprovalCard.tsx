import {MdRefresh} from "react-icons/md";
import "../../../assets/styles/main/mainPage.css"
import {useNavigate} from "react-router";
import {useGetApprovaUserList} from "../../../apis/ApprovalsService.tsx";
import {useAuthStore} from "../../../stores/useAuthStore.tsx";

const ApprovalCard = () => {

    const navigate = useNavigate();
    const { user, setActiveMenu } = useAuthStore();

    const goToApprovals = () => {
        setActiveMenu(2);
        navigate("/my/approvals");
    };

    const {data, refetch} = useGetApprovaUserList(user?.userId ?? 0, "", 0, 100);

    const items = data?.content ?? [];
    const waiting  = items.filter((a: any) => a.approvaStatus === "대기").length;
    const rejected = items.filter((a: any) => a.approvaStatus === "반려").length;
    const done     = items.filter((a: any) => a.approvaStatus === "결재").length;
    return(
        <div className="main-Card">
            <div className="card-Header">
                <p>내 결재근황</p>
                <MdRefresh size={19}
                           color="lightgray"
                           onClick={() => void refetch()}
                />
            </div>
            <div className="card-Inner approvalCard-Inner">
                <button className="approval-Item" onClick={goToApprovals}>
                    <span>진행중</span>
                    <span>{waiting}건</span>
                </button>
                <button className="approval-Item" onClick={goToApprovals}>
                    <span>반려</span>
                    <span>{rejected}건</span>
                </button>
                <button className="approval-Item" onClick={goToApprovals}>
                    <span>결재</span>
                    <span>{done}건</span>
                </button>
            </div>
        </div>
    )
}
export default ApprovalCard;
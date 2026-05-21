import {BiLinkExternal} from "react-icons/bi";
import {MdRefresh} from "react-icons/md";
import React from "react";
import {useNavigate} from "react-router";
import {useAuthStore} from "../../../stores/useAuthStore.tsx";

interface TeamLayoutProps{
    children?:React.ReactNode;
    title:string;
    linkTo?:string;
    onRefresh?: () => void;
}
const TeamLayout = ({children, title, linkTo, onRefresh}:TeamLayoutProps) => {

    const navigate = useNavigate();
    const { setActiveMenu } = useAuthStore();

    const handleLink = () => {
        if (!linkTo) return;
        if (linkTo.startsWith('/hr')) setActiveMenu(5);
        else if (linkTo.startsWith('/inventory')) setActiveMenu(6);
        else if (linkTo.startsWith('/sales')) setActiveMenu(7);
        else if (linkTo.startsWith('/my')) setActiveMenu(2);
        navigate(linkTo);
    };
    return(
        <>
            <div className="team-Header">
                <p>{title}</p>
                <div className="Header-Icon">
                    {linkTo && (
                        <BiLinkExternal
                            size={16}
                            color="#d0d0d0"
                            onClick={handleLink}
                        />
                    )}
                    {onRefresh && (
                        <MdRefresh
                            size={19}
                            color="#d0d0d0"
                            onClick={onRefresh}
                        />
                    )}
                </div>
            </div>
            {children}
        </>
    )
}
export default TeamLayout;
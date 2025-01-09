import { useEffect, useState } from "react"

export const useMobileView = () => {
    const [mobile, setMobile] = useState<boolean>(false);

    useEffect(() => {
        if (screen.availWidth <= 1024) {
            setMobile(true);
        }
    }, [])

    return mobile;
}
import { FC } from "react"
import { CustomButton } from "../custombutton/custombutton"
import sectionHeaderStyle from './sectionheader.module.css'

interface SectionHeaderProps {
    buttonText?:string
    heading?:string
    description?:string
}

export const SectionHeader:FC<SectionHeaderProps> = ({buttonText, heading, description}) => {
    return (
        <>
           {buttonText && <CustomButton className="section_heading_button" text={buttonText} /> }
            <div className={sectionHeaderStyle.section_header}>{heading}</div>
            {description && <div className={sectionHeaderStyle.description}>{description}</div>}
        </>
    )
}
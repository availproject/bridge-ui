/* eslint-disable @next/next/no-img-element */
import { FC } from 'react';
import Link from 'next/link';

import footersection from './FooterSection.module.css'
import { Button } from '../../ui/button';
import { EXTERNAL_URLS } from '@/constants/externalUrls';

interface FooterSectionProps {
    title:string
    description:string
}

export const FooterSection:FC<FooterSectionProps> = ({ title, description }) => {
    return (<>
    <div className='mt-16'></div>
        <div className={footersection.footer_section}>
            <img src={"/images/desktop/grow.png"} alt='avail logo'/>
            <div className='!text-white !text-opacity-80'>{title}</div>
            <div className={`!text-white !text-opacity-80 pb-12`}>{description}</div>
            
                <div className={footersection.footer_section_button}>
                    <Link href={EXTERNAL_URLS.DOCUMENTATION} target='_blank'>
                        <Button className="solution_button z-50 py-3 px-6 m-2 bg-[#3CA3FC] rounded-full font-thicccboisemibold  ">See Documentation</Button>
                    </Link>
                    <Link href={EXTERNAL_URLS.NETWORK} target='_blank'>
                        <Button className={'solution_button z-50 py-4 px-6 m-2 bg-white rounded-full !text-black font-thicccboisemibold '}>Try it now</Button>
                    </Link>
                </div>
            
        </div>
        </>
    )
}

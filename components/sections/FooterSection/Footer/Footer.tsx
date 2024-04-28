"use client"

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import footerStyle from './Footer.module.css'
import { ROUTES } from '../../../../utils/routes'
import Image from 'next/image'
import { useMemo } from 'react'
import { useMobileView } from '@/hooks/useMobileView'

interface SubLinkTypes {
    id:number
    label:string
    inActive?:boolean
    isInternal?:boolean
    link:string
}

interface FooterLinkTypes {
    id:number
    label:string
    inActive?:boolean
    subLinks:SubLinkTypes[]
}

export const Footer = () => {
    const isMobile = useMobileView();

    const footerLinks:FooterLinkTypes[] = [
        {
            id:1,
            label:'Platform',
            inActive:true,
            subLinks:[
                {
                    id:1,
                    label:'Overview',
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:2,
                    label:'Sovereign Rollups',
                    link:ROUTES.HOMEPAGE
                },
            ]
        },
        {
            id:3,
            label:'Developers',
            subLinks:[
                {
                    id:1,
                    label:'Developer Center',
                    isInternal:true,
                    link:ROUTES.DEVELOPERS
                },
                {
                    id:2,
                    label:'Guides',
                    inActive:true,
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:3,
                    label:'API Docs',
                    link:ROUTES.API_DOCS
                },
                {
                    id:4,
                    label:'Validators',
                    link:ROUTES.VALIDATOR
                },
                {
                    id:5,
                    label:'Faucet',
                    link:ROUTES.FAUCET
                },
                {
                    id:6,
                    label:'Explorer',
                    link:ROUTES.EXPLORER
                },
                {
                    id:7,
                    label:'Login',
                    inActive:true,
                    link:ROUTES.HOMEPAGE
                }
            ]
        },
        {
            id:4,
            label:'Company',
            subLinks:[
                {
                    id:1,
                    label:'About',
                    isInternal:true,
                    link:ROUTES.ECOSYSTEM
                },
                {
                    id:2,
                    label:'Team',
                    inActive:true,
                    link:ROUTES.DEVELOPERS
                },
                {
                    id:3,
                    label:'Careers',
                    link:ROUTES.CAREERS
                },
                {
                    id:4,
                    label:'Partners',
                    inActive:true,
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:5,
                    label:'Community',
                    link:ROUTES.COMMUNITY
                },
                {
                    id:6,
                    label:'Privacy Policy',
                    isInternal:true,
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:7,
                    label:'Terms',
                    isInternal:true,
                    link:ROUTES.HOMEPAGE
                }
            ]
        },
        {
            id:2,
            label:'Validators',
            subLinks:[
                {
                    id:1,
                    label:'How it works',
                    link:ROUTES.WORKING
                },
                {
                    id:2,
                    label:'Become a validator',
                    link:ROUTES.BECOME_VALIDATOR
                }
            ]
        },
        {
            id:5,
            label:'Resources',
            subLinks:[
                {
                    id:1,
                    label:'Learn',
                    inActive:true,
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:2,
                    label:'Use cases',
                    inActive:true,
                    link:ROUTES.HOMEPAGE
                },
                {
                    id:3,
                    label:'Blog',
                    link:ROUTES.BLOG
                },
                {
                    id:4,
                    label:'Newsletter Signup',
                    link:"http://eepurl.com/it4xbs"
                },
                {
                    id:5,
                    label:'Reference Doc',
                    link:"https://github.com/availproject/data-availability/blob/master/reference%20document/Data%20Availability%20-%20Reference%20Document.pdf"
                }
            ]
        },
    ]

    const footerMobile = useMemo(() => {
        if (isMobile){
            return {
                front:('/images/mobile/footer_front.png'),
                back:('/images/mobile/footer_back.png')
            }
        }
        return {
            front:('/images/desktop/footer_front.png'),
            back:('/images/desktop/footer_back.png')
        }
    }, [isMobile]);

    return (
        <footer className={footerStyle.footer_container}>
             <img src={footerMobile.back} width={'100%'} alt={'Footer Back Design'}/>
            <div className={footerStyle.footer}>
                <div>
                    <Image src='/images/grow.png' width={120} height={112} alt='avail logo'/>
                    <p>The essential base layer for modern blockchains.</p>
                    <div>
                        <Link href={ROUTES.DISCORD} target='_blank' aria-label='dicord'>
                            <img src={"/images/discord_white.png"} width={'18px'} height={'14px'} alt='dicord' />
                        </Link>
                        <Link href={ROUTES.GITHUB} target='_blank' aria-label='github'>
                            <img src={"/images/github.png"} width={'16px'} height={'18px'} alt='github' />
                        </Link>
                        <Link href={ROUTES.TWITTER} target='_blank' aria-label='twitter'>
                            <img src={"/images/twitter.png"} width={'18px'} height={'15px'} alt='twitter' />
                        </Link>
                        <Link href={ROUTES.LINKEDIN} target='_blank' aria-label='linkedin'>
                            <img src={"/images/linkedin.png"} width={'17px'} height={'16px'} alt='linkedin' />
                        </Link>
                    </div>
                </div>
                <div className={footerStyle.footer_links}>
                {
                    footerLinks.filter((ele:FooterLinkTypes) => !ele.inActive).map((data:FooterLinkTypes) => {
                        return (
                            <div key={data.id} className={footerStyle.footer_main}>
                                <div>{data.label}</div>
                                {
                                    data.subLinks.filter((ele:SubLinkTypes) => !ele.inActive).map((link:SubLinkTypes) => {
                                        return (
                                            <Link href={link.link} key={link.id} target={link.isInternal ? '_self' : '_blank'}>{link.label}</Link>
                                        )
                                    })
                                }
                            </div>
                        )
                    })
                }
                </div>
            </div>
            <img src={footerMobile.front} width={'100%'} alt={'Footer Front Design'}/>
        </footer>
    )
}

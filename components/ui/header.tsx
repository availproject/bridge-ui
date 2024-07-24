
/* eslint-disable @next/next/no-img-element */
export default function NavBar() {
  
  return (
    <header className="w-full top-0 !z-50 flex flex-col justify-between items-center">
      <div className="w-full px-8 pt-1 pb-1 text-sm font-[450] text-center justify-center " style={{ backgroundColor: '#FFCC67' }}>We&apos;re currently updating the bridge UI. Things might not work perfectly for a little while, but don&apos;t worry - your funds are completely safe. Please check back in a while!</div>
      <div className="pt-4 space-x-4 w-screen flex flex-row items-center justify-center">
        <img
          alt="Avail logo"
          className="h-10 mt-2"
          height="40"
          src="/images/nav.svg"
        /> 
      </div>
    </header>
  );
}

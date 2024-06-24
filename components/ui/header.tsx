
/* eslint-disable @next/next/no-img-element */
export default function NavBar() {
  
  return (
    <header className="absolute  w-full top-0 !z-50 flex flex-row justify-between items-center py-4 px-8 ">
      <div className=" space-x-4 w-screen flex flex-row items-center justify-center">
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

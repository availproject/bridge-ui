import { Button } from "../ui/button";

/* eslint-disable @next/next/no-img-element */
export default function HeroSection (){

    return(
        <section className="lg:w-[70vw] md:w-[80vw]  mx-auto">
  <div className="flex flex-col items-center justify-center mt-[3vh]">
      <img
          src="images/availdark.png"
          alt="left image"
          className=""
        />
      </div>
      <div className="relative h-[40vh] -mt-[10vh] flex flex-col items-center justify-center max-md:px-3 mx-auto">
        <img
          src="images/introshapes.png"
          alt="left image"
          className="absolute left-0 top-auto -z-10 max-md:opacity-30"
        />
                  <div className="flex flex-col items-center justify-center">
            <h1 className="text-center sm:text-5xl text-4xl font-bold md:text-7xl xl:text-8xl mt-4  font-thicccboibold text-white tracking-tight ">
Claim your Avail Rewards
            </h1>
            <h1 className="text-center mt-5 text-md lg:text-2xl w-[90%] mx-auto font-normal font-thicccboiregular text-white text-opacity-80 px-4 ">
            Lorem ipsum dolor sit amet consectetur. Arcu pharetra nisl feugiat tempor non eget. Sagittis quis eget massa ac ultrices imperdiet vitae mattis pulvinar. Lacus mattis hendrerit et purus metus cum congue lorem. Nibh parturient mauris sed elementum scelerisque. Ac sapien in maecenas cursus tincidunt.
            </h1>
            <Button variant="primary" className="mt-8">Claim Now</Button>
          </div>
        <img
          src="images/introshapes.png"
          alt="right image"
          className="absolute right-0 top-auto -z-10 max-md:opacity-30 rotate-180"
        />
      </div>
      <div className="h-[10vh]"></div>
        </section>
    );
}
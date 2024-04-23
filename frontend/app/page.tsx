import BridgeSection from "@/components/sections/bridgesection";

export default function Home() {
  return (
    <main className="">
      <div className="relative h-screen w-screen items-center justify-center flex flex-col">
        {/* <img
          src="/images/bg2.png"
          alt="ok"
          className="absolute h-screen w-screen object-fill opacity-80 !rounded-xl"
        /> */}
        <section className="z-50 flex flex-row items-center justify-center space-x-[2vw]">
          <BridgeSection />
        </section>
        </div>
    </main>
  );
}

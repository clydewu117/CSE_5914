import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center ">
        <Image
          className=""
          src="/peakform-circular-title.png"
          alt="PeakForm logo"
          width={180}
          height={38}
          priority
        />
        <ul className="font-mono list-inside text-base/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em] geologica-font text-center">
            Design personalized workout plans that work for you.
          </li>
          <li className="tracking-[-.01em] geologica-font">
            Hit the button below to start your journey towards your peak.
          </li>
        </ul>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center text-background gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--foreground) 0%, #1f7dc0ff 100%)",
              color: "white",
            }}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deploy now
          </a>
        </div>
      </main>
    </div>
  );
}
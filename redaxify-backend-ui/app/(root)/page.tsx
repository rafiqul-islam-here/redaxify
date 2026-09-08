import VideoLibrary from "@/components/VideoLibrary";

export default function Home() {
  return (
    <main>
      <VideoLibrary
        showStats={true}
        customHeader={
          <div>
            <h1 className="text-2xl font-bold">Your Video Library</h1>
          </div>
        }
      />
    </main>
  );
}

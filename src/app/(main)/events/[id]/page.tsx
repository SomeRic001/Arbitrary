"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import type {
  Event,
  TimelineItem,
  ContentSection,
  MediaItem,
} from "@/src/types/db";
import { extractYouTubeId, youtubeEmbedUrl } from "@/src/lib/youtube-url";

interface EventDetail extends Event {
  timelineItems: TimelineItem[];
  contentSections: (ContentSection & { mediaItems: MediaItem[] })[];
}

const EventContentPage = () => {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEvent(data.event);
        else setEvent(null);
      })
      .catch(() => setEvent(null))
      .finally(() => setIsLoading(false));
  }, [eventId]);

  // Only ever attempt the embed if the stored URL parses to a real video ID.
  // Anything empty/malformed falls straight through to the image — the page
  // can never break on this. Hooks must run unconditionally (before any
  // early return) to satisfy the Rules of Hooks.
  const youtubeVideoId = useMemo(
    () => extractYouTubeId(event?.youtubeUrl),
    [event?.youtubeUrl],
  );

  useEffect(() => {
    setVideoFailed(false);
  }, [youtubeVideoId]);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          Event Not Found
        </h1>
        <Link
          href="/events"
          className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: Date | string) => {
    if (!dateStr) return "---";
    return new Date(dateStr)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  const showVideo = Boolean(youtubeVideoId) && !videoFailed;

  const heroImageSrc =
    event.heroImageUrl ||
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="bg-white text-black min-h-screen selection:bg-[#FACC15] selection:text-black">
      <main>
        {/* Full-Page Hero: YouTube video when available, image otherwise */}
        <section className="relative w-full h-[90vh] overflow-hidden bg-black">
          {showVideo && youtubeVideoId ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="relative w-full h-full">
                <iframe
                  key={youtubeVideoId}
                  className="absolute inset-0 w-full h-full"
                  src={youtubeEmbedUrl(youtubeVideoId)}
                  title={`${event.title} — promotional video`}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onError={() => setVideoFailed(true)}
                />
              </div>
              <div className="absolute inset-0 opacity-70 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,black_100%)]" />
            </div>
          ) : (
            <img
              src={heroImageSrc}
              alt={event.title}
              className="w-full h-full object-cover opacity-80"
            />
          )}

          {/* Enhanced Bottom-to-Top Fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/40 pointer-events-none" />

          {/* Hero Content: Top-Center Aligned */}
          <div className="absolute inset-0 flex flex-col items-center pt-44 pointer-events-none">
            <div className="container mx-auto px-6 text-center animate-fade-in">
              <span className="bg-[#FACC15] text-black text-[10px] font-black px-6 py-2 rounded-full tracking-[0.3em] uppercase mb-8 inline-block shadow-2xl">
                {event.eventType}
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.8] text-white drop-shadow-2xl max-w-6xl mx-auto">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Back Button Floating */}
          <div className="absolute top-32 left-10 z-20">
            <Link
              href="/events"
              className="flex items-center gap-2 text-white/80 hover:text-[#FACC15] font-bold uppercase tracking-widest text-[10px] transition-all group px-4 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>
          </div>
        </section>

        {/* Content Section Below Image */}
        <div className="container mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column: Description & Highlights */}
            <div className="lg:col-span-9 space-y-16">
              <div className="flex flex-wrap gap-12 border-b border-black/5 pb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center text-[#FACC15]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Date
                    </p>
                    <p className="font-black text-xl">
                      {formatDate(event.eventDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center text-[#FACC15]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Location
                    </p>
                    <p className="font-black text-xl">{event.venue}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-2xl max-w-none">
                <p className="text-zinc-500 leading-relaxed whitespace-pre-line text-xl italic font-medium">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Right Column: Timeline */}
            <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit space-y-6">
              {event.timelineItems && event.timelineItems.length > 0 && (
                <div className="p-6 bg-zinc-50 rounded-3xl border border-black/5">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">
                    EVENT TIMELINE
                  </h3>
                  <div className="space-y-6">
                    {event.timelineItems.map(
                      (item: TimelineItem, i: number) => (
                        <div key={i} className="flex gap-4 items-start">
                          <span className="text-[10px] font-black text-[#FACC15] bg-black px-2 py-1 rounded-md min-w-[60px] text-center">
                            {item.time}
                          </span>
                          <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-tight leading-tight">
                            {item.description}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventContentPage;

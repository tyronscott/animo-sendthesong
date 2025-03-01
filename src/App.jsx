import React, { useEffect, useState } from "react";
import {
  Music,
  Send,
  Heart,
  User,
  Sparkles,
  Clock,
  ArrowRight,
  Headphones,
  MessageSquare,
  Search,
  Play,
  Calendar,
  Sparkle,
  ExternalLink,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { useToast } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (ensure these env variables are set)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

  function formatTimestamp(timestamp) {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days >= 1) {
      return new Date(timestamp).toLocaleDateString();
    } else if (hours >= 1) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes >= 1) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "a few seconds ago";
    }
  }

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentSongs, setSentSongs] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();


  const [loading, setLoading] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);

  // When the sentSongs state changes and there's no active search, update filteredSongs.
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSongs(sentSongs);
    }
  }, [sentSongs, searchQuery]);

  // Listen to changes in the search query with debounce and fetch filtered songs from the DB.
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery) {
        setLoading(true);
        const { data, error } = await supabase
          .from("sent_songs")
          .select("*")
          .ilike("recipientName", `%${searchQuery}%`)
          .order("timestamp", { ascending: false });
    
        if (error) {
          toast({
            title: "Error fetching songs",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setFilteredSongs(data);
        }
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, toast]);

  useEffect(() => {
    const fetchSentSongs = async () => {
      const { data, error } = await supabase
        .from("sent_songs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        toast({
          title: "Error fetching songs",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSentSongs(data);
      }
    };

    fetchSentSongs();
  }, []);

  // Most recent song is the first in the array
  const mostRecentSong = sentSongs[0];

  const handleSendSong = async () => {
    if (!youtubeUrl.trim() || !recipientName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a YouTube URL and a recipient name",
        variant: "destructive",
      });
      return;
    }

    const newSentSong = {
      recipientName: recipientName.trim(),
      youtubeUrl: youtubeUrl.trim(),
      message: message.trim(),
    };

    // Insert new record into Supabase
    const { error } = await supabase.from("sent_songs").insert(newSentSong);

    if (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your song. Try again.",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setSentSongs([newSentSong, ...sentSongs]);
    setIsDialogOpen(false);
    setYoutubeUrl("");
    setRecipientName("");
    setMessage("");

    toast({
      title: "Song sent!",
      description: `Your song was sent to ${recipientName} anonymously.`,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="material-header sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-full">
                <Music className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Send the Song
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="material-button bg-green-500 text-white hover:bg-green-600 font-medium px-6">
                  <Send className="mr-2 h-4 w-4" /> Share a Song
                </Button>
              </DialogTrigger>
              <DialogContent className="material-dialog sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-green-500" />
                    Share a YouTube Song
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-600">
                    Paste a YouTube link and share your favorite tune anonymously.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="youtubeUrl" className="text-sm font-medium text-gray-700">
                      YouTube URL
                    </Label>
                    <Input
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="material-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Recipient's Name
                    </Label>
                    <Input
                      id="name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Who is this song for?"
                      className="material-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message (Optional)
                    </Label>
                    <Input
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a personal message"
                      className="material-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSendSong}
                    className="material-button bg-green-500 hover:bg-green-600 text-white font-medium px-8"
                  >
                    Share Anonymously
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section relative py-12 md:py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <div className="material-pill bg-green-100 text-green-700 inline-block mb-4">
                <Sparkles className="h-3 w-3 inline mr-1" /> New Way to Send Songs
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
                Share <span className="text-green-500">Songs</span> to <span className="text-green-500">Lasallians</span> Anonymously
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Paste a YouTube link and send your favorite tune to someone without revealing your identity.
              </p>
              <Button
                className="material-button bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-6"
                onClick={() => setIsDialogOpen(true)}
              >
                <Send className="mr-2 h-5 w-5" /> Share Your First Song
              </Button>
            </div>
            <div className="md:w-1/2 flex items-center justify-center">
              {mostRecentSong ? (
                <div className="text-center">
                  <Music className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Most Recent Song
                  </h2>
                  <p className="text-lg text-gray-600">
                    Sent to {mostRecentSong.recipientName}:{" "}
                    <YouTubePreview url={mostRecentSong.youtubeUrl} />
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Music className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    No Songs Sent Yet
                  </h2>
                  <p className="text-lg text-gray-600">
                    Start by sharing your first song!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="wave-pattern">
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="shape-fill"
            ></path>
          </svg>
        </div>
      </section>

      {/* Main Content – Recently Shared Songs */}
      <main className="container mx-auto px-4 py-12 bg-white">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 flex items-center">
            {searchQuery ? (
              <>
                <User className="h-5 w-5 mr-2 text-green-500" />
                Songs for "{searchQuery}"
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2 text-green-500" />
                Recently Sent Songs
              </>
            )}
          </h2>
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500" />
              <Input
                className="material-input pl-12 pr-4 py-4"
                placeholder="Search for your name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading songs...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-2xl shadow-sm">
            <div className="bg-white p-4 rounded-full inline-flex animate-pulse-slow">
              <Headphones className="h-12 w-12 text-green-500" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">
              {searchQuery
                ? "No songs found for this recipient. Be the first to share one!"
                : "No songs have been sent yet. Start sending now!"}
            </p>
            <Button
              className="material-button mt-4 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-6"
              onClick={() => setIsDialogOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" /> Send a Song Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map((sentSong) => (
              <Card
                key={sentSong.id}
                className="material-card floating-card song-card-gradient border-0"
              >
                <CardHeader className="material-card-header">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800">
                        Sent Song
                      </CardTitle>
                      <CardDescription className="text-gray-600 font-medium pt-4">
                        <YouTubePreview url={sentSong.youtubeUrl} />
                      </CardDescription>
                    </div>
                    <Avatar className="material-avatar bg-white text-green-600 h-12 w-12 ring-2 ring-green-200">
                      <AvatarFallback>
                        <Music className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex items-center mb-3 bg-white/70 p-2 rounded-lg">
                    <User className="h-4 w-4 mr-2 text-green-500" />
                    <span className="font-semibold text-gray-800">
                      For: {sentSong.recipientName}
                    </span>
                  </div>
                  {sentSong.message && (
                    <div className="flex items-start mt-3 bg-white/70 p-3 rounded-lg">
                      <MessageSquare className="h-4 w-4 mr-2 text-green-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 italic font-medium">
                        "{sentSong.message}"
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimestamp(sentSong.timestamp)}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-green-100/50 bg-white/30 flex justify-between items-center py-4">
                  <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-1 rounded-full">
                    Sent anonymously
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover-text-green-700 hover:bg-green-50 rounded-full"
                  >
                    <Heart className="h-4 w-4 mr-1" /> Like
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 md:p-12 shadow-lg text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Send Your Favorite Songs?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
            Start sending YouTube songs anonymously today and share the music you love.
          </p>
          <Button
            className="material-button bg-white text-green-600 hover:bg-gray-100 font-medium px-8 py-6 text-lg"
            onClick={() => setIsDialogOpen(true)}
          >
            <Send className="mr-2 h-5 w-5" /> Send a Song Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="material-footer py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            Made by{" "}
            <a
              href="https://instagram.com/tyronscott_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              @tyronscott_
            </a>
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

function extractYouTubeID(url) {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7]?.length === 11) ? match[7] : null;
}

async function fetchVideoTitle(videoId) {
  try {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) return null;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }
    return null;
  } catch (error) {
    console.error("Error fetching YouTube title:", error);
    return null;
  }
}

function YouTubePreview({ url }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const videoId = extractYouTubeID(url);
  const [songTitles, setSongTitles] = useState({});
  
  useEffect(() => {
    async function getTitle() {
      if (!videoId) return;
      
      // Check if we already have the title cached
      if (songTitles[videoId]) {
        setTitle(songTitles[videoId]);
        return;
      }
      
      setLoading(true);
      const videoTitle = await fetchVideoTitle(videoId);
      setLoading(false);
      
      if (videoTitle) {
        // Update the cached titles
        setSongTitles(prev => ({...prev, [videoId]: videoTitle}));
        setTitle(videoTitle);
      }
    }
    
    getTitle();
  }, [videoId, songTitles]);
  
  if (!videoId) return <span className="text-green-600">{url}</span>;
  
  return (
    <div className="flex items-center space-x-2">
      <img 
        src={`https://img.youtube.com/vi/${videoId}/default.jpg`} 
        alt="Thumbnail" 
        className="w-10 h-10 object-cover rounded"
      />
      <div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-green-600 hover:underline flex items-center"
        >
          {loading ? (
            <span className="animate-pulse bg-gray-200 h-4 w-32 rounded"></span>
          ) : (
            <span>{title || "YouTube Video"}</span>
          )}
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
}
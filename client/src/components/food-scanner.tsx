import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cacheImage } from "@/lib/imageCache";
import CachedImage from "@/components/cached-image";

interface FoodScannerProps {
  userId: number;
  maxScans: number;
  scansUsed: number;
}

export default function FoodScanner({ userId, maxScans, scansUsed }: FoodScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const dataUrl = fileReader.result as string;
        setPreviewUrl(dataUrl);
        
        // Cache the preview image for faster access later
        const cacheKey = `preview_${Date.now()}`;
        cacheImage(cacheKey, dataUrl)
          .catch(err => console.error('Error caching preview image:', err));
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  // Clean up and cache preview URL when unmounting
  useEffect(() => {
    return () => {
      // Clean up preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please take or upload a photo first",
        variant: "destructive",
      });
      return;
    }

    if (scansUsed >= maxScans) {
      toast({
        title: "Scan limit reached",
        description: "You've reached your monthly scan limit. Upgrade to Pro for unlimited scans.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("userId", userId.toString());

      // Get the auth token from Supabase
      const supabaseAuth = JSON.parse(localStorage.getItem('sb-njxfkiparbdkklajlpyp-auth-token') || '{}');
      const accessToken = supabaseAuth?.access_token || '';
      
      // Upload the image with authorization header
      const response = await fetch("/api/scan/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await response.json();
      
      // Redirect to the result page
      setLocation(`/result/${data.scanId}`);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="lg:col-span-3">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        capture="environment"
      />
      
      {previewUrl ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full h-64 mb-4">
            <CachedImage
              src={previewUrl || ''}
              alt="Food preview"
              className="w-full h-full rounded-lg"
              height="16rem"
            />
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              "Analyzing..."
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Analyze Food
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col justify-center items-center h-64 bg-gray-50">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Take a photo or upload an image of your food</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={handleTakePhoto}
                className="w-full sm:w-auto"
              >
                <Camera className="mr-2 h-4 w-4" /> Take Photo
              </Button>
              <Button 
                variant="outline"
                onClick={handleUploadPhoto}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {maxScans > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Monthly Usage</span>
            <span className="font-medium text-gray-900">{scansUsed}/{maxScans} scans</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (scansUsed / maxScans) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

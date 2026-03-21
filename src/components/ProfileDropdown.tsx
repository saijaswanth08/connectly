import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, ImagePlus, Trash2, LogOut, X, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const fullName = profile?.name || user?.user_metadata?.full_name || user?.email || "User";
  const email = profile?.email || user?.email || "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = profile?.avatar_url || null;
  const createdAt = user?.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Please select a JPG or PNG image.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile photo updated!");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile photo removed.");
      setDeleteDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete photo.";
      toast.error(msg);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105">
            <Avatar className="h-8 w-8 cursor-pointer">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] rounded-xl shadow-lg">
          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
            <KeyRound className="mr-2 h-4 w-4" /> Account Security
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Profile Dialog */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Profile</DialogTitle>
            <DialogDescription>View your account details.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-24 w-24 border-2 border-border">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">{fullName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              {createdAt && (
                <p className="text-xs text-muted-foreground">Member since {createdAt}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setViewProfileOpen(false)}>
              Close
            </Button>
            <Button onClick={() => { setViewProfileOpen(false); setUploadDialogOpen(true); }}>
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Photo Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>Upload a JPG or PNG image.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-border"
                />
                <button
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground h-5 w-5 flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={handleFileSelect}
            />
            {!previewUrl && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Photo Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile photo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

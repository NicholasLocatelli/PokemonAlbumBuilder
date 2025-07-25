import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Lock, Mail, Shield, Activity, Trash2, UserX, Camera, Save, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  theme?: string;
  language?: string;
  emailNotifications?: boolean;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmailChange {
  newEmail: string;
  password: string;
}

interface ActivityLogEntry {
  id: number;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Profile update form state
  const [profileData, setProfileData] = useState<ProfileUpdate>({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    theme: user?.theme || "system",
    language: user?.language || "it",
    emailNotifications: user?.emailNotifications ?? true,
  });

  // Password change form state
  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Email change form state
  const [emailData, setEmailData] = useState<EmailChange>({
    newEmail: "",
    password: "",
  });

  // Fetch activity log
  const { data: activityLog, isLoading: isActivityLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ["/api/user/activity"],
    enabled: !!user,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChange) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("Le password non coincidono");
      }
      if (data.newPassword.length < 8) {
        throw new Error("La password deve essere di almeno 8 caratteri");
      }
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "Password cambiata",
        description: "La password è stata aggiornata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email change mutation
  const changeEmailMutation = useMutation({
    mutationFn: async (data: EmailChange) => {
      const res = await apiRequest("POST", "/api/user/change-email", data);
      return await res.json();
    },
    onSuccess: () => {
      setEmailData({ newEmail: "", password: "" });
      toast({
        title: "Email aggiornata",
        description: "Controlla la tua nuova email per verificarla.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore nel caricamento");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Avatar aggiornato",
        description: "La foto profilo è stata caricata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deactivate account mutation
  const deactivateAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/user/deactivate", { password });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account disattivato",
        description: "Il tuo account è stato disattivato.",
      });
      logoutMutation.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("DELETE", "/api/user/delete", { 
        password, 
        confirmation: "DELETE" 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato eliminato definitivamente.",
      });
      logoutMutation.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: "L'immagine deve essere inferiore a 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const formatActivityAction = (action: string) => {
    const actions: Record<string, string> = {
      'login': 'Accesso effettuato',
      'logout': 'Logout effettuato',
      'password_changed': 'Password modificata',
      'email_changed': 'Email modificata',
      'profile_updated': 'Profilo aggiornato',
      'avatar_updated': 'Avatar aggiornato',
      'account_created': 'Account creato',
      'email_verified': 'Email verificata',
      'password_reset_requested': 'Richiesta reset password',
      'password_reset_completed': 'Reset password completato',
    };
    return actions[action] || action;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p>Devi effettuare l'accesso per visualizzare il profilo.</p>
            <Link href="/auth">
              <Button className="mt-4">Accedi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Il mio profilo</h1>
        <p className="text-muted-foreground">Gestisci le impostazioni del tuo account</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sicurezza
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Attività
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Elimina Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni personali</CardTitle>
              <CardDescription>
                Aggiorna le tue informazioni personali e le preferenze del profilo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                  <AvatarFallback className="text-2xl">
                    {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {uploadAvatarMutation.isPending ? "Caricamento..." : "Cambia foto"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG o GIF. Massimo 5MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    L'username non può essere modificato.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-muted"
                    />
                    {user.emailVerified ? (
                      <Badge variant="default">Verificata</Badge>
                    ) : (
                      <Badge variant="destructive">Non verificata</Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayName">Nome visualizzato</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Il tuo nome"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Raccontaci qualcosa di te..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button 
                    onClick={() => updateProfileMutation.mutate(profileData)}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending ? "Salvando..." : "Salva modifiche"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Cambia password</CardTitle>
              <CardDescription>
                Assicurati che la tua password sia forte e sicura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Password attuale</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nuova password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Conferma nuova password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => changePasswordMutation.mutate(passwordData)}
                disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                {changePasswordMutation.isPending ? "Aggiornando..." : "Aggiorna password"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card>
            <CardHeader>
              <CardTitle>Cambia email</CardTitle>
              <CardDescription>
                Modifica l'indirizzo email associato al tuo account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="newEmail">Nuova email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="nuova@email.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="passwordConfirm">Conferma con password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <Button 
                onClick={() => changeEmailMutation.mutate(emailData)}
                disabled={changeEmailMutation.isPending || !emailData.newEmail || !emailData.password}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {changeEmailMutation.isPending ? "Aggiornando..." : "Aggiorna email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log delle attività</CardTitle>
              <CardDescription>
                Cronologia delle attività recenti del tuo account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <p>Caricamento attività...</p>
              ) : activityLog && activityLog.length > 0 ? (
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-4 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{formatActivityAction(activity.action)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString('it-IT')} • IP: {activity.ipAddress}
                        </p>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna attività registrata.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Elimina Account</CardTitle>
              <CardDescription>
                Azioni irreversibili che influenzano il tuo account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deactivate Account */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Disattiva account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Disattiva temporaneamente il tuo account. Potrai riattivarlo in seguito.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      Disattiva account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disattivare l'account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Il tuo account verrà disattivato temporaneamente. Potrai riattivarlo effettuando nuovamente l'accesso.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="deactivatePassword">Conferma con password</Label>
                        <Input
                          id="deactivatePassword"
                          type="password"
                          placeholder="La tua password"
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const passwordInput = document.getElementById('deactivatePassword') as HTMLInputElement;
                          if (passwordInput?.value) {
                            deactivateAccountMutation.mutate(passwordInput.value);
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Disattiva
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Delete Account */}
              <div className="border border-destructive rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-destructive">Elimina account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Elimina definitivamente il tuo account e tutti i dati associati. Questa azione è irreversibile.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Elimina account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminare definitivamente l'account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione è irreversibile. Tutti i tuoi dati, album e carte verranno eliminati definitivamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="deletePassword">Conferma con password</Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          placeholder="La tua password"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="deleteConfirm">Digita "DELETE" per confermare</Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const passwordInput = document.getElementById('deletePassword') as HTMLInputElement;
                          if (passwordInput?.value && deleteConfirmText === "DELETE") {
                            deleteAccountMutation.mutate(passwordInput.value);
                          }
                        }}
                        disabled={deleteConfirmText !== "DELETE"}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Elimina definitivamente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
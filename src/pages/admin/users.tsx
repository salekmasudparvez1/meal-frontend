import { useListUsers, useCreateUser, useUpdateUserRole, useResetUserPassword, useDeleteUser, getListUsersQueryKey, Role } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, MoreHorizontal, KeyRound, Trash2, UserCog, User, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Schema fix: Use coerce to handle string-to-number conversion from the input
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role),
  roomNumber: z.coerce
    .number({ invalid_type_error: "Room number is required" })
    .int()
    .min(1, "Room number must be at least 1"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        "Password must include uppercase, lowercase, and number",
      ),
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access, roles, and linked student accounts.</p>
        </div>
        
        <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Linked Student</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {user.studentId ? (
                        <div className="flex items-center text-sm">
                          <User className="mr-1 h-3 w-3 text-muted-foreground" />
                          {user.studentName}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <UserActions user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  switch (role) {
    case Role.SUPER_ADMIN:
      return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"><ShieldAlert className="mr-1 h-3 w-3" /> Admin</Badge>;
    case Role.MEAL_MANAGER:
      return <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"><Shield className="mr-1 h-3 w-3" /> Manager</Badge>;
    case Role.USER:
      return <Badge variant="secondary"><User className="mr-1 h-3 w-3" /> User</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createUser = useCreateUser();
  
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { 
      username: "", 
      email: "", 
      password: "",
      role: Role.USER,
      roomNumber: undefined as any,
    },
  });

  const onSubmit = (values: z.infer<typeof createUserSchema>) => {
    createUser.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User created", description: `${values.username} has been added.` });
        onOpenChange(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to create user.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create System User</DialogTitle>
          <DialogDescription>Add a new user with specific access permissions.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Role.USER}>User (Resident)</SelectItem>
                      <SelectItem value={Role.MEAL_MANAGER}>Meal Manager</SelectItem>
                      <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 101" 
                      {...field} 
                      // Ensure it returns a number or empty string to the form state
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({ user }: { user: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const resetPassword = useResetUserPassword();
  
  const [roleOpen, setRoleOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);

  const passForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onChangeRole = () => {
    updateUserRole.mutate({ userId: user.id, data: { role: selectedRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Role updated" });
        setRoleOpen(false);
      }
    });
  };

  const onResetPassword = (values: z.infer<typeof resetPasswordSchema>) => {
    resetPassword.mutate({ userId: user.id, data: { password: values.password } }, {
      onSuccess: () => {
        toast({ title: "Password reset successful", description: `Password updated for ${user.username}.` });
        setPassOpen(false);
        passForm.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Reset failed",
          description: err?.message || "Could not reset password.",
          variant: "destructive",
        });
      },
    });
  };

  const onDelete = () => {
    deleteUser.mutate({ userId: user.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deleted" });
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setRoleOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setPassOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the user account. Their linked student data (meals, deposits) will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-81.25">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update permissions for {user.username}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.USER}>User</SelectItem>
                <SelectItem value={Role.MEAL_MANAGER}>Meal Manager</SelectItem>
                <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button onClick={onChangeRole} disabled={updateUserRole.isPending || selectedRole === user.role}>
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passOpen} onOpenChange={setPassOpen}>
        <DialogContent className="sm:max-w-81.25">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {user.username}. Must include uppercase, lowercase, and number.
            </DialogDescription>
          </DialogHeader>
          <Form {...passForm}>
            <form onSubmit={passForm.handleSubmit(onResetPassword)} className="space-y-4">
              <FormField
                control={passForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setPassOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? "Resetting..." : "Reset"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}